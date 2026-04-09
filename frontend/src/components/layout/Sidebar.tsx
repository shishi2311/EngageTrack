import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-lg)',
    }}>
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent-primary)' }}>■ </span>EngageTrack
        </span>
      </div>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {[
          { to: '/', label: 'Dashboard' },
          { to: '/clients', label: 'Clients' },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-primary-subtle)' : 'transparent',
              fontWeight: isActive ? 500 : 400,
              textDecoration: 'none',
              transition: 'background var(--transition-base)',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
        v1.0 · EngageTrack
      </div>
    </aside>
  )
}
