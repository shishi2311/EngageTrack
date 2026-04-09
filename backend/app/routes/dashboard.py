from datetime import date

from flask import Blueprint, jsonify

from ..extensions import db
from ..models.client import Client
from ..models.milestone import Milestone
from ..models.project import Project
from ..models.status_update import StatusUpdate
from ..schemas import StatusUpdateResponseSchema

bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

_update_schema = StatusUpdateResponseSchema(many=True)

_HEALTH_BANDS = [
    ("healthy",  80, 100),
    ("at_risk",  60,  79),
    ("critical", 30,  59),
    ("failing",   0,  29),
]


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

    overdue_count = Milestone.query.filter(
        Milestone.due_date < date.today(),
        Milestone.status.notin_(["completed"]),
    ).count()

    # Health distribution across ALL projects (not just active)
    health_distribution: dict[str, int] = {band: 0 for band, *_ in _HEALTH_BANDS}
    all_projects = Project.query.filter(
        Project.status.notin_(["cancelled"])
    ).all()
    for p in all_projects:
        for band, lo, hi in _HEALTH_BANDS:
            if lo <= p.health_score <= hi:
                health_distribution[band] += 1
                break

    # 5 most recent status updates across all projects
    recent_updates = (
        StatusUpdate.query
        .order_by(StatusUpdate.created_at.desc())
        .limit(5)
        .all()
    )

    return jsonify({
        "total_clients": total_clients,
        "active_projects": active_count,
        "avg_health_score": avg_health,
        "overdue_milestones_count": overdue_count,
        "health_distribution": health_distribution,
        "recent_updates": _update_schema.dump(recent_updates),
    })
