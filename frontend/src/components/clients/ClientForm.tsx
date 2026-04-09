import { useState } from 'react'
import { Modal } from '../shared/Modal'
import { createClient } from '../../api/client'

interface ClientFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  addToast: (msg: string, type: 'success' | 'error') => void
}

interface FormErrors {
  name?: string
  contact_email?: string
}

export function ClientForm({ open, onClose, onSuccess, addToast }: ClientFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [industry, setIndustry] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = (): boolean => {
    const errs: FormErrors = {}
    if (!name.trim()) errs.name = 'Client name is required.'
    if (!email.trim()) errs.contact_email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.contact_email = 'Enter a valid email address.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await createClient({
        name: name.trim(),
        contact_email: email.trim(),
        industry: industry.trim() || null,
      })
      addToast(`Client "${name.trim()}" created.`, 'success')
      onSuccess()
      handleClose()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create client.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setName(''); setEmail(''); setIndustry('')
    setErrors({}); setSubmitting(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Client">
      {/* Name */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Name <span style={{ color: 'var(--health-failing)' }}>*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
          placeholder="e.g. Meridian Health"
          style={inputStyle(!!errors.name)}
          onFocus={(e) => { if (!errors.name) e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
          onBlur={(e) => { if (!errors.name) e.currentTarget.style.borderColor = 'var(--border-default)' }}
        />
        {errors.name && <p style={errorStyle}>{errors.name}</p>}
      </div>

      {/* Email */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Contact Email <span style={{ color: 'var(--health-failing)' }}>*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, contact_email: undefined })) }}
          placeholder="contact@company.com"
          style={inputStyle(!!errors.contact_email)}
          onFocus={(e) => { if (!errors.contact_email) e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
          onBlur={(e) => { if (!errors.contact_email) e.currentTarget.style.borderColor = 'var(--border-default)' }}
        />
        {errors.contact_email && <p style={errorStyle}>{errors.contact_email}</p>}
      </div>

      {/* Industry */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>
          Industry <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
        </label>
        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. Healthcare, Fintech, Energy"
          style={inputStyle(false)}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={handleClose} style={cancelBtnStyle}>Cancel</button>
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
          {submitting ? 'Creating…' : 'Create Client'}
        </button>
      </div>
    </Modal>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 6,
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '9px 12px',
  background: 'var(--bg-tertiary)',
  border: `1px solid ${hasError ? 'var(--health-failing)' : 'var(--border-default)'}`,
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color var(--transition-fast)',
})

const errorStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 'var(--text-xs)',
  color: 'var(--health-failing)',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '9px 16px',
  background: 'transparent',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  cursor: 'pointer',
}

export default ClientForm
