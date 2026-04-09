import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-xl)',
        gap: 'var(--space-md)',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: 'var(--tracking-tight)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              marginTop: 'var(--space-xs)',
              marginBottom: 0,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  )
}
