from marshmallow import Schema, fields, validate

VALID_TYPES = ("progress", "blocker", "risk", "general")


class StatusUpdateCreateSchema(Schema):
    """Validates POST /api/projects/:id/status-updates request body."""

    content = fields.String(
        required=True,
        validate=validate.Length(min=1, max=2000),
        error_messages={"required": "content is required."},
    )
    update_type = fields.String(
        load_default="general",
        validate=validate.OneOf(VALID_TYPES, error="Must be one of: progress, blocker, risk, general."),
    )


class StatusUpdateResponseSchema(Schema):
    """Serialises a StatusUpdate ORM object."""

    id = fields.String()
    project_id = fields.String()
    content = fields.String()
    update_type = fields.String()
    created_at = fields.DateTime(format="iso")
