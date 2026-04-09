import type {
  Client,
  Project,
  Milestone,
  StatusUpdate,
  DashboardSummary,
  CreateClientPayload,
  CreateProjectPayload,
  CreateMilestonePayload,
  CreateStatusUpdatePayload,
  TransitionMilestonePayload,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Request failed: ${res.status}`)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const getDashboardSummary = () =>
  api.get<DashboardSummary>('/api/dashboard/summary')

// ── Clients ───────────────────────────────────────────────────────────────────

export const getClients = () => api.get<Client[]>('/api/clients')

export const getClient = (id: string) => api.get<Client>(`/api/clients/${id}`)

export const createClient = (payload: CreateClientPayload) =>
  api.post<Client>('/api/clients', payload)

export const updateClient = (id: string, payload: Partial<CreateClientPayload>) =>
  api.patch<Client>(`/api/clients/${id}`, payload)

// ── Projects ──────────────────────────────────────────────────────────────────

export interface GetProjectsParams {
  status?: string
  client_id?: string
  health?: string
}

export const getProjects = (params?: GetProjectsParams) => {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
  return api.get<Project[]>(`/api/projects${qs}`)
}

export const getProject = (id: string) => api.get<Project>(`/api/projects/${id}`)

export const createProject = (payload: CreateProjectPayload) =>
  api.post<Project>('/api/projects', payload)

export const updateProject = (id: string, payload: Partial<CreateProjectPayload & { status: string }>) =>
  api.patch<Project>(`/api/projects/${id}`, payload)

// ── Milestones ────────────────────────────────────────────────────────────────

export const getMilestones = (projectId: string) =>
  api.get<Milestone[]>(`/api/projects/${projectId}/milestones`)

export const createMilestone = (projectId: string, payload: CreateMilestonePayload) =>
  api.post<Milestone>(`/api/projects/${projectId}/milestones`, payload)

export const transitionMilestone = (milestoneId: string, payload: TransitionMilestonePayload) =>
  api.post<Milestone>(`/api/milestones/${milestoneId}/transition`, payload)

export const requestApproval = (milestoneId: string) =>
  api.post<Milestone>(`/api/milestones/${milestoneId}/request-approval`, {})

export const approveMilestone = (
  milestoneId: string,
  payload: { approved_by: string; decision: 'approved' | 'rejected'; comments?: string }
) => api.post<Milestone>(`/api/milestones/${milestoneId}/approve`, payload)

// ── Status Updates ────────────────────────────────────────────────────────────

export const getStatusUpdates = (projectId: string) =>
  api.get<StatusUpdate[]>(`/api/projects/${projectId}/status-updates`)

export const createStatusUpdate = (projectId: string, payload: CreateStatusUpdatePayload) =>
  api.post<StatusUpdate>(`/api/projects/${projectId}/status-updates`, payload)
