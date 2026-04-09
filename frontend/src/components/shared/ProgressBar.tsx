/** Placeholder — full implementation in Phase 2 */
export default function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '9999px' }} />
    </div>
  )
}
