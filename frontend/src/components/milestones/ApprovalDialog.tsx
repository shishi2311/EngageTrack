import { useState } from 'react'
import { Modal } from '../shared/Modal'
import { approveMilestone } from '../../api/client'
import type { Milestone } from '../../types'

interface ApprovalDialogProps {
  milestone: Milestone
  open: boolean
  onClose: () => void
  onSuccess: () => void
  addToast: (msg: string, type: 'success' | 'error') => void
}

export function ApprovalDialog({
  milestone,
  open,
  onClose,
  onSuccess,
  addToast,
}: ApprovalDialogProps) {
  const [approverName, setApproverName] = useState('')
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [nameError, setNameError] = useState('')

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!approverName.trim()) {
      setNameError('Your name is required.')
      return
    }
    setNameError('')
    setSubmitting(true)
    try {
      await approveMilestone(milestone.id, {
        approved_by: approverName.trim(),
        decision,
        comments: comments.trim() || undefined,
      })
      addToast(
        decision === 'approved'
          ? `Milestone "${milestone.title}" approved.`
          : `Milestone "${milestone.title}" rejected — returned to In Progress.`,
        'success'
      )
      onSuccess()
      onClose()
      setApproverName('')
      setComments('')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Action failed.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = new Date(milestone.due_date) < new Date() && milestone.status !== 'completed'

  return (
    <Modal open={open} onClose={onClose} title={`Review Milestone`}>
      {/* Milestone summary */}
      <div
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: 20,
        }}
      >
        <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
          {milestone.title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-xs)',
            color: isOverdue ? 'var(--health-failing)' : 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Due {new Date(milestone.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          {isOverdue && ' · Overdue'}
        </p>
      </div>

      {/* Approver name */}
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          Your Name <span style={{ color: 'var(--health-failing)' }}>*</span>
        </label>
        <input
          type="text"
          value={approverName}
          onChange={(e) => { setApproverName(e.target.value); setNameError('') }}
          placeholder="e.g. Sarah Chen"
          style={{
            width: '100%',
            padding: '9px 12px',
            background: 'var(--bg-tertiary)',
            border: `1px solid ${nameError ? 'var(--health-failing)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color var(--transition-fast)',
          }}
          onFocus={(e) => { if (!nameError) e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
          onBlur={(e) => { if (!nameError) e.currentTarget.style.borderColor = 'var(--border-default)' }}
        />
        {nameError && (
          <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--health-failing)' }}>
            {nameError}
          </p>
        )}
      </div>

      {/* Comments */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          Comments <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Any notes on this milestone..."
          rows={3}
          style={{
            width: '100%',
            padding: '9px 12px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
            transition: 'border-color var(--transition-fast)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          disabled={submitting}
          onClick={() => handleDecision('approved')}
          style={{
            flex: 1,
            padding: '10px',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--health-healthy)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)' }}
          onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)' }}
        >
          ✓ Approve
        </button>
        <button
          disabled={submitting}
          onClick={() => handleDecision('rejected')}
          style={{
            flex: 1,
            padding: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--health-failing)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            transition: 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}
          onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
        >
          ✕ Reject
        </button>
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
        Rejecting will return this milestone to In Progress
      </p>
    </Modal>
  )
}

export default ApprovalDialog
