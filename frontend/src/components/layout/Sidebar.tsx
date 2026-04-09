import { NavLink, useLocation } from 'react-router-dom'
import type { Theme } from '../../hooks/useTheme'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  theme: Theme
  onThemeToggle: () => void
}

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    end: true,
  },
  {
    to: '/clients',
    label: 'Clients',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    end: false,
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    end: false,
  },
]

export default function Sidebar({ collapsed, onToggle, theme, onThemeToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      style={{
        width: collapsed ? 60 : 220,
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed ? '20px 0' : '20px 0',
        transition: 'width var(--transition-slow)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: collapsed ? '0 0 20px' : '0 20px 24px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff',
            fontWeight: 800,
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
          }}
        >
          E
        </div>
        {!collapsed && (
          <span
            style={{
              fontWeight: 700,
              fontSize: 'var(--text-base)',
              color: 'var(--text-primary)',
              letterSpacing: 'var(--tracking-tight)',
              whiteSpace: 'nowrap',
            }}
          >
            EngageTrack
          </span>
        )}
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: collapsed ? '8px 8px' : '8px 10px',
          position: 'relative',
        }}
      >
        {NAV_ITEMS.map(({ to, label, icon, end }) => {
          const isActive = end
            ? location.pathname === to
            : location.pathname.startsWith(to)

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px' : '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-primary-subtle)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                transition: 'background var(--transition-base), color var(--transition-base)',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    background: 'var(--accent-primary)',
                    borderRadius: '0 3px 3px 0',
                  }}
                />
              )}
              <span style={{ flexShrink: 0 }}>{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: collapsed ? '16px 0' : '16px 12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: collapsed ? '8px' : '8px 10px',
            background: 'none',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            transition: 'background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </span>
          {!collapsed && (
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          )}
        </button>

        {/* Collapse toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>v1.0.0</span>
          )}
          <button
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px 6px',
              fontSize: 12,
              transition: 'color var(--transition-fast), border-color var(--transition-fast)',
              lineHeight: 1,
            }}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>
      </div>
    </aside>
  )
}
