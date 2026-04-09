import { useCallback, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { getProject } from '../api/client'
import type { Project } from '../types'
import { HealthRing } from '../components/shared/HealthRing'
import { ErrorCard } from '../components/shared/ErrorCard'
import { ProjectStatusPicker } from '../components/projects/ProjectStatusPicker'
import { Skeleton } from '../components/shared/Skeleton'
import { MilestoneTimeline } from '../components/milestones/MilestoneTimeline'
import { StatusFeed } from '../components/status/StatusFeed'

// ── Toast helper (global window bridge set in AppShell) ───────────────────────
function addToast(msg: string, type: 'success' | 'error') {
  const fn = (window as unknown as Record<string, unknown>).__addToast
  if (typeof fn === 'function') fn(msg, type)
}

// ── Breakdown card ────────────────────────────────────────────────────────────

function BreakdownCard({ label, value, unit = '%' }: { label: string; value: number; unit?: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
        {value}<span style={{ fontSize: 'var(--text-xs)', fontWeight: 400, marginLeft: 2 }}>{unit}</span>
      </span>
    </div>
  )
}

// ── Skeleton layout ───────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <Skeleton width={120} height={14} />
      </div>
      {/* Header card skeleton */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <Skeleton variant="circle" width={120} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton width="60%" height={28} />
            <Skeleton width="40%" height={16} />
            <Skeleton width="50%" height={14} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Skeleton variant="card" height={60} />
          <Skeleton variant="card" height={60} />
          <Skeleton variant="card" height={60} />
        </div>
      </div>
      {/* Two-column skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="card" height={100} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" height={70} />)}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchFn = useCallback(() => getProject(id!), [id, refreshKey])
  const { data: project, loading, error } = useApi<Project>(fetchFn)

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), [])

  if (!id) {
    navigate('/')
    return null
  }

  if (loading) return <DetailSkeleton />

  if (error) {
    return (
      <div>
        <Link to="/" style={{ display: 'inline-block', marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
          ← Back to Projects
        </Link>
        <ErrorCard message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!project) return null

  const bd = project.health_breakdown
  const milestones = project.milestones ?? []
  const updates = project.recent_status_updates ?? []

  const startDate = new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const endDate = new Date(project.target_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="page-enter">
      {/* Back link */}
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: 'var(--text-sm)',
          marginBottom: 'var(--space-lg)',
          transition: 'color var(--transition-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        ← Back to Projects
      </Link>

      {/* Project header card */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-xl)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        {/* Top row: health ring + info + badge */}
        <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' }}>
          <HealthRing score={project.health_score} size="lg" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: 'var(--tracking-tight)',
                  lineHeight: 1.2,
                }}
              >
                {project.name}
              </h1>
              <ProjectStatusPicker
                projectId={project.id}
                currentStatus={project.status}
                onChanged={refetch}
                addToast={addToast}
              />
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
              {project.client_name}
            </p>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {startDate}
              <span style={{ margin: '0 8px', color: 'var(--border-strong)' }}>→</span>
              {endDate}
            </p>
          </div>
        </div>

        {/* Health breakdown */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <BreakdownCard label="Completion" value={bd.completion_score} />
          <BreakdownCard label="On-Time" value={bd.on_time_score} />
          <BreakdownCard label="Blockers" value={bd.active_blockers} unit="" />
        </div>
      </div>

      {/* Two-column body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
          gap: 'var(--space-xl)',
          alignItems: 'start',
        }}
      >
        {/* LEFT: Milestone timeline */}
        <div>
          <MilestoneTimeline milestones={milestones} onRefetch={refetch} addToast={addToast} />
        </div>

        {/* RIGHT: Status feed */}
        <div>
          <StatusFeed projectId={project.id} updates={updates} onRefetch={refetch} addToast={addToast} />
        </div>
      </div>

      {/* Responsive: stack on small screens */}
      <style>{`
        @media (max-width: 768px) {
          .detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
