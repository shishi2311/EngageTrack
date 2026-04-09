from marshmallow import Schema, fields, validate, validates, ValidationError

VALID_STATUSES = ("active", "paused", "completed")


class ClientCreateSchema(Schema):
    """Validates POST /api/clients request body."""

    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=200),
        error_messages={"required": "Name is required."},
    )
    contact_email = fields.Email(
        required=True,
        error_messages={"required": "contact_email is required.", "invalid": "Not a valid email address."},
    )
    industry = fields.String(load_default=None, validate=validate.Length(max=100), allow_none=True)
    status = fields.String(
        load_default="active",
        validate=validate.OneOf(VALID_STATUSES, error="Must be one of: active, paused, completed."),
    )


class ClientUpdateSchema(Schema):
    """Validates PATCH /api/clients/:id — all fields optional, validated when present."""

    name = fields.String(validate=validate.Length(min=1, max=200))
    contact_email = fields.Email(
        error_messages={"invalid": "Not a valid email address."},
    )
    industry = fields.String(validate=validate.Length(max=100), allow_none=True)
    status = fields.String(
        validate=validate.OneOf(VALID_STATUSES, error="Must be one of: active, paused, completed."),
    )


class ClientResponseSchema(Schema):
    """Serialises a Client ORM object to JSON. Includes computed project_count."""

    id = fields.String(dump_default=None)
    name = fields.String()
    contact_email = fields.String()
    industry = fields.String(allow_none=True)
    status = fields.String()
    project_count = fields.Method("get_project_count")
    created_at = fields.DateTime(format="iso")
    updated_at = fields.DateTime(format="iso")

    def get_project_count(self, obj) -> int:
        return obj.projects.count()
