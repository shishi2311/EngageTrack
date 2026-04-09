import uuid
from datetime import datetime, timezone
from sqlalchemy import Enum as SAEnum
from ..extensions import db

ProjectStatus = SAEnum(
    "planning", "in_progress", "on_hold", "completed", "cancelled",
    name="project_status",
)


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = db.Column(db.String(36), db.ForeignKey("clients.id"), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(ProjectStatus, nullable=False, default="planning")
    start_date = db.Column(db.Date, nullable=False)
    target_end_date = db.Column(db.Date, nullable=False)
    actual_end_date = db.Column(db.Date, nullable=True)
    health_score = db.Column(db.Integer, nullable=False, default=100)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    client = db.relationship("Client", back_populates="projects")
    milestones = db.relationship(
        "Milestone",
        back_populates="project",
        lazy="dynamic",
        order_by="Milestone.sort_order",
    )
    status_updates = db.relationship(
        "StatusUpdate",
        back_populates="project",
        lazy="dynamic",
    )
