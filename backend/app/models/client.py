import uuid
from datetime import datetime, timezone
from sqlalchemy import Enum as SAEnum
from ..extensions import db

ClientStatus = SAEnum("active", "paused", "completed", name="client_status")


class Client(db.Model):
    __tablename__ = "clients"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False, unique=True)
    contact_email = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(100), nullable=True)
    status = db.Column(ClientStatus, nullable=False, default="active")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    projects = db.relationship("Project", back_populates="client", lazy="dynamic")
