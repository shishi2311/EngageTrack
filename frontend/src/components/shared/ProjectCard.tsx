import { useNavigate } from 'react-router-dom'
import type { Project } from '../../types'
import HealthRing from './HealthRing'
import StatusBadge from './StatusBadge'
import ProgressBar from './ProgressBar'

interface ProjectCardProps {
  project: Project
  index?: number
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const navigate = useNavigate()
  const progress = project.milestone_count > 0
    ? (project.completed_milestone_count / project.milestone_count) * 100
    : 0

  const isOverdue =
    project.status === 'in_progress' &&
    new Date(project.target_end_date) < new Date()

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        cursor: 'pointer',
        transition: 'border-color var(--transition-base), transform var(--transition-base), box-shadow var(--transition-base)',
        animationDelay: `${index * 80}ms`,
        animation: 'fadeInUp 0.4s ease forwards',
        opacity: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header: health ring + project info */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
        <HealthRing score={project.health_score} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: '0 0 4px',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {project.name}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {project.client_name}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Milestone progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Milestones
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}
          >
            {project.completed_milestone_count}/{project.milestone_count}
          </span>
        </div>
        <ProgressBar value={progress} height={4} />
      </div>

      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 'var(--space-sm)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: isOverdue ? 'var(--health-failing)' : 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Due {new Date(project.target_end_date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })}
          {isOverdue && ' · Overdue'}
        </span>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
          }}
        >
          {project.milestone_count} milestone{project.milestone_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

export default ProjectCard
