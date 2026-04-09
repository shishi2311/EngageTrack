from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models.client import Client
from ..schemas.client_schema import ClientSchema
from ..errors import NotFoundError, ValidationError

bp = Blueprint("clients", __name__, url_prefix="/api/clients")
client_schema = ClientSchema()
clients_schema = ClientSchema(many=True)


@bp.get("")
def list_clients():
    status = request.args.get("status")
    query = Client.query
    if status:
        query = query.filter_by(status=status)
    return jsonify(clients_schema.dump(query.all()))


@bp.post("")
def create_client():
    try:
        client = client_schema.load(request.get_json())
    except Exception as e:
        raise ValidationError(str(e))
    db.session.add(client)
    db.session.commit()
    return jsonify(client_schema.dump(client)), 201


@bp.get("/<client_id>")
def get_client(client_id):
    client = Client.query.get_or_404(client_id, description="Client not found")
    return jsonify(client_schema.dump(client))


@bp.patch("/<client_id>")
def update_client(client_id):
    client = Client.query.get_or_404(client_id, description="Client not found")
    try:
        client_schema.load(request.get_json(), instance=client, partial=True)
    except Exception as e:
        raise ValidationError(str(e))
    db.session.commit()
    return jsonify(client_schema.dump(client))
