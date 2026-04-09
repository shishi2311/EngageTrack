// ── Status union types ────────────────────────────────────────────────────────

export type ClientStatus = 'active' | 'paused' | 'completed'
export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
export type MilestoneStatus = 'pending' | 'in_progress' | 'pending_approval' | 'approved' | 'completed'
export type ApprovalDecision = 'approved' | 'rejected'
export type UpdateType = 'progress' | 'blocker' | 'risk' | 'general'
export type HealthCategory = 'healthy' | 'at_risk' | 'critical' | 'failing'

// ── Domain interfaces ─────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  contact_email: string
  industry: string | null
  status: ClientStatus
  project_count: number
  created_at: string
  updated_at: string
}

export interface HealthBreakdown {
  completion_score: number
  on_time_score: number
  blocker_score: number
  active_blockers: number
  completed_milestones: number
  total_milestones: number
}

export interface Project {
  id: string
  client_id: string
  client_name: string
  name: string
  description: string | null
  status: ProjectStatus
  start_date: string
  target_end_date: string
  actual_end_date: string | null
  health_score: number
  health_breakdown: HealthBreakdown
  milestone_count: number
  completed_milestone_count: number
  created_at: string
  updated_at: string
  // Embedded on GET /api/projects/:id
  milestones?: Milestone[]
  recent_status_updates?: StatusUpdate[]
}

export interface Approval {
  id: string
  milestone_id: string
  approved_by: string
  decision: ApprovalDecision
  comments: string | null
  decided_at: string
}

export interface Milestone {
  id: string
  project_id: string
  title: string
  description: string | null
  status: MilestoneStatus
  due_date: string
  completed_at: string | null
  sort_order: number
  valid_transitions: MilestoneStatus[]
  latest_approval: Approval | null
  created_at: string
  updated_at: string
}

export interface StatusUpdate {
  id: string
  project_id: string
  content: string
  update_type: UpdateType
  created_at: string
}

export interface DashboardSummary {
  total_clients: number
  active_projects: number
  avg_health_score: number
  overdue_milestones_count: number
  health_distribution: {
    healthy: number
    at_risk: number
    critical: number
    failing: number
  }
  recent_updates: StatusUpdate[]
}

// ── API error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string
  message: string
  details: Record<string, string[]>
  request_id?: string
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface CreateClientPayload {
  name: string
  contact_email: string
  industry?: string | null
  status?: ClientStatus
}

export interface CreateProjectPayload {
  client_id: string
  name: string
  description?: string | null
  start_date: string
  target_end_date: string
}

export interface CreateMilestonePayload {
  title: string
  description?: string | null
  due_date: string
  sort_order?: number
}

export interface CreateStatusUpdatePayload {
  content: string
  update_type: UpdateType
}

export interface TransitionMilestonePayload {
  status: MilestoneStatus
  approved_by?: string
  decision?: ApprovalDecision
  comments?: string
}
