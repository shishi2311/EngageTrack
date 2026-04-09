import uuid
from datetime import datetime, timezone
from sqlalchemy import Enum as SAEnum
from ..extensions import db

MilestoneStatus = SAEnum(
    "pending", "in_progress", "pending_approval", "approved", "completed",
    name="milestone_status",
)


class Milestone(db.Model):
    __tablename__ = "milestones"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(MilestoneStatus, nullable=False, default="pending")
    due_date = db.Column(db.Date, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project = db.relationship("Project", back_populates="milestones")
    approvals = db.relationship("Approval", back_populates="milestone", lazy="dynamic")
