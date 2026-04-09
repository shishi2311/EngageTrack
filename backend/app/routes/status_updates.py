from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models.status_update import StatusUpdate
from ..models.project import Project
from ..schemas.status_update_schema import StatusUpdateSchema
from ..errors import ValidationError
from ..services import project_service

bp = Blueprint("status_updates", __name__)
update_schema = StatusUpdateSchema()
updates_schema = StatusUpdateSchema(many=True)


@bp.get("/api/projects/<project_id>/status-updates")
def list_updates(project_id):
    Project.query.get_or_404(project_id, description="Project not found")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    pagination = (
        StatusUpdate.query
        .filter_by(project_id=project_id)
        .order_by(StatusUpdate.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return jsonify({
        "items": updates_schema.dump(pagination.items),
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    })


@bp.post("/api/projects/<project_id>/status-updates")
def create_update(project_id):
    project = Project.query.get_or_404(project_id, description="Project not found")
    data = request.get_json()
    data["project_id"] = project_id
    try:
        update = update_schema.load(data)
    except Exception as e:
        raise ValidationError(str(e))
    db.session.add(update)
    db.session.commit()
    project_service.refresh_health(project)
    db.session.commit()
    return jsonify(update_schema.dump(update)), 201
