import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
  }
}

function DefaultIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="14" height="14" rx="3" fill="var(--bg-tertiary)" />
      <rect x="26" y="8" width="14" height="14" rx="3" fill="var(--bg-tertiary)" />
      <rect x="8" y="26" width="14" height="14" rx="3" fill="var(--bg-tertiary)" />
      <rect x="26" y="26" width="14" height="14" rx="3" fill="var(--accent-primary-subtle)" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  )
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-3xl) var(--space-xl)',
        gap: 'var(--space-md)',
      }}
    >
      <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>
        {icon ?? <DefaultIcon />}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
        }}
      >
        {title}
      </p>
      {subtitle && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            maxWidth: 320,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 'var(--space-sm)',
            padding: '10px 20px',
            background: 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background var(--transition-fast), transform var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-primary-hover)'
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent-primary)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export default EmptyState
