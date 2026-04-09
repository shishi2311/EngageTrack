"""
Milestone CRUD + approval record tests.
"""
import pytest
from datetime import date

from app.models import Milestone, Approval
from app.extensions import db


def test_create_milestone_success(client, sample_project):
    r = client.post(f"/api/projects/{sample_project.id}/milestones", json={
        "title": "Phase 1",
        "due_date": "2025-06-01",
    })
    assert r.status_code == 201
    body = r.get_json()
    assert body["title"] == "Phase 1"
    assert body["status"] == "pending"
    assert body["project_id"] == sample_project.id
    assert "valid_transitions" in body


def test_create_milestone_missing_title_returns_422(client, sample_project):
    r = client.post(f"/api/projects/{sample_project.id}/milestones", json={
        "due_date": "2025-06-01",
    })
    assert r.status_code == 422
    assert "title" in r.get_json()["error"]["details"]


def test_create_milestone_missing_due_date_returns_422(client, sample_project):
    r = client.post(f"/api/projects/{sample_project.id}/milestones", json={
        "title": "No Date",
    })
    assert r.status_code == 422
    assert "due_date" in r.get_json()["error"]["details"]


def test_create_milestone_unknown_project_returns_404(client):
    r = client.post("/api/projects/00000000-0000-0000-0000-000000000000/milestones", json={
        "title": "Ghost", "due_date": "2025-06-01",
    })
    assert r.status_code == 404


def test_list_milestones_ordered_by_sort_order(client, db, sample_project):
    for i, sort in enumerate([3, 1, 2]):
        m = Milestone(
            project_id=sample_project.id, title=f"M{sort}",
            status="pending", due_date=date(2025, 6, 1), sort_order=sort,
        )
        db.session.add(m)
    db.session.commit()

    r = client.get(f"/api/projects/{sample_project.id}/milestones")
    body = r.get_json()
    orders = [m["sort_order"] for m in body]
    assert orders == sorted(orders)


def test_milestone_valid_transitions_in_response(client, sample_milestone):
    r = client.get(f"/api/projects/{sample_milestone.project_id}/milestones")
    milestone = next(m for m in r.get_json() if m["id"] == sample_milestone.id)
    assert milestone["valid_transitions"] == ["in_progress"]


def test_transition_endpoint_changes_status(client, sample_milestone):
    r = client.post(f"/api/milestones/{sample_milestone.id}/transition",
                    json={"status": "in_progress"})
    assert r.status_code == 200
    assert r.get_json()["status"] == "in_progress"


def test_patch_milestone_rejects_status_field(client, sample_milestone):
    """PATCH must refuse status changes — use /transition instead."""
    r = client.patch(f"/api/milestones/{sample_milestone.id}",
                     json={"status": "in_progress"})
    assert r.status_code == 422


def test_patch_milestone_updates_title(client, sample_milestone):
    r = client.patch(f"/api/milestones/{sample_milestone.id}",
                     json={"title": "Renamed Phase"})
    assert r.status_code == 200
    assert r.get_json()["title"] == "Renamed Phase"


def test_approve_milestone_creates_approval_record(client, db, sample_project):
    m = Milestone(
        project_id=sample_project.id, title="Needs Approval",
        status="pending_approval", due_date=date(2025, 6, 1), sort_order=1,
    )
    db.session.add(m)
    db.session.commit()

    r = client.post(f"/api/milestones/{m.id}/approve", json={
        "approved_by": "Carol",
        "decision": "approved",
        "comments": "Ship it!",
    })
    assert r.status_code == 200
    assert r.get_json()["status"] == "approved"

    # Verify the Approval record was persisted
    approval = Approval.query.filter_by(milestone_id=m.id).first()
    assert approval is not None
    assert approval.approved_by == "Carol"
    assert approval.decision == "approved"
    assert approval.comments == "Ship it!"


def test_approve_requires_approver_name(client, db, sample_project):
    m = Milestone(
        project_id=sample_project.id, title="No Name",
        status="pending_approval", due_date=date(2025, 6, 1), sort_order=1,
    )
    db.session.add(m)
    db.session.commit()

    r = client.post(f"/api/milestones/{m.id}/approve", json={"decision": "approved"})
    assert r.status_code == 422


def test_rejection_creates_approval_record_with_rejected_decision(client, db, sample_project):
    m = Milestone(
        project_id=sample_project.id, title="Reject Me",
        status="pending_approval", due_date=date(2025, 6, 1), sort_order=1,
    )
    db.session.add(m)
    db.session.commit()

    r = client.post(f"/api/milestones/{m.id}/approve", json={
        "approved_by": "Dave", "decision": "rejected", "comments": "Not ready.",
    })
    assert r.status_code == 200
    assert r.get_json()["status"] == "in_progress"

    approval = Approval.query.filter_by(milestone_id=m.id).first()
    assert approval.decision == "rejected"


def test_latest_approval_in_response(client, db, sample_project):
    """MilestoneResponseSchema embeds the latest approval when in approval state."""
    m = Milestone(
        project_id=sample_project.id, title="With Approval",
        status="pending_approval", due_date=date(2025, 6, 1), sort_order=1,
    )
    db.session.add(m)
    db.session.flush()
    approval = Approval(
        milestone_id=m.id, approved_by="Eve",
        decision="approved", comments="LGTM",
    )
    db.session.add(approval)
    db.session.commit()

    r = client.get(f"/api/projects/{sample_project.id}/milestones")
    milestone = next(x for x in r.get_json() if x["id"] == m.id)
    assert milestone["latest_approval"] is not None
    assert milestone["latest_approval"]["approved_by"] == "Eve"
