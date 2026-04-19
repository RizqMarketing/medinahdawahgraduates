import { useEffect, useState } from 'react'
import { listUnsponsoredGraduates, createSponsorship } from '../../lib/api.js'
import { useModalBackButton } from '../../lib/useModalBackButton.js'

export default function AssignGraduateModal({ sponsor, onClose, onAssigned }) {
  useModalBackButton(onClose)
  const [graduates, setGraduates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [amount, setAmount] = useState(290)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listUnsponsoredGraduates()
      .then(data => { setGraduates(data || []); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedId) return setError('Please pick a graduate')
    setError(null)
    setSubmitting(true)
    try {
      await createSponsorship({
        graduate_id: selectedId,
        sponsor_id: sponsor.id,
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

        <h2 className="modal-title">Assign graduate to {sponsor.full_name}</h2>
        <p className="modal-subtitle">
          Only graduates without an active sponsor are shown.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading graduates…</p>
        ) : graduates.length === 0 ? (
          <div className="alert-card">
            <div className="alert-title">No unsponsored graduates available</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Every active graduate already has a sponsor. Add a new graduate or end an existing sponsorship first.
            </div>
          </div>
        ) : (
          <form onSubmit={handleAssign}>
            <div className="form-row">
              <label className="info-label" htmlFor="grad_pick">Graduate</label>
              <select id="grad_pick" className="text-input" value={selectedId}
                onChange={e => setSelectedId(e.target.value)} required>
                <option value="">— Choose graduate —</option>
                {graduates.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.full_name}{g.country ? ` (${g.country})` : ''}
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
                {submitting ? 'Assigning…' : 'Assign graduate'}
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
