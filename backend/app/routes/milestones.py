from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models.milestone import Milestone
from ..models.approval import Approval
from ..models.project import Project
from ..schemas import load_or_raise, MilestoneCreateSchema, MilestoneResponseSchema
from ..errors import NotFoundError, ValidationError, BusinessRuleError
from ..services import milestone_service, project_service

bp = Blueprint("milestones", __name__)

_create_schema = MilestoneCreateSchema()
_response_schema = MilestoneResponseSchema()
_response_many = MilestoneResponseSchema(many=True)


@bp.get("/api/projects/<project_id>/milestones")
def list_milestones(project_id):
    if not db.session.get(Project, project_id):
        raise NotFoundError(f"Project '{project_id}' not found.")
    milestones = (
        Milestone.query
        .filter_by(project_id=project_id)
        .order_by(Milestone.sort_order)
        .all()
    )
    return jsonify(_response_many.dump(milestones))


@bp.post("/api/projects/<project_id>/milestones")
def create_milestone(project_id):
    project = db.session.get(Project, project_id)
    if not project:
        raise NotFoundError(f"Project '{project_id}' not found.")
    if project.status in ("completed", "cancelled"):
        raise BusinessRuleError(
            "Cannot add milestones to a completed or cancelled project.",
            {"project_id": project_id, "project_status": project.status},
        )
    data = load_or_raise(_create_schema, request.get_json())
    data["project_id"] = project_id
    milestone = Milestone(**data)
    db.session.add(milestone)
    db.session.flush()   # get milestone.id before recalculating
    project_service.recalculate_health(project)
    db.session.commit()
    return jsonify(_response_schema.dump(milestone)), 201


@bp.patch("/api/milestones/<milestone_id>")
def update_milestone(milestone_id):
    milestone = db.session.get(Milestone, milestone_id)
    if not milestone:
        raise NotFoundError(f"Milestone '{milestone_id}' not found.")
    data = request.get_json() or {}
    if new_status := data.get("status"):
        milestone_service.transition_status(milestone, new_status)
    else:
        # Allow updating title, description, due_date, sort_order
        for field in ("title", "description", "due_date", "sort_order"):
            if field in data:
                setattr(milestone, field, data[field])
    db.session.commit()
    return jsonify(_response_schema.dump(milestone))


@bp.post("/api/milestones/<milestone_id>/request-approval")
def request_approval(milestone_id):
    milestone = db.session.get(Milestone, milestone_id)
    if not milestone:
        raise NotFoundError(f"Milestone '{milestone_id}' not found.")
    milestone_service.transition_status(milestone, "pending_approval")
    db.session.commit()
    return jsonify(_response_schema.dump(milestone))


@bp.post("/api/milestones/<milestone_id>/approve")
def approve_milestone(milestone_id):
    milestone = db.session.get(Milestone, milestone_id)
    if not milestone:
        raise NotFoundError(f"Milestone '{milestone_id}' not found.")
    if milestone.status != "pending_approval":
        raise BusinessRuleError(
            "Milestone is not awaiting approval.",
            {"current_status": milestone.status},
        )
    data = request.get_json() or {}
    if not data.get("approved_by"):
        raise ValidationError("approved_by is required.", {"approved_by": ["This field is required."]})

    decision = data.get("decision", "approved")
    new_status = "approved" if decision == "approved" else "in_progress"

    # Persist the approval record first
    approval = Approval(
        milestone_id=milestone.id,
        approved_by=data["approved_by"],
        decision=decision,
        comments=data.get("comments"),
    )
    db.session.add(approval)

    # Then drive the state machine (also recalcs health)
    milestone_service.transition_status(
        milestone,
        new_status,
        approval_data={"approved_by": data["approved_by"], "decision": decision},
    )
    db.session.commit()
    return jsonify(_response_schema.dump(milestone))
