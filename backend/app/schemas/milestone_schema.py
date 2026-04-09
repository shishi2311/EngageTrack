from marshmallow import fields, validate
from ..extensions import ma
from ..models.milestone import Milestone

VALID_STATUSES = ["pending", "in_progress", "pending_approval", "approved", "completed"]


class MilestoneSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Milestone
        load_instance = True
        include_fk = True

    title = fields.String(required=True, validate=validate.Length(min=1, max=200))
    due_date = fields.Date(required=True)
    status = fields.String(dump_only=True)
    completed_at = fields.DateTime(dump_only=True)
