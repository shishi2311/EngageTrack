from marshmallow import fields, validate
from ..extensions import ma
from ..models.client import Client

VALID_STATUSES = ["active", "paused", "completed"]


class ClientSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Client
        load_instance = True
        include_fk = True

    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    contact_email = fields.Email(required=True)
    industry = fields.String(load_default=None, validate=validate.Length(max=100))
    status = fields.String(load_default="active", validate=validate.OneOf(VALID_STATUSES))
