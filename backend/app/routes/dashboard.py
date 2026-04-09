from flask import Blueprint, jsonify
from ..models.client import Client
from ..models.project import Project
from ..models.milestone import Milestone
from datetime import date

bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@bp.get("/summary")
def summary():
    total_clients = Client.query.count()
    active_projects = Project.query.filter(
        Project.status.in_(["planning", "in_progress"])
    ).all()
    active_count = len(active_projects)
    avg_health = (
        round(sum(p.health_score for p in active_projects) / active_count)
        if active_count else 0
    )
    overdue_milestones = Milestone.query.filter(
        Milestone.due_date < date.today(),
        Milestone.status.notin_(["completed", "cancelled"]),
    ).count()

    return jsonify({
        "total_clients": total_clients,
        "active_projects": active_count,
        "avg_health_score": avg_health,
        "overdue_milestones": overdue_milestones,
    })
