import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getGraduatePointsBreakdown,
  listBonusAwards,
  createBonusAward,
  deleteBonusAward,
} from '../../lib/api.js'
import { monthIdNow, monthIdRange, formatMonthId } from '../../lib/months.js'
import { useModalBackButton } from '../../lib/useModalBackButton.js'

export default function GraduateBonusCard({ graduateId }) {
  const { t } = useTranslation()
  const [monthId] = useState(monthIdNow())
  const [breakdown, setBreakdown] = useState(null)
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const { start, end } = monthIdRange(monthId)
  const monthStart = start

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const [bd, list] = await Promise.all([
        getGraduatePointsBreakdown(graduateId, { start, end }),
        listBonusAwards(graduateId, monthStart),
      ])
      setBreakdown(bd)
      setAwards(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [graduateId])

  const handleAwarded = () => {
    setShowModal(false)
    load({ silent: true })
  }

  const handleDelete = async (id) => {
    if (!confirm(t('bonus.confirmDelete'))) return
    setDeletingId(id)
    try {
      await deleteBonusAward(id)
      await load({ silent: true })
    } catch (err) {
      alert(t('bonus.deleteFailed', { message: err.message }))
    } finally {
      setDeletingId(null)
    }
  }

  const b = breakdown || {
    daily_report_points: 0,
    mandatory_video_points: 0,
    optional_video_points: 0,
    hours_bonus: 0,
    manual_bonus_total: 0,
    total_points: 0,
  }

  return (
    <section className="section">
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <h2 className="section-title" style={{ margin: 0 }}>{t('bonus.cardTitle')}</h2>
          <div className="form-hint">{formatMonthId(monthId)}</div>
        </div>

        {loading ? (
          <p className="form-hint">{t('common.loading')}</p>
        ) : (
          <>
            <div className="points-breakdown">
              <div className="points-row">
                <span>{t('bonus.dailyReport')}</span>
                <span><bdi>+{b.daily_report_points}</bdi></span>
              </div>
              <div className="points-row">
                <span>{t('bonus.mandatoryVideo')}</span>
                <span><bdi>+{b.mandatory_video_points}</bdi></span>
              </div>
              <div className="points-row">
                <span>{t('bonus.optionalVideo')}</span>
                <span><bdi>+{b.optional_video_points}</bdi></span>
              </div>
              <div className="points-row">
                <span>{t('bonus.hoursBonus')}</span>
                <span><bdi>+{b.hours_bonus}</bdi></span>
              </div>
              <div className="points-row">
                <span>{t('bonus.manualBonus')}</span>
                <span><bdi>+{b.manual_bonus_total}</bdi></span>
              </div>
              <div className="points-row points-total">
                <span>{t('bonus.total')}</span>
                <span><bdi>{b.total_points}</bdi></span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="info-label">{t('bonus.manualAwardsThisMonth')}</div>
                <button className="btn btn-secondary" onClick={() => setShowModal(true)}>
                  {t('bonus.awardButton')}
                </button>
              </div>

              {awards.length === 0 ? (
                <p className="form-hint">{t('bonus.noAwardsYet')}</p>
              ) : (
                <ul className="bonus-list">
                  {awards.map(a => (
                    <li key={a.id} className="bonus-item">
                      <div>
                        <div style={{ fontWeight: 600 }}><bdi>+{a.points}</bdi> · {a.reason}</div>
                        <div className="form-hint" style={{ marginTop: 2 }}>
                          {new Date(a.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        className="file-clear"
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
                      >
                        {deletingId === a.id ? t('common.removing') : t('common.remove')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <AwardBonusModal
          graduateId={graduateId}
          monthStart={monthStart}
          onClose={() => setShowModal(false)}
          onAwarded={handleAwarded}
        />
      )}
    </section>
  )
}

function AwardBonusModal({ graduateId, monthStart, onClose, onAwarded }) {
  const { t } = useTranslation()
  useModalBackButton(onClose)
  const [points, setPoints] = useState('1')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    const p = parseInt(points, 10)
    if (!Number.isFinite(p) || p <= 0) {
      setError(t('bonus.errorPointsPositive'))
      return
    }
    if (!reason.trim()) {
      setError(t('bonus.errorReasonRequired'))
      return
    }
    setSubmitting(true)
    try {
      await createBonusAward({
        graduate_id: graduateId,
        points: p,
        reason: reason.trim(),
        month_start: monthStart,
      })
      onAwarded?.()
    } catch (err) {
      setError(err?.message || t('bonus.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>×</button>
        <h2 className="modal-title">{t('bonus.modalTitle')}</h2>
        <p className="modal-subtitle">{t('bonus.modalSubtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="info-label" htmlFor="bonus_points">{t('bonus.pointsLabel')}</label>
            <input
              id="bonus_points"
              type="number"
              min="1"
              step="1"
              className="text-input"
              value={points}
              onChange={e => setPoints(e.target.value)}
              required
              autoFocus
              dir="ltr"
              style={{ maxWidth: 120 }}
            />
          </div>

          <div className="form-row">
            <label className="info-label" htmlFor="bonus_reason">{t('bonus.reasonLabel')}</label>
            <textarea
              id="bonus_reason"
              className="text-input"
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              rows={3}
              placeholder={t('bonus.reasonPlaceholder')}
            />
            <div className="form-hint" style={{ marginTop: 4 }}>{t('bonus.reasonHint')}</div>
          </div>

          {error && (
            <div className="alert-card" style={{ marginBottom: 16 }}>
              <div className="alert-title">{error}</div>
            </div>
          )}

          <div className="action-row" style={{ marginTop: 4 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t('bonus.awarding') : t('bonus.awardSubmit')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
