import uuid as _uuid
from marshmallow import Schema, fields, validate, validates, validates_schema, ValidationError

VALID_STATUSES = ("planning", "in_progress", "on_hold", "completed", "cancelled")


def _is_valid_uuid(value: str) -> bool:
    try:
        _uuid.UUID(value)
        return True
    except ValueError:
        return False


class ProjectCreateSchema(Schema):
    """Validates POST /api/projects request body."""

    client_id = fields.String(
        required=True,
        error_messages={"required": "client_id is required."},
    )
    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=200),
        error_messages={"required": "Name is required."},
    )
    description = fields.String(load_default=None, allow_none=True)
    start_date = fields.Date(
        required=True,
        error_messages={"required": "start_date is required.", "invalid": "Not a valid date (YYYY-MM-DD)."},
    )
    target_end_date = fields.Date(
        required=True,
        error_messages={"required": "target_end_date is required.", "invalid": "Not a valid date (YYYY-MM-DD)."},
    )

    @validates("client_id")
    def validate_client_id(self, value):
        if not _is_valid_uuid(value):
            raise ValidationError("Must be a valid UUID.")

    @validates_schema
    def validate_date_order(self, data, **kwargs):
        start = data.get("start_date")
        end = data.get("target_end_date")
        if start and end and end <= start:
            raise ValidationError(
                {"target_end_date": ["target_end_date must be after start_date."]}
            )


class ProjectUpdateSchema(Schema):
    """Validates PATCH /api/projects/:id — all fields optional, validated when present."""

    name = fields.String(validate=validate.Length(min=1, max=200))
    description = fields.String(allow_none=True)
    status = fields.String(
        validate=validate.OneOf(VALID_STATUSES, error="Must be one of: planning, in_progress, on_hold, completed, cancelled."),
    )
    target_end_date = fields.Date()


class ProjectResponseSchema(Schema):
    """Serialises a Project ORM object. Includes client_name, counts, and health breakdown."""

    id = fields.String()
    client_id = fields.String()
    client_name = fields.Method("get_client_name")
    name = fields.String()
    description = fields.String(allow_none=True)
    status = fields.String()
    start_date = fields.Date(format="iso")
    target_end_date = fields.Date(format="iso")
    actual_end_date = fields.Date(format="iso", allow_none=True)
    health_score = fields.Integer()
    health_breakdown = fields.Method("get_health_breakdown")
    milestone_count = fields.Method("get_milestone_count")
    completed_milestone_count = fields.Method("get_completed_milestone_count")
    created_at = fields.DateTime(format="iso")
    updated_at = fields.DateTime(format="iso")

    def get_client_name(self, obj) -> str | None:
        return obj.client.name if obj.client else None

    def get_milestone_count(self, obj) -> int:
        return obj.milestones.count()

    def get_completed_milestone_count(self, obj) -> int:
        return obj.milestones.filter_by(status="completed").count()

    def get_health_breakdown(self, obj) -> dict:
        from ..services.health_calculator import get_health_breakdown
        return get_health_breakdown(obj)
