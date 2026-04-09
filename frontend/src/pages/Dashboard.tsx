import { useCallback, useState, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { getDashboardSummary, getProjects } from '../api/client'
import type { DashboardSummary, Project, ProjectStatus, HealthCategory } from '../types'
import PageHeader from '../components/layout/PageHeader'
import { Skeleton } from '../components/shared/Skeleton'
import { EmptyState } from '../components/shared/EmptyState'
import { ProjectCard } from '../components/shared/ProjectCard'
import { ErrorCard } from '../components/shared/ErrorCard'
import { AddProjectForm } from '../components/projects/AddProjectForm'
import { STATUS_OPTIONS } from '../components/projects/ProjectStatusPicker'

function addToast(msg: string, type: 'success' | 'error') {
  const fn = (window as unknown as Record<string, unknown>).__addToast
  if (typeof fn === 'function') fn(msg, type)
}

// ── Health config ─────────────────────────────────────────────────────────────

const HEALTH_OPTIONS: { value: HealthCategory; label: string; color: string; bg: string; range: string }[] = [
  { value: 'healthy',  label: 'Healthy',  color: 'var(--health-healthy)',  bg: 'var(--health-healthy-bg)',  range: '80–100' },
  { value: 'at_risk',  label: 'At Risk',  color: 'var(--health-at-risk)',  bg: 'var(--health-at-risk-bg)',  range: '60–79'  },
  { value: 'critical', label: 'Critical', color: 'var(--health-critical)', bg: 'var(--health-critical-bg)', range: '30–59'  },
  { value: 'failing',  label: 'Failing',  color: 'var(--health-failing)',  bg: 'var(--health-failing-bg)',  range: '0–29'   },
]

function scoreToCategory(score: number): HealthCategory {
  if (score >= 80) return 'healthy'
  if (score >= 60) return 'at_risk'
  if (score >= 30) return 'critical'
  return 'failing'
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  index: number
  pulse?: boolean
  sublabel?: string
  active?: boolean
  onClick?: () => void
  accentColor?: string
}

function StatCard({ label, value, index, pulse, sublabel, active, onClick, accentColor }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
        border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        animationDelay: `${index * 60}ms`,
        animation: 'fadeInUp 0.4s ease forwards',
        opacity: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color var(--transition-base), background var(--transition-base), box-shadow var(--transition-base)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = active ? 'var(--border-strong)' : 'var(--accent-primary)'
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = active ? 'var(--border-strong)' : 'var(--border-subtle)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: accentColor ?? 'var(--accent-primary)',
        }} />
      )}
      <p style={{
        margin: 0, fontSize: 'var(--text-xs)', fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: active ? 'var(--text-secondary)' : 'var(--text-tertiary)',
      }}>
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

function HealthDistributionBar({ distribution, total, activeHealth, onSelect }: {
  distribution: DashboardSummary['health_distribution']
  total: number
  activeHealth: HealthCategory | null
  onSelect: (h: HealthCategory | null) => void
}) {
  if (total === 0) return null
  return (
    <div style={{ marginBottom: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
          Portfolio Health
        </span>
        {activeHealth && (
          <button onClick={() => onSelect(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 500 }}>
            Clear filter ×
          </button>
        )}
      </div>
      {/* Stacked bar */}
      <div style={{ height: 8, borderRadius: 9999, overflow: 'hidden', display: 'flex', gap: 2, marginBottom: 10 }}>
        {HEALTH_OPTIONS.map(({ value, color }) => {
          const count = distribution[value] ?? 0
          const pct = total > 0 ? (count / total) * 100 : 0
          if (pct === 0) return null
          return (
            <div key={value} style={{ width: `${pct}%`, background: color, borderRadius: 9999, transition: 'opacity var(--transition-fast)', opacity: activeHealth && activeHealth !== value ? 0.3 : 1 }} />
          )
        })}
      </div>
      {/* Legend pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {HEALTH_OPTIONS.map(({ value, label, color, bg }) => {
          const count = distribution[value] ?? 0
          if (count === 0) return null
          const isActive = activeHealth === value
          return (
            <button
              key={value}
              onClick={() => onSelect(isActive ? null : value)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 9999,
                background: isActive ? bg : 'transparent',
                border: `1px solid ${isActive ? color : 'var(--border-subtle)'}`,
                color: isActive ? color : 'var(--text-secondary)',
                fontSize: 'var(--text-xs)', fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', transition: 'all var(--transition-fast)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {label} <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.8 }}>{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Status filter tabs ────────────────────────────────────────────────────────

function StatusTabs({ projects, activeStatus, onSelect }: {
  projects: Project[]
  activeStatus: ProjectStatus | 'all'
  onSelect: (s: ProjectStatus | 'all') => void
}) {
  const counts: Record<string, number> = { all: projects.length }
  for (const p of projects) counts[p.status] = (counts[p.status] ?? 0) + 1

  const tabs: { value: ProjectStatus | 'all'; label: string; color?: string }[] = [
    { value: 'all', label: 'All' },
    ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, color: o.color })),
  ]

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
      {tabs.map(({ value, label, color }) => {
        const count = counts[value] ?? 0
        if (value !== 'all' && count === 0) return null
        const isActive = activeStatus === value
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 'var(--radius-md)',
              background: isActive ? (color ? `${color}1a` : 'var(--accent-primary-subtle)') : 'transparent',
              border: `1px solid ${isActive ? (color ?? 'var(--accent-primary)') : 'var(--border-subtle)'}`,
              color: isActive ? (color ?? 'var(--accent-primary)') : 'var(--text-secondary)',
              fontSize: 'var(--text-xs)', fontWeight: isActive ? 600 : 400,
              cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
          >
            {label}
            <span style={{
              padding: '1px 6px', borderRadius: 9999,
              background: isActive ? 'rgba(255,255,255,0.15)' : 'var(--bg-tertiary)',
              fontFamily: 'var(--font-mono)', fontSize: 10,
            }}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | 'all'>('all')
  const [activeHealth, setActiveHealth] = useState<HealthCategory | null>(null)
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const summaryFn = useCallback(() => getDashboardSummary(), [refreshKey])
  const projectsFn = useCallback(() => getProjects(), [refreshKey])

  const { data: summary, loading: summaryLoading, error: summaryError } = useApi<DashboardSummary>(summaryFn)
  const { data: allProjects, loading: projectsLoading, error: projectsError } = useApi<Project[]>(projectsFn)

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), [])

  // Client-side filtering — snappy, no extra API calls
  const filteredProjects = useMemo(() => {
    if (!allProjects) return []
    return allProjects.filter((p) => {
      const statusMatch = activeStatus === 'all' || p.status === activeStatus
      const healthMatch = !activeHealth || scoreToCategory(p.health_score) === activeHealth
      return statusMatch && healthMatch
    })
  }, [allProjects, activeStatus, activeHealth])

  const activeProjectsCount = allProjects?.filter((p) => p.status === 'in_progress').length ?? 0

  return (
    <div className="page-enter">
      <PageHeader
        title="Dashboard"
        subtitle={allProjects ? `${allProjects.length} project${allProjects.length !== 1 ? 's' : ''} across all clients` : 'Overview of all client engagements'}
        actions={
          <button
            onClick={() => setAddProjectOpen(true)}
            style={{
              padding: '9px 18px',
              background: 'var(--accent-primary)',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background var(--transition-fast), transform var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-primary-hover)'; e.currentTarget.style.transform = 'scale(1.01)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.transform = 'scale(1)' }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
          >
            + New Project
          </button>
        }
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : summaryError ? (
          <div style={{ gridColumn: '1/-1' }}><ErrorCard message={summaryError} /></div>
        ) : summary ? (
          <>
            <StatCard label="Total Clients" value={summary.total_clients} index={0} />
            <StatCard
              label="Active Projects" value={activeProjectsCount} index={1}
              active={activeStatus === 'in_progress'}
              accentColor="#3B82F6"
              onClick={() => setActiveStatus(s => s === 'in_progress' ? 'all' : 'in_progress')}
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

      {/* Health distribution bar */}
      {summary && allProjects && allProjects.length > 0 && (
        <HealthDistributionBar
          distribution={summary.health_distribution}
          total={allProjects.length}
          activeHealth={activeHealth}
          onSelect={setActiveHealth}
        />
      )}

      {/* Projects section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
          Projects
        </h2>
        {!projectsLoading && allProjects && allProjects.length > 0 && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Showing {filteredProjects.length} of {allProjects.length}
          </span>
        )}
      </div>

      {/* Status filter tabs */}
      {!projectsLoading && allProjects && allProjects.length > 0 && (
        <StatusTabs projects={allProjects} activeStatus={activeStatus} onSelect={setActiveStatus} />
      )}

      {/* Project grid */}
      {projectsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" height={180} />)}
        </div>
      ) : projectsError ? (
        <ErrorCard message={projectsError} onRetry={refetch} />
      ) : filteredProjects.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {filteredProjects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} onRefetch={refetch} />
          ))}
        </div>
      ) : allProjects && allProjects.length > 0 ? (
        // Has projects but filters hide them all
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <EmptyState
            title="No projects match this filter"
            subtitle="Try a different status or clear the health filter."
            action={{ label: 'Clear filters', onClick: () => { setActiveStatus('all'); setActiveHealth(null) } }}
          />
        </div>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
          <EmptyState
            title="No projects yet"
            subtitle="Create your first project to start tracking engagement health."
            action={{ label: '+ New Project', onClick: () => setAddProjectOpen(true) }}
          />
        </div>
      )}

      <AddProjectForm
        open={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        onSuccess={refetch}
        addToast={addToast}
      />
    </div>
  )
}
