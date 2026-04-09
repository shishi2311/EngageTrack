from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models.client import Client
from ..schemas import (
    load_or_raise,
    ClientCreateSchema,
    ClientUpdateSchema,
    ClientResponseSchema,
)
from ..errors import NotFoundError

bp = Blueprint("clients", __name__, url_prefix="/api/clients")

_create_schema = ClientCreateSchema()
_update_schema = ClientUpdateSchema()
_response_schema = ClientResponseSchema()
_response_many = ClientResponseSchema(many=True)


@bp.get("")
def list_clients():
    query = Client.query
    if status := request.args.get("status"):
        query = query.filter_by(status=status)
    return jsonify(_response_many.dump(query.order_by(Client.name).all()))


@bp.post("")
def create_client():
    data = load_or_raise(_create_schema, request.get_json())
    client = Client(**data)
    db.session.add(client)
    db.session.commit()
    return jsonify(_response_schema.dump(client)), 201


@bp.get("/<client_id>")
def get_client(client_id):
    client = db.session.get(Client, client_id)
    if not client:
        raise NotFoundError(f"Client '{client_id}' not found.")
    return jsonify(_response_schema.dump(client))


@bp.patch("/<client_id>")
def update_client(client_id):
    client = db.session.get(Client, client_id)
    if not client:
        raise NotFoundError(f"Client '{client_id}' not found.")
    data = load_or_raise(_update_schema, request.get_json())
    for key, value in data.items():
        setattr(client, key, value)
    db.session.commit()
    return jsonify(_response_schema.dump(client))
