export interface Client {
  id: string
  name: string
  contact_email: string
  industry: string | null
  status: 'active' | 'paused' | 'completed'
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id: string
  name: string
  description: string | null
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  start_date: string
  target_end_date: string
  actual_end_date: string | null
  health_score: number
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'pending_approval' | 'approved' | 'completed'
  due_date: string
  completed_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Approval {
  id: string
  milestone_id: string
  approved_by: string
  decision: 'approved' | 'rejected'
  comments: string | null
  decided_at: string
}

export interface StatusUpdate {
  id: string
  project_id: string
  content: string
  update_type: 'progress' | 'blocker' | 'risk' | 'general'
  created_at: string
}

export interface DashboardSummary {
  total_clients: number
  active_projects: number
  avg_health_score: number
  overdue_milestones: number
}
