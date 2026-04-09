import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 'var(--space-md)' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)' }}>404</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Page not found.</p>
      <Link to="/" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Back to Dashboard</Link>
    </div>
  )
}
