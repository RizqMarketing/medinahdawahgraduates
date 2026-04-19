import { useEffect, useState } from 'react'
import { listAllSponsors, createSponsorship } from '../../lib/api.js'

export default function AssignSponsorModal({ graduate, onClose, onAssigned }) {
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [amount, setAmount] = useState(290)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listAllSponsors()
      .then(data => {
        const free = (data || []).filter(
          s => !(s.sponsorships || []).some(sp => sp.status === 'active')
        )
        setSponsors(free)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedId) return setError('Please pick a sponsor')
    setError(null)
    setSubmitting(true)
    try {
      await createSponsorship({
        graduate_id: graduate.id,
        sponsor_id: selectedId,
        monthly_amount_usd: Number(amount) || 290,
      })
      onAssigned?.()
      onClose()
    } catch (err) {
      setError(err?.message || 'Could not assign')
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2 className="modal-title">Assign sponsor to {graduate.full_name}</h2>
        <p className="modal-subtitle">
          Only sponsors who aren't currently sponsoring anyone are shown.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading available sponsors…</p>
        ) : sponsors.length === 0 ? (
          <div className="alert-card">
            <div className="alert-title">No free sponsors available</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Add a new sponsor or end an existing sponsorship first.
            </div>
          </div>
        ) : (
          <form onSubmit={handleAssign}>
            <div className="form-row">
              <label className="info-label" htmlFor="sponsor_pick">Sponsor</label>
              <select id="sponsor_pick" className="text-input" value={selectedId}
                onChange={e => setSelectedId(e.target.value)} required>
                <option value="">— Choose sponsor —</option>
                {sponsors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}{s.country ? ` (${s.country})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label className="info-label" htmlFor="amount">Monthly amount (USD)</label>
              <input id="amount" type="number" min="0" step="10" className="text-input"
                value={amount} onChange={e => setAmount(e.target.value)} />
              <div className="form-hint">Default is $290 per the program standard</div>
            </div>

            {error && (
              <div className="alert-card" style={{ marginBottom: 16 }}>
                <div className="alert-title">{error}</div>
              </div>
            )}

            <div className="action-row" style={{ marginTop: 4 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || !selectedId}>
                {submitting ? 'Assigning…' : 'Assign sponsor'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
