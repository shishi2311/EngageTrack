import uuid
from datetime import datetime, timezone
from sqlalchemy import Enum as SAEnum
from ..extensions import db

UpdateType = SAEnum("progress", "blocker", "risk", "general", name="update_type")


class StatusUpdate(db.Model):
    __tablename__ = "status_updates"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    update_type = db.Column(UpdateType, nullable=False, default="general")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    project = db.relationship("Project", back_populates="status_updates")
