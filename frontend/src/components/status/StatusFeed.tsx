import { useState } from 'react'
import type { StatusUpdate, UpdateType } from '../../types'
import { createStatusUpdate } from '../../api/client'

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<UpdateType, { color: string; label: string }> = {
  progress: { color: 'var(--status-progress)', label: 'Progress' },
  blocker: { color: 'var(--status-blocker)', label: 'Blocker' },
  risk: { color: 'var(--status-risk)', label: 'Risk' },
  general: { color: 'var(--status-general)', label: 'General' },
}

const UPDATE_TYPES: UpdateType[] = ['progress', 'blocker', 'risk', 'general']

// ── Add Update Form ───────────────────────────────────────────────────────────

interface StatusFormProps {
  projectId: string
  onSuccess: () => void
  onCancel: () => void
  addToast: (msg: string, type: 'success' | 'error') => void
}

function StatusForm({ projectId, onSuccess, onCancel, addToast }: StatusFormProps) {
  const [type, setType] = useState<UpdateType>('progress')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [contentError, setContentError] = useState('')

  const handleSubmit = async () => {
    if (!content.trim()) {
      setContentError('Content is required.')
      return
    }
    setContentError('')
    setSubmitting(true)
    try {
      await createStatusUpdate(projectId, { content: content.trim(), update_type: type })
      addToast('Update added.', 'success')
      onSuccess()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to add update.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: 'var(--space-md)',
        animation: 'slideDown 0.2s ease',
      }}
    >
      {/* Type selector pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {UPDATE_TYPES.map((t) => {
          const cfg = TYPE_CONFIG[t]
          const selected = type === t
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '4px 12px',
                borderRadius: 9999,
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${selected ? cfg.color : 'var(--border-default)'}`,
                background: selected ? `color-mix(in srgb, ${cfg.color} 15%, transparent)` : 'transparent',
                color: selected ? cfg.color : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setContentError('') }}
        placeholder={`Describe the ${type}...`}
        rows={3}
        style={{
          width: '100%',
          padding: '9px 12px',
          background: 'var(--bg-secondary)',
          border: `1px solid ${contentError ? 'var(--health-failing)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-sans)',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          transition: 'border-color var(--transition-fast)',
        }}
        onFocus={(e) => { if (!contentError) e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
        onBlur={(e) => { if (!contentError) e.currentTarget.style.borderColor = 'var(--border-default)' }}
      />
      {contentError && (
        <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--health-failing)' }}>
          {contentError}
        </p>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '7px 14px',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '7px 14px',
            background: 'var(--accent-primary)',
            border: '1px solid transparent',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Posting…' : 'Post Update'}
        </button>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Feed item ─────────────────────────────────────────────────────────────────

function FeedItem({ update }: { update: StatusUpdate }) {
  const cfg = TYPE_CONFIG[update.update_type]
  const isBlocker = update.update_type === 'blocker'

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        background: isBlocker ? 'rgba(239,68,68,0.04)' : 'transparent',
        borderLeft: isBlocker ? '3px solid rgba(239,68,68,0.4)' : '3px solid transparent',
        borderRadius: 'var(--radius-sm)',
        transition: 'background var(--transition-fast)',
      }}
    >
      {/* Type dot */}
      <div style={{ paddingTop: 3, flexShrink: 0 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: cfg.color,
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '1px 7px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 600,
              background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
              color: cfg.color,
            }}
          >
            {cfg.label}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {relativeTime(update.created_at)}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {update.content}
        </p>
      </div>
    </div>
  )
}

// ── Status Feed ───────────────────────────────────────────────────────────────

interface StatusFeedProps {
  projectId: string
  updates: StatusUpdate[]
  onRefetch: () => void
  addToast: (msg: string, type: 'success' | 'error') => void
}

export function StatusFeed({ projectId, updates, onRefetch, addToast }: StatusFeedProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
          Activity
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-primary-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            + Add Update
          </button>
        )}
      </div>

      {/* Add update form */}
      {showForm && (
        <StatusForm
          projectId={projectId}
          onSuccess={() => { setShowForm(false); onRefetch() }}
          onCancel={() => setShowForm(false)}
          addToast={addToast}
        />
      )}

      {/* Feed items */}
      {updates.length === 0 ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No updates yet.</p>
      ) : (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          {updates.map((u, i) => (
            <div
              key={u.id}
              style={{
                borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
              }}
            >
              <FeedItem update={u} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StatusFeed
