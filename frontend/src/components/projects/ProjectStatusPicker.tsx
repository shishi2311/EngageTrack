import { useState, useRef, useEffect } from 'react'
import type { ProjectStatus } from '../../types'
import { updateProject } from '../../api/client'

interface StatusOption {
  value: ProjectStatus
  label: string
  color: string
  bg: string
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'planning',    label: 'Not Started', color: '#818CF8', bg: 'rgba(99,102,241,0.12)' },
  { value: 'in_progress', label: 'Active',       color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  { value: 'on_hold',     label: 'On Hold',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { value: 'completed',   label: 'Finished',     color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  },
  { value: 'cancelled',   label: 'Cancelled',    color: '#6B7280', bg: 'rgba(107,114,128,0.12)'},
]

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning:    'Not Started',
  in_progress: 'Active',
  on_hold:     'On Hold',
  completed:   'Finished',
  cancelled:   'Cancelled',
}

interface ProjectStatusPickerProps {
  projectId: string
  currentStatus: ProjectStatus
  onChanged: () => void
  addToast: (msg: string, type: 'success' | 'error') => void
}

export function ProjectStatusPicker({
  projectId,
  currentStatus,
  onChanged,
  addToast,
}: ProjectStatusPickerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = STATUS_OPTIONS.find((s) => s.value === currentStatus)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = async (status: ProjectStatus) => {
    if (status === currentStatus) { setOpen(false); return }
    setOpen(false)
    setLoading(true)
    try {
      await updateProject(projectId, { status })
      addToast(`Status changed to "${STATUS_LABEL[status]}".`, 'success')
      onChanged()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update status.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        title="Change project status"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          background: current.bg,
          border: `1px solid ${open ? current.color : 'transparent'}`,
          color: current.color,
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          transition: 'border-color var(--transition-fast)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: current.color, flexShrink: 0 }} />
        {loading ? '…' : STATUS_LABEL[currentStatus]}
        <span style={{ fontSize: 9, marginLeft: 2, opacity: 0.7 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 200,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: 160,
            overflow: 'hidden',
            animation: 'scaleIn 0.15s ease',
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '9px 12px',
                background: opt.value === currentStatus ? opt.bg : 'transparent',
                border: 'none',
                color: opt.value === currentStatus ? opt.color : 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                fontWeight: opt.value === currentStatus ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== currentStatus) e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                if (opt.value !== currentStatus) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
              {opt.label}
              {opt.value === currentStatus && (
                <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes scaleIn { from { opacity:0; transform:scale(0.95) translateY(-4px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>
    </div>
  )
}

export default ProjectStatusPicker
