import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { getDashboardSummary } from '../api/client'
import type { DashboardSummary, HealthCategory } from '../types'
import PageHeader from '../components/layout/PageHeader'
import { Skeleton } from '../components/shared/Skeleton'
import { ErrorCard } from '../components/shared/ErrorCard'

// ── Health config ─────────────────────────────────────────────────────────────

const HEALTH_OPTIONS: { value: HealthCategory; label: string; color: string; bg: string; range: string }[] = [
  { value: 'healthy',  label: 'Healthy',  color: 'var(--health-healthy)',  bg: 'var(--health-healthy-bg)',  range: '80–100' },
  { value: 'at_risk',  label: 'At Risk',  color: 'var(--health-at-risk)',  bg: 'var(--health-at-risk-bg)',  range: '60–79'  },
  { value: 'critical', label: 'Critical', color: 'var(--health-critical)', bg: 'var(--health-critical-bg)', range: '30–59'  },
  { value: 'failing',  label: 'Failing',  color: 'var(--health-failing)',  bg: 'var(--health-failing-bg)',  range: '0–29'   },
]

const UPDATE_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  progress: { color: 'var(--status-progress)', label: 'Progress' },
  blocker:  { color: 'var(--status-blocker)',  label: 'Blocker'  },
  risk:     { color: 'var(--status-risk)',     label: 'Risk'     },
  general:  { color: 'var(--status-general)',  label: 'General'  },
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, index, pulse, sublabel, accentColor, onClick }: {
  label: string
  value: number | string
  index: number
  pulse?: boolean
  sublabel?: string
  accentColor?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        animationDelay: `${index * 60}ms`,
        animation: 'fadeInUp 0.4s ease forwards',
        opacity: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
      }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' } }}
      onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none' } }}
    >
      <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
        {label}
      </p>
      <p style={{
        margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 700,
        fontFamily: 'var(--font-mono)', letterSpacing: 'var(--tracking-tight)',
        color: pulse ? 'var(--health-failing)' : (accentColor ?? 'var(--text-primary)'),
        animation: pulse ? 'pulse-red 2s ease-in-out infinite' : undefined,
      }}>
        {value}
      </p>
      {sublabel && <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{sublabel}</p>}
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Skeleton width={80} height={12} />
      <Skeleton width={60} height={36} />
    </div>
  )
}

// ── Health distribution bar ───────────────────────────────────────────────────

function HealthDistributionBar({ distribution, total }: {
  distribution: DashboardSummary['health_distribution']
  total: number
}) {
  if (total === 0) return null
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-md)',
      }}
    >
      <p style={{ margin: '0 0 12px', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
        Portfolio Health
      </p>
      <div style={{ height: 10, borderRadius: 9999, overflow: 'hidden', display: 'flex', gap: 2, marginBottom: 12 }}>
        {HEALTH_OPTIONS.map(({ value, color }) => {
          const count = distribution[value] ?? 0
          const pct = total > 0 ? (count / total) * 100 : 0
          if (pct === 0) return null
          return <div key={value} style={{ width: `${pct}%`, background: color, borderRadius: 9999 }} />
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {HEALTH_OPTIONS.map(({ value, label, color }) => {
          const count = distribution[value] ?? 0
          if (count === 0) return null
          return (
            <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Recent activity feed ──────────────────────────────────────────────────────

function RecentActivity({ updates }: { updates: DashboardSummary['recent_updates'] }) {
  if (updates.length === 0) return null
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
      }}
    >
      <p style={{ margin: '0 0 16px', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
        Recent Activity
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {updates.slice(0, 8).map((u) => {
          const cfg = UPDATE_TYPE_CONFIG[u.update_type] ?? UPDATE_TYPE_CONFIG.general
          return (
            <div key={u.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: cfg.color,
                flexShrink: 0, marginTop: 5,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.content}
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-block', padding: '1px 6px', borderRadius: 4,
                    background: `${cfg.color}1a`, color: cfg.color,
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {relativeTime(u.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const summaryFn = useCallback(() => getDashboardSummary(), [])
  const { data: summary, loading, error } = useApi<DashboardSummary>(summaryFn)

  const totalProjects = summary
    ? Object.values(summary.health_distribution).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="page-enter">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your client engagement portfolio"
        actions={
          <button
            onClick={() => navigate('/projects')}
            style={{
              padding: '9px 18px',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'border-color var(--transition-fast), color var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            View All Projects →
          </button>
        }
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : error ? (
          <div style={{ gridColumn: '1/-1' }}><ErrorCard message={error} /></div>
        ) : summary ? (
          <>
            <StatCard label="Total Clients" value={summary.total_clients} index={0} />
            <StatCard
              label="Active Projects" value={summary.active_projects} index={1}
              accentColor="#3B82F6"
              onClick={() => navigate('/projects')}
            />
            <StatCard label="Avg Health" value={summary.avg_health_score} index={2} sublabel="out of 100" />
            <StatCard
              label="Overdue Milestones" value={summary.overdue_milestones_count} index={3}
              pulse={summary.overdue_milestones_count > 0}
              accentColor={summary.overdue_milestones_count > 0 ? 'var(--health-failing)' : undefined}
            />
          </>
        ) : null}
      </div>

      {/* Two-column lower section */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-md)', alignItems: 'start' }}>
          <HealthDistributionBar distribution={summary.health_distribution} total={totalProjects} />
          <RecentActivity updates={summary.recent_updates} />
        </div>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <Skeleton variant="card" height={140} />
          <Skeleton variant="card" height={200} />
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .dashboard-lower { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
