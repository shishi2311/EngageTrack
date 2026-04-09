from marshmallow import fields, validate, validates_schema, ValidationError
from ..extensions import ma
from ..models.project import Project

VALID_STATUSES = ["planning", "in_progress", "on_hold", "completed", "cancelled"]


class ProjectSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Project
        load_instance = True
        include_fk = True

    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    client_id = fields.String(required=True)
    start_date = fields.Date(required=True)
    target_end_date = fields.Date(required=True)
    status = fields.String(load_default="planning", validate=validate.OneOf(VALID_STATUSES))
    health_score = fields.Integer(dump_only=True)

    @validates_schema
    def validate_dates(self, data, **kwargs):
        start = data.get("start_date")
        end = data.get("target_end_date")
        if start and end and end <= start:
            raise ValidationError("target_end_date must be after start_date", "target_end_date")
