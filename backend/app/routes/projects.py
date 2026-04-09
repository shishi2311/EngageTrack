from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models.project import Project
from ..models.client import Client
from ..schemas.project_schema import ProjectSchema
from ..errors import NotFoundError, ValidationError
from ..services import project_service

bp = Blueprint("projects", __name__, url_prefix="/api/projects")
project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)


@bp.get("")
def list_projects():
    query = Project.query
    if status := request.args.get("status"):
        query = query.filter_by(status=status)
    if client_id := request.args.get("client_id"):
        query = query.filter_by(client_id=client_id)
    return jsonify(projects_schema.dump(query.all()))


@bp.post("")
def create_project():
    try:
        project = project_schema.load(request.get_json())
    except Exception as e:
        raise ValidationError(str(e))
    client = Client.query.get_or_404(project.client_id, description="Client not found")
    project_service.check_engagement_cap(client)
    db.session.add(project)
    db.session.commit()
    return jsonify(project_schema.dump(project)), 201


@bp.get("/<project_id>")
def get_project(project_id):
    project = Project.query.get_or_404(project_id, description="Project not found")
    return jsonify(project_schema.dump(project))


@bp.patch("/<project_id>")
def update_project(project_id):
    project = Project.query.get_or_404(project_id, description="Project not found")
    data = request.get_json()
    if data.get("status") == "completed":
        project_service.complete_project(project)
    else:
        try:
            project_schema.load(data, instance=project, partial=True)
        except Exception as e:
            raise ValidationError(str(e))
    project_service.refresh_health(project)
    db.session.commit()
    return jsonify(project_schema.dump(project))
