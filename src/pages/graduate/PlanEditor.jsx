import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMyGraduate, getMyPlan, upsertMyPlan } from '../../lib/api.js'
import LoadingPage from '../../components/LoadingPage.jsx'
import { formatMonthId, monthIdRange, monthIdNow } from '../../lib/months.js'

const MAX_FOCUS_CHARS = 1000
const MAX_ROWS = 10

function blankRow() {
  return { subject: '', location: '', hours_per_month: '' }
}

export default function PlanEditor() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { monthId } = useParams()

  const [graduate, setGraduate] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadErr, setLoadErr] = useState(null)

  const [hoursTarget, setHoursTarget] = useState(132)
  const [focusText, setFocusText] = useState('')
  const [rows, setRows] = useState([blankRow()])
  const [savingState, setSavingState] = useState(null) // 'draft' | 'submit' | null
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState(null)

  // The plan locks once the month it covers begins.
  const monthLocked = useMemo(() => {
    if (!monthId) return false
    const { start } = monthIdRange(monthId)
    const today = new Date().toISOString().slice(0, 10)
    return start <= today
  }, [monthId])

  useEffect(() => {
    let cancelled = false
    setLoadStatus('loading')
    ;(async () => {
      try {
        const g = await getMyGraduate()
        if (!g) throw new Error(t('plans.couldNotLoad'))
        if (cancelled) return
        setGraduate(g)
        const existing = await getMyPlan(g.id, monthId)
        if (cancelled) return
        if (existing) {
          setPlan(existing)
          setHoursTarget(existing.hours_target ?? 132)
          setFocusText(existing.focus_text || '')
          const planned = Array.isArray(existing.planned_activities) ? existing.planned_activities : []
          setRows(planned.length ? planned.map(r => ({
            subject: r.subject || '',
            location: r.location || '',
            hours_per_month: r.hours_per_month != null ? String(r.hours_per_month) : '',
          })) : [blankRow()])
        } else {
          setPlan(null)
          setHoursTarget(g.target_hours_monthly || 132)
          setFocusText('')
          setRows([blankRow()])
        }
        setLoadStatus('ok')
      } catch (err) {
        if (!cancelled) {
          setLoadErr(err)
          setLoadStatus('error')
        }
      }
    })()
    return () => { cancelled = true }
  }, [monthId])

  if (loadStatus === 'loading') return <LoadingPage />
  if (loadStatus === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('plans.couldNotLoad')}</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {loadErr?.message || String(loadErr)}
          </pre>
        </div>
      </div></div>
    )
  }

  const monthLabel = formatMonthId(monthId)
  const isSubmitted = plan?.status === 'submitted'
  const readOnly = monthLocked || (isSubmitted && monthIdRange(monthId).start <= new Date().toISOString().slice(0, 10))
  // Editable until the month begins. Submitted plans can still be edited
  // before month start — graduates often refine after first submission.
  const editable = !monthLocked

  const cleanRows = (list) => list
    .map(r => ({
      subject: r.subject?.trim() || '',
      location: r.location?.trim() || '',
      hours_per_month: Math.max(0, Math.min(744, Math.round(Number(r.hours_per_month) || 0))),
    }))
    .filter(r => r.subject || r.location || r.hours_per_month > 0)

  const save = async (asStatus) => {
    if (!graduate) return
    setError(null)
    setFeedback(null)
    setSavingState(asStatus === 'submitted' ? 'submit' : 'draft')
    try {
      const saved = await upsertMyPlan({
        graduate_id: graduate.id,
        month_id: monthId,
        hours_target: Number(hoursTarget) || 132,
        focus_text: focusText.trim().slice(0, MAX_FOCUS_CHARS),
        planned_activities: cleanRows(rows),
        status: asStatus,
      })
      setPlan(saved)
      if (asStatus === 'submitted') {
        setFeedback(t('plans.submittedSuccess'))
        setTimeout(() => nav('/graduate-home'), 1200)
      } else {
        setFeedback(t('plans.draftSaved'))
      }
    } catch (err) {
      setError(err)
    } finally {
      setSavingState(null)
    }
  }

  const updateRow = (i, patch) => {
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  }
  const removeRow = (i) => {
    setRows(rs => rs.length === 1 ? [blankRow()] : rs.filter((_, idx) => idx !== i))
  }
  const addRow = () => {
    setRows(rs => rs.length >= MAX_ROWS ? rs : [...rs, blankRow()])
  }

  const titleKey = readOnly ? 'plans.viewTitle'
                : (plan ? 'plans.editTitle' : 'plans.newTitle')
  const subtitleKey = readOnly ? null
                : (plan ? 'plans.editSubtitle' : 'plans.newSubtitle')

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <button onClick={() => nav('/graduate-home')} className="back-link">{t('plans.backHome')}</button>
        <p className="eyebrow">{t('plans.eyebrow')}</p>
        <h1 className="page-title">{t(titleKey, { month: monthLabel })}</h1>
        {subtitleKey && (
          <p className="page-subtitle" style={{ marginBottom: 28 }}>
            {t(subtitleKey, { month: monthLabel })}
          </p>
        )}
        {readOnly && (
          <p className="page-subtitle" style={{ marginBottom: 24, color: 'var(--text-muted)' }}>
            {t('plans.monthLockedHint')}
          </p>
        )}

        {plan && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`badge ${isSubmitted ? 'badge-success' : 'badge-muted'}`}>
              {isSubmitted ? t('plans.submittedBadge') : t('plans.draftBadge')}
            </span>
            {isSubmitted && plan.submitted_at && (
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {t('plans.submittedOn', { date: new Date(plan.submitted_at).toLocaleDateString() })}
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="alert-card" style={{ marginBottom: 16 }}>
            <div className="alert-title">{error.message || String(error)}</div>
          </div>
        )}
        {feedback && !error && (
          <div className="alert-card" style={{ marginBottom: 16, background: 'var(--success-bg, #1f3a2a)' }}>
            <div className="alert-title">{feedback}</div>
          </div>
        )}

        <div className="card" style={{ padding: 24 }}>
          <div className="form-row">
            <label className="info-label" htmlFor="hours-target" style={{ display: 'block', marginBottom: 8 }}>{t('plans.hoursTargetLabel')}</label>
            <input
              id="hours-target"
              type="number"
              min={0}
              max={744}
              className="text-input"
              value={hoursTarget}
              onChange={e => setHoursTarget(e.target.value)}
              disabled={!editable}
              inputMode="numeric"
              dir="ltr"
              style={{ maxWidth: 160 }}
            />
            <div className="form-hint" style={{ marginTop: 6 }}>{t('plans.hoursTargetHint')}</div>
          </div>

          <div className="form-row" style={{ marginTop: 22 }}>
            <label className="info-label" htmlFor="focus-text" style={{ display: 'block', marginBottom: 8 }}>{t('plans.focusLabel')}</label>
            <textarea
              id="focus-text"
              className="text-input"
              rows={6}
              maxLength={MAX_FOCUS_CHARS}
              value={focusText}
              onChange={e => setFocusText(e.target.value)}
              disabled={!editable}
              placeholder={t('plans.focusPlaceholder')}
              style={{ resize: 'vertical', minHeight: 130 }}
            />
            <div className="form-hint" style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('plans.focusHint')}</span>
              <span style={{ color: 'var(--text-muted)' }}>{focusText.length} / {MAX_FOCUS_CHARS}</span>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: 28 }}>
            <label className="info-label" style={{ display: 'block', marginBottom: 6 }}>{t('plans.plannedActivitiesLabel')}</label>
            <div className="form-hint" style={{ marginBottom: 12 }}>{t('plans.plannedActivitiesHint')}</div>
            {(() => {
              const allocated = rows.reduce((s, r) => s + (Number(r.hours_per_month) || 0), 0)
              const targetNum = Number(hoursTarget) || 0
              if (allocated === 0) return null
              const over = allocated - targetNum
              const color = over > 0 ? 'var(--error)'
                : allocated < targetNum ? 'var(--text-muted)'
                : 'var(--success)'
              const label = over > 0
                ? t('plans.allocatedOver', { allocated, over })
                : t('plans.allocatedSummary', { allocated, target: targetNum })
              return (
                <div className="form-hint" style={{ marginBottom: 12, color }}>
                  <bdi>{label}</bdi>
                </div>
              )
            })()}

            {rows.map((r, i) => (
              <div key={i} className="plan-row-card">
                <div className="plan-row-grid">
                  <div className="form-row" style={{ marginBottom: 0 }}>
                    <label className="info-label" style={{ display: 'block', marginBottom: 6 }}>{t('plans.rowSubject')}</label>
                    <input
                      type="text"
                      className="text-input"
                      value={r.subject}
                      onChange={e => updateRow(i, { subject: e.target.value })}
                      disabled={!editable}
                      placeholder={t('plans.rowSubjectPlaceholder')}
                    />
                  </div>
                  <div className="form-row" style={{ marginBottom: 0 }}>
                    <label className="info-label" style={{ display: 'block', marginBottom: 6 }}>{t('plans.rowLocation')}</label>
                    <input
                      type="text"
                      className="text-input"
                      value={r.location}
                      onChange={e => updateRow(i, { location: e.target.value })}
                      disabled={!editable}
                      placeholder={t('plans.rowLocationPlaceholder')}
                    />
                  </div>
                  <div className="form-row" style={{ marginBottom: 0 }}>
                    <label className="info-label" style={{ display: 'block', marginBottom: 6 }}>{t('plans.rowHoursPerMonth')}</label>
                    <input
                      type="number"
                      min={0}
                      max={744}
                      className="text-input"
                      value={r.hours_per_month}
                      onChange={e => updateRow(i, { hours_per_month: e.target.value })}
                      disabled={!editable}
                      placeholder={t('plans.rowHoursPerMonthPlaceholder')}
                      inputMode="numeric"
                      dir="ltr"
                    />
                  </div>
                </div>
                {editable && (
                  <div style={{ textAlign: 'end', marginTop: 10 }}>
                    <button
                      type="button"
                      className="plan-row-remove"
                      onClick={() => removeRow(i)}
                    >{t('plans.removeRow')}</button>
                  </div>
                )}
              </div>
            ))}

            {editable && rows.length < MAX_ROWS && (
              <button type="button" className="btn btn-secondary plan-add-row" onClick={addRow}>
                {t('plans.addRow')}
              </button>
            )}
          </div>

          {editable && (
            <div className="action-row" style={{ marginTop: 28 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => save('submitted')}
                disabled={!!savingState || !focusText.trim()}
              >
                {savingState === 'submit' ? t('plans.submitting') : t('plans.submitPlan')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => save('draft')}
                disabled={!!savingState}
              >
                {savingState === 'draft' ? t('plans.saving') : t('plans.saveDraft')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
