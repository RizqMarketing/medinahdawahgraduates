import { useState } from 'react'

export default function SponsorForm({
  initial = {},
  submitLabel = 'Save sponsor',
  onSubmit,
  onCancel,
}) {
  const [fullName, setFullName] = useState(initial.full_name || '')
  const [country, setCountry] = useState(initial.country || '')
  const [phone, setPhone] = useState(initial.phone || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!fullName.trim()) return setError('Full name is required')

    setSubmitting(true)
    try {
      await onSubmit({
        full_name: fullName.trim(),
        country: country.trim() || null,
        phone: phone.trim() || null,
      })
    } catch (err) {
      setError(err?.message || 'Could not save')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert-card" style={{ marginBottom: 20 }}>
          <div className="alert-title">{error}</div>
        </div>
      )}

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div className="form-row">
          <label className="info-label" htmlFor="full_name">Full name</label>
          <input id="full_name" className="text-input" value={fullName}
            onChange={e => setFullName(e.target.value)} required autoFocus />
        </div>

        <div className="form-row-grid">
          <div className="form-row">
            <label className="info-label" htmlFor="country">Country</label>
            <input id="country" className="text-input" value={country}
              onChange={e => setCountry(e.target.value)} placeholder="Netherlands" />
          </div>
          <div className="form-row">
            <label className="info-label" htmlFor="phone">Phone (for WhatsApp)</label>
            <input id="phone" type="tel" className="text-input" value={phone}
              onChange={e => setPhone(e.target.value)} placeholder="+31..." />
          </div>
        </div>
      </div>

      <div className="action-row">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
