import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listAllSponsors, createSponsorship } from '../../lib/api.js'
import { useModalBackButton } from '../../lib/useModalBackButton.js'

export default function AssignSponsorModal({ graduate, onClose, onAssigned }) {
  const { t } = useTranslation()
  useModalBackButton(onClose)
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
    if (!selectedId) return setError(t('assign.pickSponsorFirst'))
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
      setError(err?.message || t('assign.couldNotAssign'))
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>×</button>

        <h2 className="modal-title">{t('assign.assignSponsorTitle', { name: graduate.full_name })}</h2>
        <p className="modal-subtitle">{t('assign.subtitleSponsor')}</p>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>{t('assign.loadingSponsors')}</p>
        ) : sponsors.length === 0 ? (
          <div className="alert-card">
            <div className="alert-title">{t('assign.noFreeSponsorsTitle')}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              {t('assign.noFreeSponsorsBody')}
            </div>
          </div>
        ) : (
          <form onSubmit={handleAssign}>
            <div className="form-row">
              <label className="info-label" htmlFor="sponsor_pick">{t('assign.sponsorLabel')}</label>
              <select id="sponsor_pick" className="text-input" value={selectedId}
                onChange={e => setSelectedId(e.target.value)} required>
                <option value="">{t('assign.chooseSponsor')}</option>
                {sponsors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}{s.country ? ` (${s.country})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label className="info-label" htmlFor="amount">{t('assign.monthlyAmount')}</label>
              <input id="amount" type="number" min="0" step="10" className="text-input"
                value={amount} onChange={e => setAmount(e.target.value)} dir="ltr" />
              <div className="form-hint">{t('assign.monthlyHint')}</div>
            </div>

            {error && (
              <div className="alert-card" style={{ marginBottom: 16 }}>
                <div className="alert-title">{error}</div>
              </div>
            )}

            <div className="action-row" style={{ marginTop: 4 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || !selectedId}>
                {submitting ? t('assign.assigning') : t('assign.assignSponsor')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                {t('assign.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
