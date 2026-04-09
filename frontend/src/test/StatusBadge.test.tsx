import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../components/shared/StatusBadge'

describe('StatusBadge', () => {
  it('renders the correct label for in_progress', () => {
    render(<StatusBadge status="in_progress" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('renders the correct label for pending_approval', () => {
    render(<StatusBadge status="pending_approval" />)
    expect(screen.getByText('Pending Approval')).toBeInTheDocument()
  })

  it('renders the correct label for completed', () => {
    render(<StatusBadge status="completed" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('renders the correct label for planning', () => {
    render(<StatusBadge status="planning" />)
    expect(screen.getByText('Planning')).toBeInTheDocument()
  })

  it('renders the correct label for cancelled', () => {
    render(<StatusBadge status="cancelled" />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })

  it('renders the correct label for blocker update type', () => {
    render(<StatusBadge status="blocker" />)
    expect(screen.getByText('Blocker')).toBeInTheDocument()
  })

  it('uses green color for completed status', () => {
    const { container } = render(<StatusBadge status="completed" />)
    const badge = container.firstChild as HTMLElement
    // jsdom resolves #22C55E → rgb(34, 197, 94)
    expect(badge.style.color).toBe('rgb(34, 197, 94)')
  })

  it('uses red color for blocker type', () => {
    const { container } = render(<StatusBadge status="blocker" />)
    const badge = container.firstChild as HTMLElement
    // jsdom resolves #EF4444 → rgb(239, 68, 68)
    expect(badge.style.color).toBe('rgb(239, 68, 68)')
  })

  it('renders dot-only variant without text', () => {
    render(<StatusBadge status="active" variant="dot-only" />)
    expect(screen.queryByText('Active')).not.toBeInTheDocument()
  })

  it('falls back gracefully for unknown status', () => {
    render(<StatusBadge status="unknown_status" />)
    expect(screen.getByText('Unknown Status')).toBeInTheDocument()
  })
})
