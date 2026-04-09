"""
Project CRUD + filter + validation tests.
"""
import pytest
from datetime import date

from app.models import Project, StatusUpdate
from app.extensions import db


def test_create_project_success(client, sample_client):
    r = client.post("/api/projects", json={
        "client_id": sample_client.id,
        "name": "New Platform",
        "start_date": "2025-01-01",
        "target_end_date": "2025-12-31",
    })
    assert r.status_code == 201
    body = r.get_json()
    assert body["name"] == "New Platform"
    assert body["status"] == "planning"
    assert body["health_score"] == 100
    assert body["client_name"] == sample_client.name


def test_create_project_end_date_before_start_returns_422(client, sample_client):
    r = client.post("/api/projects", json={
        "client_id": sample_client.id,
        "name": "Bad Dates",
        "start_date": "2025-06-01",
        "target_end_date": "2025-01-01",
    })
    assert r.status_code == 422
    body = r.get_json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "target_end_date" in body["error"]["details"]


def test_create_project_equal_dates_returns_422(client, sample_client):
    r = client.post("/api/projects", json={
        "client_id": sample_client.id,
        "name": "Equal Dates",
        "start_date": "2025-06-01",
        "target_end_date": "2025-06-01",
    })
    assert r.status_code == 422


def test_create_project_unknown_client_returns_404(client):
    r = client.post("/api/projects", json={
        "client_id": "00000000-0000-0000-0000-000000000000",
        "name": "Ghost",
        "start_date": "2025-01-01",
        "target_end_date": "2025-12-31",
    })
    assert r.status_code == 404


def test_create_project_invalid_client_id_uuid(client):
    r = client.post("/api/projects", json={
        "client_id": "not-a-uuid",
        "name": "X",
        "start_date": "2025-01-01",
        "target_end_date": "2025-12-31",
    })
    assert r.status_code == 422
    assert "client_id" in r.get_json()["error"]["details"]


def test_list_projects_returns_all(client, sample_project):
    r = client.get("/api/projects")
    assert r.status_code == 200
    body = r.get_json()
    assert any(p["id"] == sample_project.id for p in body)


def test_list_projects_filters_by_status(client, db, sample_client):
    planning = Project(
        client_id=sample_client.id, name="Plan",
        status="planning", start_date=date(2025, 1, 1), target_end_date=date(2025, 12, 31),
    )
    on_hold = Project(
        client_id=sample_client.id, name="Hold",
        status="on_hold", start_date=date(2025, 1, 1), target_end_date=date(2025, 12, 31),
    )
    db.session.add_all([planning, on_hold])
    db.session.commit()

    r = client.get("/api/projects?status=planning")
    body = r.get_json()
    assert all(p["status"] == "planning" for p in body)


def test_list_projects_filters_by_client_id(client, db, sample_client, sample_project):
    # Create a second client with a project
    from app.models import Client
    other = Client(name="Other Corp", contact_email="o@o.com")
    db.session.add(other)
    db.session.flush()
    p2 = Project(
        client_id=other.id, name="Other",
        status="planning", start_date=date(2025, 1, 1), target_end_date=date(2025, 12, 31),
    )
    db.session.add(p2)
    db.session.commit()

    r = client.get(f"/api/projects?client_id={sample_client.id}")
    body = r.get_json()
    assert all(p["client_id"] == sample_client.id for p in body)


def test_list_projects_filters_by_health_category(client, db, sample_client):
    high = Project(
        client_id=sample_client.id, name="High", status="in_progress",
        start_date=date(2025, 1, 1), target_end_date=date(2025, 12, 31),
        health_score=90,
    )
    low = Project(
        client_id=sample_client.id, name="Low", status="in_progress",
        start_date=date(2025, 1, 1), target_end_date=date(2025, 12, 31),
        health_score=20,
    )
    db.session.add_all([high, low])
    db.session.commit()

    r = client.get("/api/projects?health=healthy")
    body = r.get_json()
    assert all(p["health_score"] >= 80 for p in body)

    r = client.get("/api/projects?health=failing")
    body = r.get_json()
    assert all(p["health_score"] <= 29 for p in body)


def test_get_project_not_found_returns_404(client):
    r = client.get("/api/projects/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
    assert r.get_json()["error"]["code"] == "NOT_FOUND"


def test_get_project_includes_milestones_and_updates(client, db, sample_project):
    from app.models import Milestone
    m = Milestone(
        project_id=sample_project.id, title="Do thing",
        status="pending", due_date=date(2025, 6, 1), sort_order=1,
    )
    u = StatusUpdate(
        project_id=sample_project.id, content="Progress note", update_type="progress",
    )
    db.session.add_all([m, u])
    db.session.commit()

    r = client.get(f"/api/projects/{sample_project.id}")
    body = r.get_json()
    assert "milestones" in body
    assert "recent_status_updates" in body
    assert len(body["milestones"]) == 1
    assert len(body["recent_status_updates"]) == 1


def test_update_project_name(client, sample_project):
    r = client.patch(f"/api/projects/{sample_project.id}", json={"name": "Renamed"})
    assert r.status_code == 200
    assert r.get_json()["name"] == "Renamed"


def test_dashboard_summary_shape(client, sample_project):
    r = client.get("/api/dashboard/summary")
    assert r.status_code == 200
    body = r.get_json()
    for key in ("total_clients", "active_projects", "avg_health_score",
                "overdue_milestones_count", "health_distribution", "recent_updates"):
        assert key in body, f"Missing key: {key}"
    assert set(body["health_distribution"]) == {"healthy", "at_risk", "critical", "failing"}
