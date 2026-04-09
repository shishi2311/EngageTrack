from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models.project import Project
from ..models.client import Client
from ..schemas import (
    load_or_raise,
    ProjectCreateSchema,
    ProjectUpdateSchema,
    ProjectResponseSchema,
)
from ..errors import NotFoundError
from ..services import project_service

bp = Blueprint("projects", __name__, url_prefix="/api/projects")

_create_schema = ProjectCreateSchema()
_update_schema = ProjectUpdateSchema()
_response_schema = ProjectResponseSchema()
_response_many = ProjectResponseSchema(many=True)


@bp.get("")
def list_projects():
    query = Project.query
    if status := request.args.get("status"):
        query = query.filter_by(status=status)
    if client_id := request.args.get("client_id"):
        query = query.filter_by(client_id=client_id)
    return jsonify(_response_many.dump(query.all()))


@bp.post("")
def create_project():
    data = load_or_raise(_create_schema, request.get_json())
    client = db.session.get(Client, data["client_id"])
    if not client:
        raise NotFoundError(f"Client '{data['client_id']}' not found.")
    project_service.check_engagement_cap(client)
    project = Project(**data)
    db.session.add(project)
    db.session.commit()
    return jsonify(_response_schema.dump(project)), 201


@bp.get("/<project_id>")
def get_project(project_id):
    project = db.session.get(Project, project_id)
    if not project:
        raise NotFoundError(f"Project '{project_id}' not found.")
    return jsonify(_response_schema.dump(project))


@bp.patch("/<project_id>")
def update_project(project_id):
    project = db.session.get(Project, project_id)
    if not project:
        raise NotFoundError(f"Project '{project_id}' not found.")
    data = load_or_raise(_update_schema, request.get_json())
    new_status = data.pop("status", None)
    for key, value in data.items():
        setattr(project, key, value)
    if new_status:
        project_service.update_project_status(project, new_status)
    project_service.recalculate_health(project)
    db.session.commit()
    return jsonify(_response_schema.dump(project))
