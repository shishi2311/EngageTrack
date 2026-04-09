import { useNavigate } from 'react-router-dom'
import type { Client } from '../../types'
import { StatusBadge } from '../shared/StatusBadge'
import { Skeleton } from '../shared/Skeleton'
import { EmptyState } from '../shared/EmptyState'

interface ClientListProps {
  clients: Client[]
  loading: boolean
  onAddClient: () => void
}

export function ClientList({ clients, loading, onAddClient }: ClientListProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={thStyle}>
          {['Name', 'Email', 'Industry', 'Projects', 'Status'].map((col) => (
            <div key={col} style={{ ...thCell, flex: col === 'Email' ? 2 : 1 }}>{col}</div>
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={rowStyle(false)}>
            <div style={{ ...tdCell, flex: 1 }}><Skeleton width={120} height={14} /></div>
            <div style={{ ...tdCell, flex: 2 }}><Skeleton width={160} height={14} /></div>
            <div style={{ ...tdCell, flex: 1 }}><Skeleton width={80} height={14} /></div>
            <div style={{ ...tdCell, flex: 1 }}><Skeleton width={24} height={14} /></div>
            <div style={{ ...tdCell, flex: 1 }}><Skeleton width={70} height={22} /></div>
          </div>
        ))}
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <EmptyState
          title="No clients yet"
          subtitle="Add your first client to start tracking their engagements."
          action={{ label: 'Add Client', onClick: onAddClient }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Table header */}
      <div style={thStyle}>
        {[
          { label: 'Name', flex: 1 },
          { label: 'Email', flex: 2 },
          { label: 'Industry', flex: 1 },
          { label: 'Projects', flex: 1 },
          { label: 'Status', flex: 1 },
        ].map(({ label, flex }) => (
          <div key={label} style={{ ...thCell, flex }}>{label}</div>
        ))}
      </div>

      {/* Rows */}
      {clients.map((client, i) => (
        <div
          key={client.id}
          style={rowStyle(i < clients.length - 1)}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Name */}
          <div style={{ ...tdCell, flex: 1 }}>
            <button
              onClick={() => navigate(`/?client_id=${client.id}`)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left',
                fontFamily: 'var(--font-sans)',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            >
              {client.name}
            </button>
          </div>

          {/* Email */}
          <div style={{ ...tdCell, flex: 2, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            {client.contact_email}
          </div>

          {/* Industry */}
          <div style={{ ...tdCell, flex: 1, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            {client.industry ?? '—'}
          </div>

          {/* Project count */}
          <div
            style={{
              ...tdCell,
              flex: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            {client.project_count}
          </div>

          {/* Status */}
          <div style={{ ...tdCell, flex: 1 }}>
            <StatusBadge status={client.status} />
          </div>
        </div>
      ))}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  display: 'flex',
  background: 'var(--bg-tertiary)',
  borderBottom: '1px solid var(--border-subtle)',
}

const thCell: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const rowStyle = (hasBorder: boolean): React.CSSProperties => ({
  display: 'flex',
  borderBottom: hasBorder ? '1px solid var(--border-subtle)' : 'none',
  transition: 'background var(--transition-fast)',
  cursor: 'default',
})

const tdCell: React.CSSProperties = {
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  overflow: 'hidden',
}

export default ClientList
