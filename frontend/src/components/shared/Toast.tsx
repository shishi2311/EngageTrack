import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error'

export interface ToastData {
  id: string
  message: string
  type: ToastType
}

interface ToastItemProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [progress, setProgress] = useState(100)
  const [visible, setVisible] = useState(false)
  const duration = 4000

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setVisible(true), 10)

    // Progress bar countdown
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const elapsed = now - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (elapsed < duration) {
        raf = requestAnimationFrame(tick)
      } else {
        setVisible(false)
        setTimeout(() => onDismiss(toast.id), 300)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      clearTimeout(enterTimer)
      cancelAnimationFrame(raf)
    }
  }, [toast.id, onDismiss])

  const isSuccess = toast.type === 'success'
  const accentColor = isSuccess ? 'var(--health-healthy)' : 'var(--health-failing)'

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${isSuccess ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        minWidth: 280,
        maxWidth: 360,
        overflow: 'hidden',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s ease, opacity 0.25s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        <span style={{ fontSize: 16 }}>{isSuccess ? '✓' : '✕'}</span>
        <span
          style={{
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            flex: 1,
          }}
        >
          {toast.message}
        </span>
        <button
          onClick={() => onDismiss(toast.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: 16,
            padding: '0 2px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ height: 2, background: 'var(--bg-tertiary)' }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: accentColor,
            transition: 'width 0.1s linear',
          }}
        />
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
