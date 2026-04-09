import { type ReactNode, useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { ToastContainer } from '../shared/Toast'
import { useToast } from '../../hooks/useToast'

interface AppShellProps {
  children: ReactNode
}

export const ToastContext = (() => {
  // Simple context-free toast — shell passes addToast via window for now
  // A proper context is wired in App.tsx via ToastProvider
  return null
})()

export default function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  // Collapse sidebar on narrow viewports
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    setCollapsed(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Expose addToast globally so pages/forms can trigger toasts without prop-drilling
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__addToast = addToast
  }, [addToast])

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        maxWidth: 1400,
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main
        style={{
          flex: 1,
          padding: 'var(--space-xl)',
          minWidth: 0,
          overflowX: 'hidden',
        }}
      >
        {children}
      </main>
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  )
}
