import logging
from datetime import date

from sqlalchemy import or_

from ..errors import BusinessRuleError
from .health_calculator import calculate_health

logger = logging.getLogger(__name__)

_MAX_ACTIVE_PROJECTS = 3
_ACTIVE_STATUSES = ("planning", "in_progress")


def check_engagement_cap(client) -> None:
    """
    Enforce the rule that a client may have at most 3 active engagements.

    'Active' means status is 'planning' or 'in_progress'. Projects that are
    on_hold, completed, or cancelled do not count toward the cap.

    Raises:
        BusinessRuleError: If the client already has 3 or more active projects.
    """
    from ..models.project import Project  # local import avoids circular deps

    active_count = (
        client.projects
        .filter(Project.status.in_(_ACTIVE_STATUSES))
        .count()
    )
    if active_count >= _MAX_ACTIVE_PROJECTS:
        raise BusinessRuleError(
            "Client has reached maximum of 3 active engagements.",
            {
                "client_id": client.id,
                "client_name": client.name,
                "active_count": active_count,
                "max_allowed": _MAX_ACTIVE_PROJECTS,
            },
        )


def update_project_status(project, new_status: str) -> None:
    """
    Apply a project-level status change, enforcing all transition rules.

    Rules enforced:
      - A project cannot be marked 'completed' while any milestone is not in
        'completed' status. This prevents closing a project with open work.
      - On completion, actual_end_date is set to today.
      - New milestones cannot be added to 'completed' or 'cancelled' projects
        (enforced at the route level, documented here for cross-reference).
      - on_hold / cancelled transitions have no extra guards — they are
        administrative and may be applied freely.

    Args:
        project:    The Project ORM instance.
        new_status: The target status string.

    Raises:
        BusinessRuleError: Cannot complete project with unfinished milestones.
    """
    if new_status == "completed":
        milestones = list(project.milestones)
        incomplete = [m for m in milestones if m.status != "completed"]
        if incomplete:
            raise BusinessRuleError(
                "Cannot complete project: all milestones must be completed first.",
                {
                    "project_id": project.id,
                    "incomplete_count": len(incomplete),
                    "incomplete_milestone_ids": [m.id for m in incomplete],
                },
            )
        project.actual_end_date = date.today()

    old_status = project.status
    project.status = new_status

    logger.info(
        "project_status_change",
        extra={
            "project_id": project.id,
            "name": project.name,
            "old_status": old_status,
            "new_status": new_status,
        },
    )


def recalculate_health(project) -> None:
    """
    Recompute and persist the project's health_score.

    Called after any event that could change the score:
      - A milestone transitions status.
      - A status update (especially a blocker) is added.
      - A project update changes dates.

    The caller must commit the session after this returns.
    """
    old_score = project.health_score
    project.health_score = calculate_health(project)

    if old_score != project.health_score:
        logger.info(
            "health_score_updated",
            extra={
                "project_id": project.id,
                "old_score": old_score,
                "new_score": project.health_score,
            },
        )
