from marshmallow import fields, validate
from ..extensions import ma
from ..models.status_update import StatusUpdate

VALID_TYPES = ["progress", "blocker", "risk", "general"]


class StatusUpdateSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = StatusUpdate
        load_instance = True
        include_fk = True

    content = fields.String(required=True, validate=validate.Length(min=1, max=2000))
    update_type = fields.String(load_default="general", validate=validate.OneOf(VALID_TYPES))
    project_id = fields.String(dump_only=True)
