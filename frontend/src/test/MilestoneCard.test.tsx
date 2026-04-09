import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MilestoneTimeline } from '../components/milestones/MilestoneTimeline'
import type { Milestone } from '../types'

// transitionMilestone makes real fetch calls — mock the whole api module
vi.mock('../api/client', () => ({
  transitionMilestone: vi.fn(),
  approveMilestone: vi.fn(),
}))

function buildMilestone(overrides: Partial<Milestone>): Milestone {
  return {
    id: 'milestone-1',
    project_id: 'proj-1',
    title: 'Test Milestone',
    description: null,
    status: 'pending',
    due_date: '2099-12-31',
    completed_at: null,
    sort_order: 1,
    valid_transitions: [],
    latest_approval: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

const noop = () => {}

describe('MilestoneTimeline — action button visibility', () => {
  it('shows Start Work button for pending milestone', () => {
    const m = buildMilestone({ status: 'pending', valid_transitions: ['in_progress'] })
    render(
      <MemoryRouter>
        <MilestoneTimeline milestones={[m]} onRefetch={noop} addToast={noop} />
      </MemoryRouter>
    )
    const btn = screen.getByText('Start Work')
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })

  it('Start Work button is disabled when not in valid_transitions', () => {
    const m = buildMilestone({ status: 'in_progress', valid_transitions: ['pending_approval'] })
    render(
      <MemoryRouter>
        <MilestoneTimeline milestones={[m]} onRefetch={noop} addToast={noop} />
      </MemoryRouter>
    )
    const btn = screen.getByText('Start Work')
    expect(btn).toBeDisabled()
  })

  it('shows Request Approval button for in_progress milestone', () => {
    const m = buildMilestone({ status: 'in_progress', valid_transitions: ['pending_approval'] })
    render(
      <MemoryRouter>
        <MilestoneTimeline milestones={[m]} onRefetch={noop} addToast={noop} />
      </MemoryRouter>
    )
    const btn = screen.getByText('Request Approval')
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })

  it('shows Review button for pending_approval milestone', () => {
    const m = buildMilestone({
      status: 'pending_approval',
      valid_transitions: ['approved', 'in_progress'],
    })
    render(
      <MemoryRouter>
        <MilestoneTimeline milestones={[m]} onRefetch={noop} addToast={noop} />
      </MemoryRouter>
    )
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('shows Mark Complete button for approved milestone', () => {
    const m = buildMilestone({ status: 'approved', valid_transitions: ['completed'] })
    render(
      <MemoryRouter>
        <MilestoneTimeline milestones={[m]} onRefetch={noop} addToast={noop} />
      </MemoryRouter>
    )
    const btn = screen.getByText('Mark Complete')
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })

  it('shows completed milestone with no enabled action buttons', () => {
    const m = buildMilestone({ status: 'completed', valid_transitions: [] })
    render(
      <MemoryRouter>
        <MilestoneTimeline milestones={[m]} onRefetch={noop} addToast={noop} />
      </MemoryRouter>
    )
    // All transition buttons exist but are disabled
    const startBtn = screen.getByText('Start Work')
    const approvalBtn = screen.getByText('Request Approval')
    const completeBtn = screen.getByText('Mark Complete')
    expect(startBtn).toBeDisabled()
    expect(approvalBtn).toBeDisabled()
    expect(completeBtn).toBeDisabled()
  })

  it('shows overdue date in red for past-due incomplete milestone', () => {
    const m = buildMilestone({ status: 'in_progress', due_date: '2020-01-01', valid_transitions: ['pending_approval'] })
    const { container } = render(
      <MemoryRouter>
        <MilestoneTimeline milestones={[m]} onRefetch={noop} addToast={noop} />
      </MemoryRouter>
    )
    const dueParagraph = container.querySelector('p[style*="color: var(--health-failing)"]')
    expect(dueParagraph).not.toBeNull()
    expect(dueParagraph?.textContent).toMatch(/overdue/)
  })

  it('shows progress count badge', () => {
    const m1 = buildMilestone({ id: '1', status: 'completed', valid_transitions: [] })
    const m2 = buildMilestone({ id: '2', status: 'in_progress', valid_transitions: ['pending_approval'] })
    render(
      <MemoryRouter>
        <MilestoneTimeline milestones={[m1, m2]} onRefetch={noop} addToast={noop} />
      </MemoryRouter>
    )
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })
})
