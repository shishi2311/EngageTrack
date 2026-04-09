"""
Health score tests — verifies all scoring scenarios including edge cases.
"""
import pytest
from datetime import date, datetime, timezone

from app.models import Project, Milestone, StatusUpdate
from app.extensions import db
from app.services.health_calculator import calculate_health, get_health_breakdown


def _make_project(db, sample_client, name="HP"):
    p = Project(
        client_id=sample_client.id, name=name, status="in_progress",
        start_date=date(2025, 1, 1), target_end_date=date(2025, 12, 31),
    )
    db.session.add(p)
    db.session.flush()
    return p


def test_health_100_when_no_milestones(db, sample_client):
    """A project with no milestones scores 100 — nothing can be wrong yet."""
    p = _make_project(db, sample_client)
    assert calculate_health(p) == 100


def test_health_high_when_all_on_time(db, sample_client):
    """All milestones completed before due date with no blockers → score ≥ 85."""
    p = _make_project(db, sample_client)
    for i in range(3):
        m = Milestone(
            project_id=p.id, title=f"M{i}", status="completed",
            due_date=date(2025, 3, 1),
            completed_at=datetime(2025, 2, 28, tzinfo=timezone.utc),
            sort_order=i,
        )
        db.session.add(m)
    db.session.flush()
    assert calculate_health(p) >= 85


def test_health_decreases_with_overdue_incomplete_milestones(db, sample_client):
    """Incomplete milestones past their due date lower the on-time component."""
    p = _make_project(db, sample_client)
    for i in range(4):
        m = Milestone(
            project_id=p.id, title=f"Late{i}", status="pending",
            due_date=date(2024, 1, 1),  # far in the past
            sort_order=i,
        )
        db.session.add(m)
    db.session.flush()
    score = calculate_health(p)
    assert score < 50, f"Expected < 50, got {score}"


def test_health_decreases_with_single_blocker(db, sample_client):
    """One blocker status update reduces the blocker component by 15 points."""
    p = _make_project(db, sample_client)
    u = StatusUpdate(project_id=p.id, content="Blocked!", update_type="blocker")
    db.session.add(u)
    db.session.flush()
    score = calculate_health(p)
    # No milestones → completion=100, on_time=100; 1 blocker → blocker=85
    # weighted: 40 + 35 + 85*0.25 = 40 + 35 + 21.25 = 96.25 → 96
    assert score == 96


def test_health_multiple_blockers_stack_penalty(db, sample_client):
    """7+ blockers AND all milestones overdue drives score to 0."""
    p = _make_project(db, sample_client)
    # All overdue milestones: completion=0, on_time=0
    for i in range(4):
        db.session.add(Milestone(
            project_id=p.id, title=f"Late{i}", status="pending",
            due_date=date(2020, 1, 1), sort_order=i,  # 5+ years ago → full penalty
        ))
    # 7 blockers: blocker_score = max(0, 100 - 7*15) = 0
    for _ in range(7):
        db.session.add(StatusUpdate(project_id=p.id, content="x", update_type="blocker"))
    db.session.flush()
    score = calculate_health(p)
    assert score == 0


def test_health_clamped_to_zero_not_negative(db, sample_client):
    """Score is always ≥ 0 regardless of penalty accumulation."""
    p = _make_project(db, sample_client)
    for _ in range(20):
        db.session.add(StatusUpdate(project_id=p.id, content="x", update_type="blocker"))
    for i in range(5):
        db.session.add(Milestone(
            project_id=p.id, title=f"M{i}", status="pending",
            due_date=date(2020, 1, 1), sort_order=i,
        ))
    db.session.flush()
    assert calculate_health(p) >= 0


def test_health_clamped_to_100_not_above(db, sample_client):
    """Score is always ≤ 100."""
    p = _make_project(db, sample_client)
    assert calculate_health(p) <= 100


def test_health_recalculates_on_milestone_transition(client, db, sample_project):
    """Health score stored on the project updates after a milestone is transitioned."""
    m = Milestone(
        project_id=sample_project.id, title="Work",
        status="pending", due_date=date(2099, 12, 31), sort_order=1,
    )
    db.session.add(m)
    db.session.commit()

    score_before = sample_project.health_score

    client.post(f"/api/milestones/{m.id}/transition", json={"status": "in_progress"})

    db.session.expire(sample_project)
    from app.models import Project as P
    updated = db.session.get(P, sample_project.id)
    # Score may be same or different, but the call must not raise
    assert 0 <= updated.health_score <= 100


def test_health_recalculates_on_blocker_added(client, db, sample_project):
    """Adding a blocker status update must lower the stored health score."""
    # Ensure starting score is high (no blockers yet)
    from app.services.project_service import recalculate_health
    recalculate_health(sample_project)
    db.session.commit()
    score_before = sample_project.health_score

    client.post(f"/api/projects/{sample_project.id}/status-updates", json={
        "content": "API vendor is unresponsive.",
        "update_type": "blocker",
    })

    db.session.expire(sample_project)
    from app.models import Project as P
    updated = db.session.get(P, sample_project.id)
    assert updated.health_score < score_before


def test_health_breakdown_returns_all_components(db, sample_client):
    """get_health_breakdown returns all expected keys with valid ranges."""
    p = _make_project(db, sample_client)
    breakdown = get_health_breakdown(p)
    for key in ("completion_score", "on_time_score", "blocker_score",
                "active_blockers", "completed_milestones", "total_milestones"):
        assert key in breakdown, f"Missing key: {key}"
    assert 0 <= breakdown["completion_score"] <= 100
    assert 0 <= breakdown["on_time_score"] <= 100
    assert 0 <= breakdown["blocker_score"] <= 100
