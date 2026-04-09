from datetime import date
from ..errors import BusinessRuleError
from .health_calculator import calculate_health

ACTIVE_STATUSES = {"planning", "in_progress"}
MAX_ACTIVE_PROJECTS = 3


def check_engagement_cap(client):
    """Raise BusinessRuleError if client already has 3 active projects."""
    active_count = client.projects.filter(
        __import__("sqlalchemy").text("status IN ('planning', 'in_progress')")
    ).count()
    if active_count >= MAX_ACTIVE_PROJECTS:
        raise BusinessRuleError(
            "Client has reached maximum of 3 active engagements.",
            {"active_count": active_count},
        )


def refresh_health(project):
    """Recalculate and persist health score on the project."""
    project.health_score = calculate_health(project)


def complete_project(project):
    """Mark project as completed. Raises if any milestone is not done."""
    incomplete = [m for m in project.milestones if m.status != "completed"]
    if incomplete:
        raise BusinessRuleError(
            "Cannot complete project: all milestones must be completed first.",
            {"incomplete_milestones": [m.id for m in incomplete]},
        )
    project.status = "completed"
    project.actual_end_date = date.today()
