/** Placeholder — full implementation in Phase 2 */
export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 'var(--space-3xl)' }}>
      <p>{title}</p>
      {subtitle && <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>{subtitle}</p>}
    </div>
  )
}
