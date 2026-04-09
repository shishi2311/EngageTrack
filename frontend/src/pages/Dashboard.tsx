import { useCallback } from 'react'
import { useApi } from '../hooks/useApi'
import { getDashboardSummary, getProjects } from '../api/client'
import type { DashboardSummary, Project } from '../types'
import PageHeader from '../components/layout/PageHeader'
import { Skeleton } from '../components/shared/Skeleton'
import { EmptyState } from '../components/shared/EmptyState'
import { ProjectCard } from '../components/shared/ProjectCard'

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  index: number
  pulse?: boolean
  sublabel?: string
}

function StatCard({ label, value, index, pulse = false, sublabel }: StatCardProps) {
  return (
    <div
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
        transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          letterSpacing: 'var(--tracking-tight)',
          color: pulse ? 'var(--health-failing)' : 'var(--text-primary)',
          animation: pulse ? 'pulse-red 2s ease-in-out infinite' : undefined,
        }}
      >
        {value}
      </p>
      {sublabel && (
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          {sublabel}
        </p>
      )}
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <Skeleton width={80} height={12} />
      <Skeleton width={60} height={36} />
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const summaryFn = useCallback(() => getDashboardSummary(), [])
  const projectsFn = useCallback(() => getProjects({ status: 'in_progress' }), [])

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
  } = useApi<DashboardSummary>(summaryFn)

  const {
    data: projects,
    loading: projectsLoading,
    error: projectsError,
  } = useApi<Project[]>(projectsFn)

  return (
    <div className="page-enter">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of all client engagements"
      />

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : summaryError ? (
          <p style={{ color: 'var(--health-failing)', gridColumn: '1/-1', fontSize: 'var(--text-sm)' }}>
            Failed to load summary: {summaryError}
          </p>
        ) : summary ? (
          <>
            <StatCard
              label="Total Clients"
              value={summary.total_clients}
              index={0}
            />
            <StatCard
              label="Active Projects"
              value={summary.active_projects}
              index={1}
            />
            <StatCard
              label="Avg Health Score"
              value={summary.avg_health_score}
              index={2}
              sublabel="out of 100"
            />
            <StatCard
              label="Overdue Milestones"
              value={summary.overdue_milestones_count}
              index={3}
              pulse={summary.overdue_milestones_count > 0}
            />
          </>
        ) : null}
      </div>

      {/* Active projects */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <h2
          style={{
            margin: '0 0 var(--space-md)',
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight)',
          }}
        >
          Active Projects
        </h2>

        {projectsLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={180} />
            ))}
          </div>
        ) : projectsError ? (
          <p style={{ color: 'var(--health-failing)', fontSize: 'var(--text-sm)' }}>
            Failed to load projects: {projectsError}
          </p>
        ) : projects && projects.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            {projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        ) : (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <EmptyState
              title="No active projects"
              subtitle="Create a project for a client to get started tracking engagements."
            />
          </div>
        )}
      </div>
    </div>
  )
}
