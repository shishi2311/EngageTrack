import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectCard } from '../components/shared/ProjectCard'
import type { Project } from '../types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// requestAnimationFrame stub for HealthRing + ProgressBar animations
vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
  cb(performance.now() + 1000)
  return 1
})

function buildProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    client_id: 'client-1',
    client_name: 'Meridian Health',
    name: 'Patient Portal Redesign',
    description: null,
    status: 'in_progress',
    start_date: '2025-09-01',
    target_end_date: '2099-06-30',
    actual_end_date: null,
    health_score: 82,
    health_breakdown: {
      completion_score: 60,
      on_time_score: 100,
      blocker_score: 100,
      active_blockers: 0,
      completed_milestones: 3,
      total_milestones: 5,
    },
    milestone_count: 5,
    completed_milestone_count: 3,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('ProjectCard', () => {
  it('renders project name', () => {
    render(<MemoryRouter><ProjectCard project={buildProject()} /></MemoryRouter>)
    expect(screen.getByText('Patient Portal Redesign')).toBeInTheDocument()
  })

  it('renders client name', () => {
    render(<MemoryRouter><ProjectCard project={buildProject()} /></MemoryRouter>)
    expect(screen.getByText('Meridian Health')).toBeInTheDocument()
  })

  it('renders milestone progress text', () => {
    render(<MemoryRouter><ProjectCard project={buildProject()} /></MemoryRouter>)
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  it('renders milestone count label', () => {
    render(<MemoryRouter><ProjectCard project={buildProject()} /></MemoryRouter>)
    expect(screen.getByText('5 milestones')).toBeInTheDocument()
  })

  it('renders singular "milestone" for count of 1', () => {
    render(
      <MemoryRouter>
        <ProjectCard project={buildProject({ milestone_count: 1, completed_milestone_count: 0 })} />
      </MemoryRouter>
    )
    expect(screen.getByText('1 milestone')).toBeInTheDocument()
  })

  it('renders the StatusBadge for project status', () => {
    render(<MemoryRouter><ProjectCard project={buildProject()} /></MemoryRouter>)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('navigates to project detail page when clicked', () => {
    render(<MemoryRouter><ProjectCard project={buildProject()} /></MemoryRouter>)
    fireEvent.click(screen.getByText('Patient Portal Redesign'))
    expect(mockNavigate).toHaveBeenCalledWith('/projects/proj-1')
  })

  it('shows due date', () => {
    render(<MemoryRouter><ProjectCard project={buildProject()} /></MemoryRouter>)
    expect(screen.getByText(/Due Jun 30, 2099/)).toBeInTheDocument()
  })

  it('shows overdue label when target date is in the past and status is in_progress', () => {
    render(
      <MemoryRouter>
        <ProjectCard
          project={buildProject({ target_end_date: '2020-01-01', status: 'in_progress' })}
        />
      </MemoryRouter>
    )
    expect(screen.getByText(/Overdue/)).toBeInTheDocument()
  })

  it('does NOT show overdue label for completed project', () => {
    render(
      <MemoryRouter>
        <ProjectCard
          project={buildProject({ target_end_date: '2020-01-01', status: 'completed' })}
        />
      </MemoryRouter>
    )
    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument()
  })
})
