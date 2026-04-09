import { useCallback, useState, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import { getProjects } from '../api/client'
import type { Project, ProjectStatus, HealthCategory } from '../types'
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

const HEALTH_OPTIONS: { value: HealthCategory; label: string; color: string; bg: string }[] = [
  { value: 'healthy',  label: 'Healthy',  color: 'var(--health-healthy)',  bg: 'var(--health-healthy-bg)'  },
  { value: 'at_risk',  label: 'At Risk',  color: 'var(--health-at-risk)',  bg: 'var(--health-at-risk-bg)'  },
  { value: 'critical', label: 'Critical', color: 'var(--health-critical)', bg: 'var(--health-critical-bg)' },
  { value: 'failing',  label: 'Failing',  color: 'var(--health-failing)',  bg: 'var(--health-failing-bg)'  },
]

function scoreToCategory(score: number): HealthCategory {
  if (score >= 80) return 'healthy'
  if (score >= 60) return 'at_risk'
  if (score >= 30) return 'critical'
  return 'failing'
}

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

function HealthFilter({ projects, activeHealth, onSelect }: {
  projects: Project[]
  activeHealth: HealthCategory | null
  onSelect: (h: HealthCategory | null) => void
}) {
  const counts: Partial<Record<HealthCategory, number>> = {}
  for (const p of projects) {
    const cat = scoreToCategory(p.health_score)
    counts[cat] = (counts[cat] ?? 0) + 1
  }

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 'var(--space-md)', alignItems: 'center' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginRight: 4 }}>Health:</span>
      {HEALTH_OPTIONS.map(({ value, label, color, bg }) => {
        const count = counts[value] ?? 0
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
      {activeHealth && (
        <button
          onClick={() => onSelect(null)}
          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 500, marginLeft: 4 }}
        >
          Clear ×
        </button>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | 'all'>('all')
  const [activeHealth, setActiveHealth] = useState<HealthCategory | null>(null)
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const projectsFn = useCallback(() => getProjects(), [refreshKey])
  const { data: allProjects, loading, error } = useApi<Project[]>(projectsFn)
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), [])

  const filteredProjects = useMemo(() => {
    if (!allProjects) return []
    return allProjects.filter((p) => {
      const statusMatch = activeStatus === 'all' || p.status === activeStatus
      const healthMatch = !activeHealth || scoreToCategory(p.health_score) === activeHealth
      return statusMatch && healthMatch
    })
  }, [allProjects, activeStatus, activeHealth])

  return (
    <div className="page-enter">
      <PageHeader
        title="Projects"
        subtitle={allProjects ? `${allProjects.length} project${allProjects.length !== 1 ? 's' : ''} across all clients` : 'All client engagements'}
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

      {!loading && allProjects && allProjects.length > 0 && (
        <>
          <StatusTabs projects={allProjects} activeStatus={activeStatus} onSelect={setActiveStatus} />
          <HealthFilter projects={allProjects} activeHealth={activeHealth} onSelect={setActiveHealth} />
        </>
      )}

      {/* Show count when filtering */}
      {!loading && allProjects && allProjects.length > 0 && (activeStatus !== 'all' || activeHealth) && (
        <p style={{ margin: '0 0 var(--space-md)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          Showing {filteredProjects.length} of {allProjects.length} projects
        </p>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" height={180} />)}
        </div>
      ) : error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : filteredProjects.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {filteredProjects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} onRefetch={refetch} />
          ))}
        </div>
      ) : allProjects && allProjects.length > 0 ? (
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
