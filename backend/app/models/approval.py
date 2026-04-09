import uuid
from datetime import datetime, timezone
from ..extensions import db


class Approval(db.Model):
    __tablename__ = "approvals"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    milestone_id = db.Column(db.String(36), db.ForeignKey("milestones.id"), nullable=False)
    approved_by = db.Column(db.String(200), nullable=False)
    decision = db.Column(db.String(20), nullable=False)
    comments = db.Column(db.Text, nullable=True)
    decided_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    milestone = db.relationship("Milestone", back_populates="approvals")
