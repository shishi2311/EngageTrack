import logging
from datetime import datetime, timezone

from ..errors import BusinessRuleError

logger = logging.getLogger(__name__)

# ── State machine definition ───────────────────────────────────────────────────
# Maps current status → list of statuses the milestone may move TO.
# Transitions not in this map are unconditionally rejected.
VALID_TRANSITIONS: dict[str, list[str]] = {
    "pending":          ["in_progress"],
    "in_progress":      ["pending_approval"],
    "pending_approval": ["approved", "in_progress"],   # in_progress only on rejection
    "approved":         ["completed"],
    "completed":        [],
}


def get_valid_transitions(milestone) -> list[str]:
    """
    Return the list of statuses this milestone may legally move to.

    Used by the UI to render only valid action buttons — e.g. a milestone in
    'pending' shows a 'Start Work' button (→ in_progress) but never a
    'Mark Complete' button.
    """
    return VALID_TRANSITIONS.get(milestone.status, [])


def transition_status(milestone, new_status: str, approval_data: dict | None = None) -> None:
    """
    Enforce the milestone state machine and apply the transition.

    Rules:
      - Any transition not listed in VALID_TRANSITIONS raises BusinessRuleError.
      - pending_approval → approved  requires approval_data with 'approved_by'.
      - pending_approval → in_progress requires approval_data with decision='rejected'
        (this is how a rejection sends the milestone back to work-in-progress).
      - approved → completed auto-sets completed_at = now (UTC).
      - Every successful transition is logged at INFO with before/after status.

    The caller is responsible for committing the session after calling this.

    Args:
        milestone:      The Milestone ORM instance to transition.
        new_status:     The target status string.
        approval_data:  Dict with 'approved_by', 'decision', and optional 'comments'.
                        Required when transitioning out of 'pending_approval'.

    Raises:
        BusinessRuleError: Invalid transition or missing approval data.
    """
    allowed = VALID_TRANSITIONS.get(milestone.status, [])

    if new_status not in allowed:
        raise BusinessRuleError(
            f"Cannot move milestone from '{milestone.status}' to '{new_status}'.",
            {
                "milestone_id": milestone.id,
                "current_status": milestone.status,
                "requested_status": new_status,
                "allowed_transitions": allowed,
            },
        )

    # Approval gate: leaving pending_approval requires approval_data
    if milestone.status == "pending_approval":
        if not approval_data or not approval_data.get("approved_by"):
            raise BusinessRuleError(
                "Approval decision requires 'approved_by' to be specified.",
                {"milestone_id": milestone.id},
            )
        decision = approval_data.get("decision", "approved")
        if decision not in ("approved", "rejected"):
            raise BusinessRuleError(
                "decision must be 'approved' or 'rejected'.",
                {"received": decision},
            )
        # Rejection sends the milestone back to in_progress — enforce consistency
        if decision == "rejected" and new_status != "in_progress":
            raise BusinessRuleError(
                "A rejected milestone must transition back to 'in_progress'.",
                {"milestone_id": milestone.id},
            )
        if decision == "approved" and new_status != "approved":
            raise BusinessRuleError(
                "An approved decision must transition to 'approved'.",
                {"milestone_id": milestone.id},
            )

    old_status = milestone.status

    # Auto-set completed_at when reaching 'completed'
    if new_status == "completed":
        milestone.completed_at = datetime.now(timezone.utc)

    milestone.status = new_status

    logger.info(
        "milestone_transition",
        extra={
            "milestone_id": milestone.id,
            "title": milestone.title,
            "old_status": old_status,
            "new_status": new_status,
        },
    )

    # Recalculate parent project health after every status change
    from .health_calculator import calculate_health
    milestone.project.health_score = calculate_health(milestone.project)
