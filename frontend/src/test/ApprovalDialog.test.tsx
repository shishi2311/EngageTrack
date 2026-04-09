import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApprovalDialog } from '../components/milestones/ApprovalDialog'
import type { Milestone } from '../types'
import * as apiClient from '../api/client'

vi.mock('../api/client', () => ({
  approveMilestone: vi.fn(),
}))

const mockMilestone: Milestone = {
  id: 'ms-abc',
  project_id: 'proj-1',
  title: 'Core API Implementation',
  description: null,
  status: 'pending_approval',
  due_date: '2099-06-30',
  completed_at: null,
  sort_order: 2,
  valid_transitions: ['approved', 'in_progress'],
  latest_approval: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('ApprovalDialog', () => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()
  const addToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and milestone name when open', () => {
    render(
      <ApprovalDialog
        milestone={mockMilestone}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
        addToast={addToast}
      />
    )
    expect(screen.getByText('Review Milestone')).toBeInTheDocument()
    expect(screen.getByText('Core API Implementation')).toBeInTheDocument()
  })

  it('does not render when open=false', () => {
    render(
      <ApprovalDialog
        milestone={mockMilestone}
        open={false}
        onClose={onClose}
        onSuccess={onSuccess}
        addToast={addToast}
      />
    )
    expect(screen.queryByText('Review Milestone')).not.toBeInTheDocument()
  })

  it('shows error when approve clicked without approver name', async () => {
    render(
      <ApprovalDialog
        milestone={mockMilestone}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
        addToast={addToast}
      />
    )
    fireEvent.click(screen.getByText('✓ Approve'))
    expect(await screen.findByText('Your name is required.')).toBeInTheDocument()
    expect(apiClient.approveMilestone).not.toHaveBeenCalled()
  })

  it('shows error when reject clicked without approver name', async () => {
    render(
      <ApprovalDialog
        milestone={mockMilestone}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
        addToast={addToast}
      />
    )
    fireEvent.click(screen.getByText('✕ Reject'))
    expect(await screen.findByText('Your name is required.')).toBeInTheDocument()
    expect(apiClient.approveMilestone).not.toHaveBeenCalled()
  })

  it('calls approveMilestone with decision=approved when Approve clicked with name', async () => {
    vi.mocked(apiClient.approveMilestone).mockResolvedValue({} as Milestone)
    render(
      <ApprovalDialog
        milestone={mockMilestone}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
        addToast={addToast}
      />
    )
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Sarah Chen/i), {
      target: { value: 'Jane Doe' },
    })
    fireEvent.click(screen.getByText('✓ Approve'))
    await waitFor(() => {
      expect(apiClient.approveMilestone).toHaveBeenCalledWith('ms-abc', {
        approved_by: 'Jane Doe',
        decision: 'approved',
        comments: undefined,
      })
    })
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('approved'), 'success')
    expect(onSuccess).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('calls approveMilestone with decision=rejected when Reject clicked with name', async () => {
    vi.mocked(apiClient.approveMilestone).mockResolvedValue({} as Milestone)
    render(
      <ApprovalDialog
        milestone={mockMilestone}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
        addToast={addToast}
      />
    )
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Sarah Chen/i), {
      target: { value: 'Bob Smith' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Any notes/i), {
      target: { value: 'Not ready yet.' },
    })
    fireEvent.click(screen.getByText('✕ Reject'))
    await waitFor(() => {
      expect(apiClient.approveMilestone).toHaveBeenCalledWith('ms-abc', {
        approved_by: 'Bob Smith',
        decision: 'rejected',
        comments: 'Not ready yet.',
      })
    })
    expect(addToast).toHaveBeenCalledWith(expect.stringContaining('rejected'), 'success')
  })

  it('shows error toast on API failure', async () => {
    vi.mocked(apiClient.approveMilestone).mockRejectedValue(new Error('Server error'))
    render(
      <ApprovalDialog
        milestone={mockMilestone}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
        addToast={addToast}
      />
    )
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Sarah Chen/i), {
      target: { value: 'Jane Doe' },
    })
    fireEvent.click(screen.getByText('✓ Approve'))
    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith('Server error', 'error')
    })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows rejection note text', () => {
    render(
      <ApprovalDialog
        milestone={mockMilestone}
        open={true}
        onClose={onClose}
        onSuccess={onSuccess}
        addToast={addToast}
      />
    )
    expect(
      screen.getByText('Rejecting will return this milestone to In Progress')
    ).toBeInTheDocument()
  })
})
