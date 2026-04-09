import pytest
from datetime import date, datetime, timezone

from app import create_app
from app.config import TestConfig
from app.extensions import db as _db
from app.models import Client, Project, Milestone, StatusUpdate, Approval


# ── App + DB fixtures ─────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def app():
    app = create_app(TestConfig)
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(scope="function")
def db(app):
    """Provide a clean database for each test by rolling back after."""
    with app.app_context():
        yield _db
        _db.session.rollback()
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture(scope="function")
def client(app):
    return app.test_client()


# ── Domain seed fixtures ──────────────────────────────────────────────────────

@pytest.fixture
def sample_client(db):
    c = Client(name="Acme Corp", contact_email="cto@acme.com", industry="Tech")
    db.session.add(c)
    db.session.flush()
    return c


@pytest.fixture
def sample_project(db, sample_client):
    p = Project(
        client_id=sample_client.id,
        name="Website Redesign",
        status="in_progress",
        start_date=date(2025, 1, 1),
        target_end_date=date(2025, 6, 30),
    )
    db.session.add(p)
    db.session.flush()
    return p


@pytest.fixture
def sample_milestone(db, sample_project):
    m = Milestone(
        project_id=sample_project.id,
        title="Design Phase",
        status="pending",
        due_date=date(2025, 3, 1),
        sort_order=1,
    )
    db.session.add(m)
    db.session.flush()
    return m


@pytest.fixture
def project_with_milestones(db, sample_client):
    """Project with 4 milestones in varied states for realistic health tests."""
    p = Project(
        client_id=sample_client.id,
        name="Complex Project",
        status="in_progress",
        start_date=date(2025, 1, 1),
        target_end_date=date(2025, 12, 31),
    )
    db.session.add(p)
    db.session.flush()

    milestones = [
        Milestone(  # completed on time
            project_id=p.id, title="Discovery", status="completed",
            due_date=date(2025, 2, 1),
            completed_at=datetime(2025, 1, 28, tzinfo=timezone.utc),
            sort_order=1,
        ),
        Milestone(  # completed late
            project_id=p.id, title="Design", status="completed",
            due_date=date(2025, 3, 1),
            completed_at=datetime(2025, 3, 15, tzinfo=timezone.utc),
            sort_order=2,
        ),
        Milestone(  # in progress, not yet due (future date)
            project_id=p.id, title="Build", status="in_progress",
            due_date=date(2099, 12, 31),
            sort_order=3,
        ),
        Milestone(  # pending and overdue
            project_id=p.id, title="Launch", status="pending",
            due_date=date(2024, 1, 1),  # well in the past
            sort_order=4,
        ),
    ]
    for m in milestones:
        db.session.add(m)
    db.session.flush()
    return p
