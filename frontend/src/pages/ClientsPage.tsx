import { useCallback, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { getClients } from '../api/client'
import type { Client } from '../types'
import PageHeader from '../components/layout/PageHeader'
import { ClientList } from '../components/clients/ClientList'
import { ClientForm } from '../components/clients/ClientForm'

function addToast(msg: string, type: 'success' | 'error') {
  const fn = (window as unknown as Record<string, unknown>).__addToast
  if (typeof fn === 'function') fn(msg, type)
}

export default function ClientsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchFn = useCallback(() => getClients(), [refreshKey])
  const { data: clients, loading, error } = useApi<Client[]>(fetchFn)

  const refetch = () => setRefreshKey((k) => k + 1)

  return (
    <div className="page-enter">
      <PageHeader
        title="Clients"
        subtitle={clients ? `${clients.length} client${clients.length !== 1 ? 's' : ''}` : undefined}
        actions={
          <button
            onClick={() => setFormOpen(true)}
            style={{
              padding: '9px 18px',
              background: 'var(--accent-primary)',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background var(--transition-fast), transform var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-primary-hover)'
              e.currentTarget.style.transform = 'scale(1.01)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-primary)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.01)')}
          >
            + Add Client
          </button>
        }
      />

      {error ? (
        <p style={{ color: 'var(--health-failing)', fontSize: 'var(--text-sm)' }}>
          Failed to load clients: {error}
        </p>
      ) : (
        <ClientList
          clients={clients ?? []}
          loading={loading}
          onAddClient={() => setFormOpen(true)}
        />
      )}

      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={refetch}
        addToast={addToast}
      />
    </div>
  )
}
