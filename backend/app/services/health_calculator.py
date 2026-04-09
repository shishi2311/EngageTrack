from datetime import date


def calculate_health(project) -> int:
    """
    Compute health score 0-100 based on:
    - Milestone completion ratio (40% weight)
    - On-time delivery (35% weight)
    - Blocker count (25% weight)
    """
    milestones = list(project.milestones)
    if not milestones:
        return 100

    total = len(milestones)
    completed = [m for m in milestones if m.status == "completed"]
    completion_ratio = len(completed) / total

    # On-time: completed on or before due date = full points
    on_time_scores = []
    today = date.today()
    for m in milestones:
        if m.status == "completed" and m.completed_at:
            on_time = m.completed_at.date() <= m.due_date
            on_time_scores.append(1.0 if on_time else 0.0)
        elif m.status != "completed" and m.due_date < today:
            on_time_scores.append(0.0)
        else:
            on_time_scores.append(1.0)
    on_time_ratio = sum(on_time_scores) / len(on_time_scores)

    # Blocker penalty: count status updates of type "blocker"
    active_blockers = project.status_updates.filter_by(update_type="blocker").count()
    blocker_score = max(0.0, 1.0 - (active_blockers * 0.15))

    raw = (completion_ratio * 40) + (on_time_ratio * 35) + (blocker_score * 25)
    return max(0, min(100, round(raw)))
