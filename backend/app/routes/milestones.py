from flask import Blueprint, jsonify, request
from ..extensions import db
from ..models.milestone import Milestone
from ..models.approval import Approval
from ..models.project import Project
from ..schemas.milestone_schema import MilestoneSchema
from ..errors import NotFoundError, ValidationError, BusinessRuleError
from ..services import milestone_service, project_service

bp = Blueprint("milestones", __name__)
milestone_schema = MilestoneSchema()
milestones_schema = MilestoneSchema(many=True)


@bp.get("/api/projects/<project_id>/milestones")
def list_milestones(project_id):
    Project.query.get_or_404(project_id, description="Project not found")
    milestones = Milestone.query.filter_by(project_id=project_id).order_by(Milestone.sort_order).all()
    return jsonify(milestones_schema.dump(milestones))


@bp.post("/api/projects/<project_id>/milestones")
def create_milestone(project_id):
    project = Project.query.get_or_404(project_id, description="Project not found")
    if project.status in ("completed", "cancelled"):
        raise BusinessRuleError("Cannot add milestones to a completed or cancelled project.")
    data = request.get_json()
    data["project_id"] = project_id
    try:
        milestone = milestone_schema.load(data)
    except Exception as e:
        raise ValidationError(str(e))
    db.session.add(milestone)
    db.session.commit()
    project_service.refresh_health(project)
    db.session.commit()
    return jsonify(milestone_schema.dump(milestone)), 201


@bp.patch("/api/milestones/<milestone_id>")
def update_milestone(milestone_id):
    milestone = Milestone.query.get_or_404(milestone_id, description="Milestone not found")
    data = request.get_json()
    if new_status := data.get("status"):
        milestone_service.transition_status(milestone, new_status)
    else:
        try:
            milestone_schema.load(data, instance=milestone, partial=True)
        except Exception as e:
            raise ValidationError(str(e))
    db.session.commit()
    project_service.refresh_health(milestone.project)
    db.session.commit()
    return jsonify(milestone_schema.dump(milestone))


@bp.post("/api/milestones/<milestone_id>/request-approval")
def request_approval(milestone_id):
    milestone = Milestone.query.get_or_404(milestone_id, description="Milestone not found")
    milestone_service.transition_status(milestone, "pending_approval")
    db.session.commit()
    return jsonify(milestone_schema.dump(milestone))


@bp.post("/api/milestones/<milestone_id>/approve")
def approve_milestone(milestone_id):
    milestone = Milestone.query.get_or_404(milestone_id, description="Milestone not found")
    if milestone.status != "pending_approval":
        raise BusinessRuleError("Milestone is not pending approval.")
    data = request.get_json()
    if not data.get("approved_by"):
        raise ValidationError("approved_by is required.")
    decision = data.get("decision", "approved")
    if decision not in ("approved", "rejected"):
        raise ValidationError("decision must be 'approved' or 'rejected'.")

    approval = Approval(
        milestone_id=milestone.id,
        approved_by=data["approved_by"],
        decision=decision,
        comments=data.get("comments"),
    )
    db.session.add(approval)

    if decision == "approved":
        milestone_service.transition_status(milestone, "approved")
    else:
        milestone_service.transition_status(milestone, "in_progress")

    db.session.commit()
    project_service.refresh_health(milestone.project)
    db.session.commit()
    return jsonify(milestone_schema.dump(milestone))
