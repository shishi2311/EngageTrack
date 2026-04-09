from datetime import date

_WEIGHT_COMPLETION = 40
_WEIGHT_ON_TIME = 35
_WEIGHT_BLOCKERS = 25
_BLOCKER_PENALTY = 15


def calculate_health(project) -> int:
    """
    Compute a 0-100 health score from three weighted components.

    Component 1 — Milestone completion (40%):
        completed_count / total_count * 100
        If no milestones: 100.

    Component 2 — On-time delivery (35%):
        Per milestone:
          - completed on/before due_date         → 1.0
          - completed after due_date             → 0.0
          - incomplete, not yet due              → 1.0 (optimistic)
          - incomplete, past due_date            → max(0, 1 - days_overdue / 30)
        Component score = mean * 100.
        If no milestones: 100.

    Component 3 — Blocker penalty (25%):
        Start at 100, subtract 15 per blocker StatusUpdate.
        Clamped to [0, 100]. Applied even when there are no milestones —
        a project can accumulate blockers before milestones are defined.

    Final = weighted average, rounded int, clamped [0, 100].
    """
    milestones = list(project.milestones)
    today = date.today()
    total = len(milestones)

    # ── Component 1 & 2 ───────────────────────────────────────────────────────
    if total == 0:
        completion_score = 100.0
        on_time_score = 100.0
    else:
        completed_count = sum(1 for m in milestones if m.status == "completed")
        completion_score = (completed_count / total) * 100

        per_milestone = []
        for m in milestones:
            if m.status == "completed":
                on_time = m.completed_at and m.completed_at.date() <= m.due_date
                per_milestone.append(1.0 if on_time else 0.0)
            else:
                days_overdue = (today - m.due_date).days
                per_milestone.append(1.0 if days_overdue <= 0 else max(0.0, 1.0 - days_overdue / 30))
        on_time_score = (sum(per_milestone) / total) * 100

    # ── Component 3 ───────────────────────────────────────────────────────────
    active_blockers = project.status_updates.filter_by(update_type="blocker").count()
    blocker_score = max(0.0, 100 - active_blockers * _BLOCKER_PENALTY)

    # ── Weighted average ──────────────────────────────────────────────────────
    raw = (
        completion_score * _WEIGHT_COMPLETION / 100
        + on_time_score * _WEIGHT_ON_TIME / 100
        + blocker_score * _WEIGHT_BLOCKERS / 100
    )
    return max(0, min(100, round(raw)))


def get_health_breakdown(project) -> dict:
    """
    Return per-component scores for the Project Detail breakdown cards.

    Returns:
        completion_score  int 0-100
        on_time_score     int 0-100
        blocker_score     int 0-100
        active_blockers   int  raw count
        completed_milestones int
        total_milestones  int
    """
    milestones = list(project.milestones)
    today = date.today()
    total = len(milestones)

    active_blockers = project.status_updates.filter_by(update_type="blocker").count()
    blocker_score = max(0, 100 - active_blockers * _BLOCKER_PENALTY)

    if total == 0:
        return {
            "completion_score": 100,
            "on_time_score": 100,
            "blocker_score": blocker_score,
            "active_blockers": active_blockers,
            "completed_milestones": 0,
            "total_milestones": 0,
        }

    completed_count = sum(1 for m in milestones if m.status == "completed")
    completion_score = round((completed_count / total) * 100)

    per_milestone = []
    for m in milestones:
        if m.status == "completed":
            on_time = m.completed_at and m.completed_at.date() <= m.due_date
            per_milestone.append(1.0 if on_time else 0.0)
        else:
            days_overdue = (today - m.due_date).days
            per_milestone.append(1.0 if days_overdue <= 0 else max(0.0, 1.0 - days_overdue / 30))
    on_time_score = round((sum(per_milestone) / total) * 100)

    return {
        "completion_score": completion_score,
        "on_time_score": on_time_score,
        "blocker_score": blocker_score,
        "active_blockers": active_blockers,
        "completed_milestones": completed_count,
        "total_milestones": total,
    }
