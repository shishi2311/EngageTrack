from datetime import datetime, timezone
from ..errors import BusinessRuleError

VALID_TRANSITIONS = {
    "pending": ["in_progress"],
    "in_progress": ["pending_approval"],
    "pending_approval": ["approved", "in_progress"],
    "approved": ["completed"],
    "completed": [],
}


def transition_status(milestone, new_status: str):
    """Enforce the milestone state machine. Raises BusinessRuleError on invalid transition."""
    allowed = VALID_TRANSITIONS.get(milestone.status, [])
    if new_status not in allowed:
        raise BusinessRuleError(
            f"Cannot transition milestone from '{milestone.status}' to '{new_status}'.",
            {"current_status": milestone.status, "requested_status": new_status, "allowed": allowed},
        )
    if new_status == "completed":
        milestone.completed_at = datetime.now(timezone.utc)
    milestone.status = new_status
