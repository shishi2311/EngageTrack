"""
Client CRUD + validation tests.
"""
import pytest
from app.models import Client
from app.extensions import db


def test_create_client_success(client):
    r = client.post("/api/clients", json={
        "name": "Globex Corp",
        "contact_email": "ceo@globex.com",
        "industry": "Energy",
    })
    assert r.status_code == 201
    body = r.get_json()
    assert body["name"] == "Globex Corp"
    assert body["status"] == "active"
    assert body["project_count"] == 0
    assert "id" in body


def test_create_client_missing_name_returns_422(client):
    r = client.post("/api/clients", json={"contact_email": "x@x.com"})
    assert r.status_code == 422
    body = r.get_json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "name" in body["error"]["details"]


def test_create_client_missing_email_returns_422(client):
    r = client.post("/api/clients", json={"name": "NoEmail"})
    assert r.status_code == 422
    assert "contact_email" in r.get_json()["error"]["details"]


def test_create_client_invalid_email_returns_422(client):
    r = client.post("/api/clients", json={
        "name": "BadEmail", "contact_email": "not-an-email",
    })
    assert r.status_code == 422
    body = r.get_json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "contact_email" in body["error"]["details"]


def test_create_client_invalid_status_returns_422(client):
    r = client.post("/api/clients", json={
        "name": "X", "contact_email": "x@x.com", "status": "unknown",
    })
    assert r.status_code == 422
    assert "status" in r.get_json()["error"]["details"]


def test_create_client_duplicate_name_returns_error(client, sample_client, db):
    r = client.post("/api/clients", json={
        "name": sample_client.name,   # same name — unique constraint
        "contact_email": "other@x.com",
    })
    assert r.status_code in (422, 500)  # DB integrity error or handled


def test_list_clients_returns_all(client, sample_client):
    r = client.get("/api/clients")
    assert r.status_code == 200
    body = r.get_json()
    assert isinstance(body, list)
    assert any(c["id"] == sample_client.id for c in body)


def test_list_clients_filters_by_status(client, db):
    active = Client(name="Active Co", contact_email="a@a.com", status="active")
    paused = Client(name="Paused Co", contact_email="p@p.com", status="paused")
    db.session.add_all([active, paused])
    db.session.commit()

    r = client.get("/api/clients?status=active")
    body = r.get_json()
    assert all(c["status"] == "active" for c in body)


def test_get_client_not_found_returns_404(client):
    r = client.get("/api/clients/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
    assert r.get_json()["error"]["code"] == "NOT_FOUND"


def test_get_client_success(client, sample_client):
    r = client.get(f"/api/clients/{sample_client.id}")
    assert r.status_code == 200
    body = r.get_json()
    assert body["id"] == sample_client.id
    assert body["name"] == sample_client.name


def test_update_client_changes_field(client, sample_client):
    r = client.patch(f"/api/clients/{sample_client.id}", json={"status": "paused"})
    assert r.status_code == 200
    assert r.get_json()["status"] == "paused"


def test_update_client_invalid_email_returns_422(client, sample_client):
    r = client.patch(f"/api/clients/{sample_client.id}", json={"contact_email": "bad"})
    assert r.status_code == 422
    assert "contact_email" in r.get_json()["error"]["details"]


def test_client_response_includes_project_count(client, db, sample_client, sample_project):
    r = client.get(f"/api/clients/{sample_client.id}")
    assert r.get_json()["project_count"] == 1
