from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models.status_update import StatusUpdate
from ..models.project import Project
from ..schemas import load_or_raise, StatusUpdateCreateSchema, StatusUpdateResponseSchema
from ..errors import NotFoundError
from ..services import project_service

bp = Blueprint("status_updates", __name__)

_create_schema = StatusUpdateCreateSchema()
_response_schema = StatusUpdateResponseSchema()
_response_many = StatusUpdateResponseSchema(many=True)


@bp.get("/api/projects/<project_id>/status-updates")
def list_updates(project_id):
    if not db.session.get(Project, project_id):
        raise NotFoundError(f"Project '{project_id}' not found.")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    pagination = (
        StatusUpdate.query
        .filter_by(project_id=project_id)
        .order_by(StatusUpdate.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return jsonify({
        "items": _response_many.dump(pagination.items),
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    })


@bp.post("/api/projects/<project_id>/status-updates")
def create_update(project_id):
    project = db.session.get(Project, project_id)
    if not project:
        raise NotFoundError(f"Project '{project_id}' not found.")
    data = load_or_raise(_create_schema, request.get_json())
    data["project_id"] = project_id
    update = StatusUpdate(**data)
    db.session.add(update)
    db.session.flush()
    project_service.recalculate_health(project)
    db.session.commit()
    return jsonify(_response_schema.dump(update)), 201
