import type { ProjectStatus, MilestoneStatus, ClientStatus, UpdateType } from '../../types'

type AnyStatus = ProjectStatus | MilestoneStatus | ClientStatus | UpdateType | string

interface StatusBadgeProps {
  status: AnyStatus
  variant?: 'pill' | 'dot-only'
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  // Project statuses
  planning: { color: '#818CF8', bg: 'rgba(99, 102, 241, 0.12)', label: 'Planning' },
  in_progress: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', label: 'In Progress' },
  on_hold: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', label: 'On Hold' },
  completed: { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', label: 'Completed' },
  cancelled: { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)', label: 'Cancelled' },
  // Client statuses
  active: { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', label: 'Active' },
  paused: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', label: 'Paused' },
  // Milestone statuses
  pending: { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)', label: 'Pending' },
  pending_approval: { color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.12)', label: 'Pending Approval' },
  approved: { color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)', label: 'Approved' },
  // Update types
  progress: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', label: 'Progress' },
  blocker: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'Blocker' },
  risk: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', label: 'Risk' },
  general: { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)', label: 'General' },
}

function toLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function StatusBadge({ status, variant = 'pill' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.12)',
    label: toLabel(status),
  }

  if (variant === 'dot-only') {
    return (
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 'var(--radius-sm)',
        background: config.bg,
        color: config.color,
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  )
}

export default StatusBadge
