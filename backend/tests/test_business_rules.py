"""
Business rule tests — the most important test file.
Each test documents and enforces exactly one invariant.
"""
import json
import pytest
from datetime import date

from app.models import Client, Project, Milestone, Approval
from app.extensions import db
from app.services.milestone_service import transition_status, get_valid_transitions
from app.services.project_service import (
    check_engagement_cap,
    update_project_status,
)
from app.errors import BusinessRuleError


# ── Milestone state machine ───────────────────────────────────────────────────

def test_milestone_cannot_skip_to_completed(client, sample_milestone):
    """pending → completed is not a valid transition; must go through the full workflow."""
    resp = client.post(
        f"/api/milestones/{sample_milestone.id}/transition",
        json={"status": "completed"},
    )
    assert resp.status_code == 422
    body = resp.get_json()
    assert body["error"]["code"] == "BUSINESS_RULE_VIOLATION"
    assert "pending" in body["error"]["message"]
    assert "completed" in body["error"]["message"]


def test_milestone_cannot_go_from_pending_to_pending_approval(client, sample_milestone):
    """pending → pending_approval skips in_progress; state machine must block it."""
    resp = client.post(
        f"/api/milestones/{sample_milestone.id}/transition",
        json={"status": "pending_approval"},
    )
    assert resp.status_code == 422
    assert resp.get_json()["error"]["code"] == "BUSINESS_RULE_VIOLATION"


def test_invalid_transition_error_lists_allowed_transitions(client, sample_milestone):
    """Error details must tell the caller which transitions ARE valid."""
    resp = client.post(
        f"/api/milestones/{sample_milestone.id}/transition",
        json={"status": "approved"},
    )
    body = resp.get_json()
    assert resp.status_code == 422
    details = body["error"]["details"]
    assert "allowed_transitions" in details
    assert details["allowed_transitions"] == ["in_progress"]


def test_milestone_full_approval_workflow(client, db, sample_project):
    """Happy path: pending → in_progress → pending_approval → approved → completed."""
    m = Milestone(
        project_id=sample_project.id, title="Full Flow",
        status="pending", due_date=date(2025, 6, 1), sort_order=1,
    )
    db.session.add(m)
    db.session.commit()
    mid = m.id

    def transition(status):
        r = client.post(f"/api/milestones/{mid}/transition", json={"status": status})
        assert r.status_code == 200, f"Transition to {status} failed: {r.get_json()}"
        return r.get_json()

    transition("in_progress")
    transition("pending_approval")

    # Approve via the /approve endpoint (requires approved_by)
    r = client.post(f"/api/milestones/{mid}/approve", json={
        "approved_by": "Alice", "decision": "approved",
    })
    assert r.status_code == 200
    assert r.get_json()["status"] == "approved"

    transition("completed")
    body = transition.__wrapped__ if hasattr(transition, "__wrapped__") else None

    # Verify completed_at was set
    final = client.get(f"/api/projects/{sample_project.id}/milestones").get_json()
    done = next(x for x in final if x["id"] == mid)
    assert done["status"] == "completed"
    assert done["completed_at"] is not None


def test_milestone_rejection_returns_to_in_progress(client, db, sample_project):
    """Rejecting an approval sends the milestone back to in_progress, not cancelled."""
    m = Milestone(
        project_id=sample_project.id, title="Reject Me",
        status="pending_approval", due_date=date(2025, 6, 1), sort_order=1,
    )
    db.session.add(m)
    db.session.commit()

    r = client.post(f"/api/milestones/{m.id}/approve", json={
        "approved_by": "Bob", "decision": "rejected",
    })
    assert r.status_code == 200
    assert r.get_json()["status"] == "in_progress"


def test_approve_endpoint_requires_approver_name(client, db, sample_project):
    """Approving without supplying approved_by must be rejected with 422."""
    m = Milestone(
        project_id=sample_project.id, title="No Name",
        status="pending_approval", due_date=date(2025, 6, 1), sort_order=1,
    )
    db.session.add(m)
    db.session.commit()

    r = client.post(f"/api/milestones/{m.id}/approve", json={"decision": "approved"})
    assert r.status_code == 422
    body = r.get_json()
    assert "approved_by" in str(body)


def test_approve_only_works_on_pending_approval_milestone(client, db, sample_project):
    """Calling /approve on a milestone that isn't pending_approval is a business rule error."""
    m = Milestone(
        project_id=sample_project.id, title="Not Pending",
        status="in_progress", due_date=date(2025, 6, 1), sort_order=1,
    )
    db.session.add(m)
    db.session.commit()

    r = client.post(f"/api/milestones/{m.id}/approve", json={
        "approved_by": "Alice", "decision": "approved",
    })
    assert r.status_code == 422
    assert r.get_json()["error"]["code"] == "BUSINESS_RULE_VIOLATION"


# ── Engagement cap ────────────────────────────────────────────────────────────

def test_engagement_cap_blocks_fourth_active_project(client, db, sample_client):
    """A client with 3 active projects must be blocked from creating a 4th."""
    for i in range(3):
        p = Project(
            client_id=sample_client.id, name=f"Active {i}",
            status="in_progress",
            start_date=date(2025, 1, 1), target_end_date=date(2025, 12, 31),
        )
        db.session.add(p)
    db.session.commit()

    r = client.post("/api/projects", json={
        "client_id": sample_client.id,
        "name": "Fourth Project",
        "start_date": "2025-01-01",
        "target_end_date": "2025-12-31",
    })
    assert r.status_code == 422
    body = r.get_json()
    assert body["error"]["code"] == "BUSINESS_RULE_VIOLATION"
    assert "3" in body["error"]["message"]


def test_engagement_cap_allows_completed_projects_not_counted(client, db, sample_client):
    """Completed/cancelled projects don't count toward the cap; a 4th CAN be created."""
    for i in range(3):
        p = Project(
            client_id=sample_client.id, name=f"Done {i}",
            status="completed",  # not active
            start_date=date(2025, 1, 1), target_end_date=date(2025, 6, 1),
            actual_end_date=date(2025, 6, 1),
        )
        db.session.add(p)
    db.session.commit()

    r = client.post("/api/projects", json={
        "client_id": sample_client.id,
        "name": "New Active",
        "start_date": "2025-01-01",
        "target_end_date": "2025-12-31",
    })
    assert r.status_code == 201


def test_engagement_cap_mixed_statuses(client, db, sample_client):
    """2 active + 1 on_hold = 2 active; creating another active project should succeed."""
    statuses = ["in_progress", "planning", "on_hold"]
    for i, s in enumerate(statuses):
        p = Project(
            client_id=sample_client.id, name=f"P{i}", status=s,
            start_date=date(2025, 1, 1), target_end_date=date(2025, 12, 31),
        )
        db.session.add(p)
    db.session.commit()

    r = client.post("/api/projects", json={
        "client_id": sample_client.id,
        "name": "Another Active",
        "start_date": "2025-01-01",
        "target_end_date": "2025-12-31",
    })
    assert r.status_code == 201


# ── Project completion rules ──────────────────────────────────────────────────

def test_project_cannot_complete_with_incomplete_milestones(client, db, sample_project):
    """PATCH project status=completed must fail when any milestone is not completed."""
    m = Milestone(
        project_id=sample_project.id, title="Unfinished",
        status="in_progress", due_date=date(2025, 6, 1), sort_order=1,
    )
    db.session.add(m)
    db.session.commit()

    r = client.patch(f"/api/projects/{sample_project.id}", json={"status": "completed"})
    assert r.status_code == 422
    assert r.get_json()["error"]["code"] == "BUSINESS_RULE_VIOLATION"


def test_project_completion_sets_actual_end_date(client, db, sample_project):
    """Completing a project with all milestones done must set actual_end_date to today."""
    from datetime import date as _date
    r = client.patch(f"/api/projects/{sample_project.id}", json={"status": "completed"})
    assert r.status_code == 200
    body = r.get_json()
    assert body["status"] == "completed"
    assert body["actual_end_date"] == _date.today().isoformat()


def test_cannot_add_milestone_to_completed_project(client, db, sample_client):
    """Creating a milestone on a completed project must return 422."""
    p = Project(
        client_id=sample_client.id, name="Done Project", status="completed",
        start_date=date(2025, 1, 1), target_end_date=date(2025, 6, 1),
        actual_end_date=date(2025, 6, 1),
    )
    db.session.add(p)
    db.session.commit()

    r = client.post(f"/api/projects/{p.id}/milestones", json={
        "title": "Too Late", "due_date": "2025-07-01",
    })
    assert r.status_code == 422
    assert r.get_json()["error"]["code"] == "BUSINESS_RULE_VIOLATION"


def test_cannot_add_milestone_to_cancelled_project(client, db, sample_client):
    """Creating a milestone on a cancelled project must return 422."""
    p = Project(
        client_id=sample_client.id, name="Cancelled Project", status="cancelled",
        start_date=date(2025, 1, 1), target_end_date=date(2025, 6, 1),
    )
    db.session.add(p)
    db.session.commit()

    r = client.post(f"/api/projects/{p.id}/milestones", json={
        "title": "No Way", "due_date": "2025-07-01",
    })
    assert r.status_code == 422
