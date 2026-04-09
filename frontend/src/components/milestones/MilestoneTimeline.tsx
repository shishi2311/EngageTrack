import { useState } from 'react'
import type { Milestone, MilestoneStatus } from '../../types'
import { StatusBadge } from '../shared/StatusBadge'
import { ApprovalDialog } from './ApprovalDialog'
import { transitionMilestone } from '../../api/client'

interface MilestoneTimelineProps {
  milestones: Milestone[]
  onRefetch: () => void
  addToast: (msg: string, type: 'success' | 'error') => void
}

// ── Timeline dot ──────────────────────────────────────────────────────────────

const DOT_CONFIG: Record<MilestoneStatus, { color: string; pulse?: boolean }> = {
  pending: { color: 'var(--text-tertiary)' },
  in_progress: { color: '#3B82F6', pulse: true },
  pending_approval: { color: '#F59E0B' },
  approved: { color: '#34D399' },
  completed: { color: 'var(--health-healthy)' },
}

const STATUS_BORDER: Record<MilestoneStatus, string> = {
  pending: 'var(--text-tertiary)',
  in_progress: '#3B82F6',
  pending_approval: '#F59E0B',
  approved: '#34D399',
  completed: 'var(--health-healthy)',
}

function TimelineDot({ status }: { status: MilestoneStatus }) {
  const { color, pulse } = DOT_CONFIG[status]
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
        boxShadow: status === 'in_progress' ? `0 0 0 3px rgba(59,130,246,0.2)` : undefined,
        animation: pulse ? 'pulse-ring 2s ease-in-out infinite' : undefined,
      }}
    >
      {status === 'completed' && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 7,
            fontWeight: 700,
          }}
        >
          ✓
        </span>
      )}
    </div>
  )
}

// ── Action button helper ──────────────────────────────────────────────────────

interface ActionBtnProps {
  label: string
  onClick: () => void
  variant?: 'accent' | 'amber' | 'green' | 'outline'
  disabled?: boolean
  disabledReason?: string
  loading?: boolean
}

function ActionBtn({ label, onClick, variant = 'accent', disabled, disabledReason, loading }: ActionBtnProps) {
  const styles: Record<string, React.CSSProperties> = {
    accent: { background: 'var(--accent-primary)', color: '#fff', border: '1px solid transparent' },
    amber: { background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' },
    green: { background: 'rgba(34,197,94,0.12)', color: 'var(--health-healthy)', border: '1px solid rgba(34,197,94,0.3)' },
    outline: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' },
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}
      title={disabled ? disabledReason : undefined}
      style={{
        ...styles[variant],
        padding: '5px 12px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : loading ? 0.7 : 1,
        transition: 'opacity var(--transition-fast), transform var(--transition-fast)',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { if (!disabled && !loading) e.currentTarget.style.opacity = '0.85' }}
      onMouseLeave={(e) => { if (!disabled && !loading) e.currentTarget.style.opacity = '1' }}
      onMouseDown={(e) => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={(e) => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(1)' }}
    >
      {loading ? '…' : label}
    </button>
  )
}

// ── Single milestone card ─────────────────────────────────────────────────────

interface MilestoneCardProps {
  milestone: Milestone
  onRefetch: () => void
  addToast: (msg: string, type: 'success' | 'error') => void
}

function MilestoneCard({ milestone, onRefetch, addToast }: MilestoneCardProps) {
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const today = new Date()
  const due = new Date(milestone.due_date)
  const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86400000)
  const isOverdue = daysOverdue > 0 && milestone.status !== 'completed'

  const doTransition = async (status: MilestoneStatus) => {
    setLoading(status)
    try {
      await transitionMilestone(milestone.id, { status })
      addToast(`Milestone "${milestone.title}" moved to ${status.replace(/_/g, ' ')}.`, 'success')
      onRefetch()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Transition failed.', 'error')
    } finally {
      setLoading(null)
    }
  }

  const valid = milestone.valid_transitions

  const ALL_TRANSITIONS: MilestoneStatus[] = ['in_progress', 'pending_approval', 'completed']

  const LABEL_MAP: Record<string, { label: string; variant: ActionBtnProps['variant']; reason: string }> = {
    in_progress: { label: 'Start Work', variant: 'accent', reason: 'Milestone must be in Pending state first' },
    pending_approval: { label: 'Request Approval', variant: 'amber', reason: 'Milestone must be In Progress first' },
    completed: { label: 'Mark Complete', variant: 'green', reason: 'Milestone must be Approved first' },
  }

  const borderColor = STATUS_BORDER[milestone.status as MilestoneStatus] ?? 'var(--border-subtle)'

  return (
    <>
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderLeft: `3px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* Title + badge row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)', fontSize: 'var(--text-sm)', lineHeight: 1.4 }}>
            {milestone.title}
          </p>
          <StatusBadge status={milestone.status} />
        </div>

        {/* Due date */}
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: isOverdue ? 'var(--health-failing)' : 'var(--text-tertiary)',
          }}
        >
          Due {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {isOverdue && ` · ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`}
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {/* Review button for pending_approval */}
          {milestone.status === 'pending_approval' && (
            <ActionBtn
              label="Review"
              onClick={() => setApprovalOpen(true)}
              variant="amber"
              loading={loading === 'review'}
            />
          )}

          {/* Standard transitions */}
          {ALL_TRANSITIONS.map((t) => {
            if (t === 'pending_approval' && milestone.status === 'pending_approval') return null
            const cfg = LABEL_MAP[t]
            if (!cfg) return null
            const isValid = valid.includes(t)
            return (
              <ActionBtn
                key={t}
                label={cfg.label}
                variant={cfg.variant}
                onClick={() => doTransition(t)}
                disabled={!isValid}
                disabledReason={!isValid ? cfg.reason : undefined}
                loading={loading === t}
              />
            )
          })}
        </div>
      </div>

      <ApprovalDialog
        milestone={milestone}
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        onSuccess={onRefetch}
        addToast={addToast}
      />
    </>
  )
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export function MilestoneTimeline({ milestones, onRefetch, addToast }: MilestoneTimelineProps) {
  const completed = milestones.filter((m) => m.status === 'completed').length

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-md)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
          Milestones
        </h2>
        <span
          style={{
            padding: '2px 8px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 9999,
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}
        >
          {completed}/{milestones.length}
        </span>
      </div>

      {milestones.length === 0 ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No milestones yet.</p>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Vertical timeline line */}
          <div
            style={{
              position: 'absolute',
              left: 5,
              top: 6,
              bottom: 6,
              width: 1,
              background: 'var(--border-subtle)',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {milestones.map((m) => (
              <div key={m.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ paddingTop: 14 }}>
                  <TimelineDot status={m.status as MilestoneStatus} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <MilestoneCard milestone={m} onRefetch={onRefetch} addToast={addToast} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
          50% { box-shadow: 0 0 0 5px rgba(59,130,246,0.35); }
        }
      `}</style>
    </div>
  )
}

export default MilestoneTimeline
