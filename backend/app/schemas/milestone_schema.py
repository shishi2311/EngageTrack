from marshmallow import Schema, fields, validate


class MilestoneCreateSchema(Schema):
    """Validates POST /api/projects/:id/milestones request body."""

    title = fields.String(
        required=True,
        validate=validate.Length(min=1, max=200),
        error_messages={"required": "Title is required."},
    )
    description = fields.String(load_default=None, allow_none=True)
    due_date = fields.Date(
        required=True,
        error_messages={"required": "due_date is required.", "invalid": "Not a valid date (YYYY-MM-DD)."},
    )
    sort_order = fields.Integer(load_default=0)


class MilestoneResponseSchema(Schema):
    """Serialises a Milestone. Includes valid_transitions and latest approval when relevant."""

    id = fields.String()
    project_id = fields.String()
    title = fields.String()
    description = fields.String(allow_none=True)
    status = fields.String()
    due_date = fields.Date(format="iso")
    completed_at = fields.DateTime(format="iso", allow_none=True)
    sort_order = fields.Integer()
    valid_transitions = fields.Method("get_valid_transitions")
    latest_approval = fields.Method("get_latest_approval")
    created_at = fields.DateTime(format="iso")
    updated_at = fields.DateTime(format="iso")

    def get_valid_transitions(self, obj) -> list[str]:
        from ..services.milestone_service import get_valid_transitions
        return get_valid_transitions(obj)

    def get_latest_approval(self, obj) -> dict | None:
        """Return the most recent approval record when milestone is in an approval state."""
        if obj.status not in ("pending_approval", "approved", "completed"):
            return None
        approval = obj.approvals.order_by(
            __import__("sqlalchemy").text("decided_at DESC")
        ).first()
        if not approval:
            return None
        return {
            "approved_by": approval.approved_by,
            "decision": approval.decision,
            "comments": approval.comments,
            "decided_at": approval.decided_at.isoformat() if approval.decided_at else None,
        }
