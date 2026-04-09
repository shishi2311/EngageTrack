from datetime import date

# Weight constants — must sum to 100
_WEIGHT_COMPLETION = 40
_WEIGHT_ON_TIME = 35
_WEIGHT_BLOCKERS = 25
_BLOCKER_PENALTY = 15   # points deducted per active blocker


def calculate_health(project) -> int:
    """
    Compute a 0-100 health score for a project from three weighted components.

    Component 1 — Milestone completion (40%):
        completed_count / total_count * 100

    Component 2 — On-time delivery (35%):
        For each milestone:
          - completed on or before due_date  → 1.0
          - completed after due_date         → 0.0
          - incomplete and not yet due       → 1.0  (optimistic, not penalised yet)
          - incomplete and past due_date     → proportional deduction:
              score = max(0, 1 - days_overdue / 30)
              (reaches 0 at 30 days overdue)
        Component score = mean of per-milestone scores * 100

    Component 3 — Blocker count (25%):
        Start at 100, subtract 15 per active blocker status update.
        "Active" = any StatusUpdate with update_type == "blocker" on this project.
        Clamped to [0, 100].

    Final score = weighted average of the three components, rounded to int,
    clamped to [0, 100].

    If the project has no milestones, returns 100 (healthy by default — nothing
    can be overdue or incomplete yet).
    """
    milestones = list(project.milestones)
    if not milestones:
        return 100

    today = date.today()
    total = len(milestones)

    # ── Component 1: completion ratio ─────────────────────────────────────────
    completed_count = sum(1 for m in milestones if m.status == "completed")
    completion_score = (completed_count / total) * 100

    # ── Component 2: on-time delivery ─────────────────────────────────────────
    per_milestone_scores = []
    for m in milestones:
        if m.status == "completed":
            if m.completed_at and m.completed_at.date() <= m.due_date:
                per_milestone_scores.append(1.0)   # completed on time
            else:
                per_milestone_scores.append(0.0)   # completed late
        else:
            days_overdue = (today - m.due_date).days
            if days_overdue <= 0:
                per_milestone_scores.append(1.0)   # not yet due
            else:
                # Proportional deduction: loses all points at 30 days overdue
                per_milestone_scores.append(max(0.0, 1.0 - days_overdue / 30))

    on_time_score = (sum(per_milestone_scores) / total) * 100

    # ── Component 3: blocker penalty ──────────────────────────────────────────
    active_blockers = project.status_updates.filter_by(update_type="blocker").count()
    blocker_score = max(0.0, 100 - active_blockers * _BLOCKER_PENALTY)

    # ── Weighted average ───────────────────────────────────────────────────────
    raw = (
        completion_score * _WEIGHT_COMPLETION / 100
        + on_time_score * _WEIGHT_ON_TIME / 100
        + blocker_score * _WEIGHT_BLOCKERS / 100
    )
    return max(0, min(100, round(raw)))


def get_health_breakdown(project) -> dict:
    """
    Return the three individual component scores so the UI can render
    the breakdown cards on the Project Detail page.

    Returns:
        {
            "completion_score":  int,   # 0-100, milestone completion ratio
            "on_time_score":     int,   # 0-100, on-time delivery
            "blocker_score":     int,   # 0-100, blocker penalty
            "active_blockers":   int,   # raw count of blocker updates
            "completed_milestones": int,
            "total_milestones":  int,
        }
    """
    milestones = list(project.milestones)
    today = date.today()

    if not milestones:
        active_blockers = project.status_updates.filter_by(update_type="blocker").count()
        return {
            "completion_score": 100,
            "on_time_score": 100,
            "blocker_score": max(0, 100 - active_blockers * _BLOCKER_PENALTY),
            "active_blockers": active_blockers,
            "completed_milestones": 0,
            "total_milestones": 0,
        }

    total = len(milestones)
    completed_count = sum(1 for m in milestones if m.status == "completed")
    completion_score = round((completed_count / total) * 100)

    per_milestone = []
    for m in milestones:
        if m.status == "completed":
            per_milestone.append(1.0 if (m.completed_at and m.completed_at.date() <= m.due_date) else 0.0)
        else:
            days_overdue = (today - m.due_date).days
            per_milestone.append(1.0 if days_overdue <= 0 else max(0.0, 1.0 - days_overdue / 30))

    on_time_score = round((sum(per_milestone) / total) * 100)

    active_blockers = project.status_updates.filter_by(update_type="blocker").count()
    blocker_score = max(0, 100 - active_blockers * _BLOCKER_PENALTY)

    return {
        "completion_score": completion_score,
        "on_time_score": on_time_score,
        "blocker_score": blocker_score,
        "active_blockers": active_blockers,
        "completed_milestones": completed_count,
        "total_milestones": total,
    }
