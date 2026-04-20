import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listUnsponsoredGraduates, createSponsorship } from '../../lib/api.js'
import { useModalBackButton } from '../../lib/useModalBackButton.js'

export default function AssignGraduateModal({ sponsor, onClose, onAssigned }) {
  const { t } = useTranslation()
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
    if (!selectedId) return setError(t('assign.pickFirst'))
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
      setError(err?.message || t('assign.couldNotAssign'))
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>×</button>

        <h2 className="modal-title">{t('assign.assignGraduateTitle', { name: sponsor.full_name })}</h2>
        <p className="modal-subtitle">{t('assign.subtitleGraduate')}</p>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>{t('assign.loadingGraduates')}</p>
        ) : graduates.length === 0 ? (
          <div className="alert-card">
            <div className="alert-title">{t('assign.noUnsponsoredTitle')}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              {t('assign.noUnsponsoredBody')}
            </div>
          </div>
        ) : (
          <form onSubmit={handleAssign}>
            <div className="form-row">
              <label className="info-label" htmlFor="grad_pick">{t('assign.graduateLabel')}</label>
              <select id="grad_pick" className="text-input" value={selectedId}
                onChange={e => setSelectedId(e.target.value)} required>
                <option value="">{t('assign.chooseGraduate')}</option>
                {graduates.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.full_name}{g.country ? ` (${g.country})` : ''}
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
                {submitting ? t('assign.assigning') : t('assign.assignGraduate')}
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
