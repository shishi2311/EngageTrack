import { useState, useEffect } from 'react'
import { Modal } from '../shared/Modal'
import { createProject, getClients } from '../../api/client'
import type { Client } from '../../types'

interface AddProjectFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  addToast: (msg: string, type: 'success' | 'error') => void
  defaultClientId?: string
}

interface FormErrors {
  client_id?: string
  name?: string
  start_date?: string
  target_end_date?: string
}

export function AddProjectForm({ open, onClose, onSuccess, addToast, defaultClientId }: AddProjectFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState(defaultClientId ?? '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) getClients().then(setClients).catch(() => {})
  }, [open])

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!clientId) errs.client_id = 'Select a client.'
    if (!name.trim()) errs.name = 'Project name is required.'
    if (!startDate) errs.start_date = 'Start date is required.'
    if (!endDate) errs.target_end_date = 'Target end date is required.'
    if (startDate && endDate && endDate <= startDate)
      errs.target_end_date = 'End date must be after start date.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await createProject({
        client_id: clientId,
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate,
        target_end_date: endDate,
      })
      addToast(`Project "${name.trim()}" created.`, 'success')
      onSuccess()
      handleClose()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create project.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setName(''); setDescription(''); setStartDate(''); setEndDate('')
    setClientId(defaultClientId ?? ''); setErrors({}); setSubmitting(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Project" maxWidth={520}>
      {/* Client */}
      <div style={fieldWrap}>
        <label style={labelStyle}>Client <span style={{ color: 'var(--health-failing)' }}>*</span></label>
        <select
          value={clientId}
          onChange={(e) => { setClientId(e.target.value); setErrors((p) => ({ ...p, client_id: undefined })) }}
          style={inputStyle(!!errors.client_id)}
        >
          <option value="">Select a client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.client_id && <p style={errStyle}>{errors.client_id}</p>}
      </div>

      {/* Name */}
      <div style={fieldWrap}>
        <label style={labelStyle}>Project Name <span style={{ color: 'var(--health-failing)' }}>*</span></label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
          placeholder="e.g. Payment Gateway v3"
          style={inputStyle(!!errors.name)}
          onFocus={(e) => { if (!errors.name) e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
          onBlur={(e) => { if (!errors.name) e.currentTarget.style.borderColor = 'var(--border-default)' }}
        />
        {errors.name && <p style={errStyle}>{errors.name}</p>}
      </div>

      {/* Description */}
      <div style={fieldWrap}>
        <label style={labelStyle}>Description <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span></label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief overview of the project scope…"
          rows={2}
          style={{ ...inputStyle(false), resize: 'vertical' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Start Date <span style={{ color: 'var(--health-failing)' }}>*</span></label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setErrors((p) => ({ ...p, start_date: undefined })) }}
            style={inputStyle(!!errors.start_date)}
            onFocus={(e) => { if (!errors.start_date) e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
            onBlur={(e) => { if (!errors.start_date) e.currentTarget.style.borderColor = 'var(--border-default)' }}
          />
          {errors.start_date && <p style={errStyle}>{errors.start_date}</p>}
        </div>
        <div>
          <label style={labelStyle}>Target End Date <span style={{ color: 'var(--health-failing)' }}>*</span></label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setErrors((p) => ({ ...p, target_end_date: undefined })) }}
            style={inputStyle(!!errors.target_end_date)}
            onFocus={(e) => { if (!errors.target_end_date) e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
            onBlur={(e) => { if (!errors.target_end_date) e.currentTarget.style.borderColor = 'var(--border-default)' }}
          />
          {errors.target_end_date && <p style={errStyle}>{errors.target_end_date}</p>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={handleClose} style={cancelStyle}>Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '9px 20px',
            background: 'var(--accent-primary)',
            border: '1px solid transparent',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Creating…' : 'Create Project'}
        </button>
      </div>
    </Modal>
  )
}

const fieldWrap: React.CSSProperties = { marginBottom: 16 }
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }
const inputStyle = (err: boolean): React.CSSProperties => ({
  width: '100%', padding: '9px 12px',
  background: 'var(--bg-tertiary)',
  border: `1px solid ${err ? 'var(--health-failing)' : 'var(--border-default)'}`,
  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
  fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color var(--transition-fast)',
})
const errStyle: React.CSSProperties = { margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--health-failing)' }
const cancelStyle: React.CSSProperties = { padding: '9px 16px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer' }

export default AddProjectForm
