import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getGraduateBySlug, getPlanForGraduateAndMonth } from '../../lib/api.js'
import LoadingPage from '../../components/LoadingPage.jsx'
import { formatMonthId } from '../../lib/months.js'
import { formatNumber } from '../../lib/format.js'

export default function AdminPlanDetail() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { monthId, graduateSlug } = useParams()

  const [state, setState] = useState({ status: 'loading', graduate: null, plan: null, error: null })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, status: 'loading' }))
    ;(async () => {
      try {
        const graduate = await getGraduateBySlug(graduateSlug)
        if (!graduate) throw new Error(t('plans.couldNotLoadAdmin'))
        const plan = await getPlanForGraduateAndMonth(graduate.id, monthId)
        if (!cancelled) setState({ status: 'ok', graduate, plan, error: null })
      } catch (err) {
        if (!cancelled) setState(s => ({ ...s, status: 'error', error: err }))
      }
    })()
    return () => { cancelled = true }
  }, [monthId, graduateSlug])

  if (state.status === 'loading') return <LoadingPage />
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('plans.couldNotLoadAdmin')}</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  const { graduate, plan } = state
  const monthLabel = formatMonthId(monthId)
  const name = graduate.full_name || graduate.profile?.full_name || graduate.slug
  const planned = Array.isArray(plan?.planned_activities) ? plan.planned_activities : []

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <button onClick={() => nav(`/admin/plans/${monthId}`)} className="back-link">{t('plans.backToList')}</button>
        <p className="eyebrow">{t('plans.adminEyebrow')} · <bdi>{monthLabel}</bdi></p>
        <h1 className="page-title">{name}</h1>

        {!plan ? (
          <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>
            {t('plans.statusNotYet')}
          </div>
        ) : (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 18 }}>
              <span className={`badge ${plan.status === 'submitted' ? 'badge-success' : 'badge-muted'}`}>
                {plan.status === 'submitted' ? t('plans.submittedBadge') : t('plans.draftBadge')}
              </span>
              {plan.status === 'submitted' && plan.submitted_at && (
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {t('plans.submittedOn', { date: new Date(plan.submitted_at).toLocaleDateString() })}
                </span>
              )}
            </div>

            <div className="info-row" style={{ marginBottom: 18 }}>
              <div className="info-label">{t('plans.hoursTargetLabel')}</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                <bdi>{t('plans.hoursTargetUnit', { hours: formatNumber(plan.hours_target || 132) })}</bdi>
              </div>
            </div>

            {plan.focus_text && (
              <div className="info-row" style={{ marginBottom: 18 }}>
                <div className="info-label" style={{ marginBottom: 6 }}>{t('plans.focusLabel')}</div>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{plan.focus_text}</div>
              </div>
            )}

            {planned.length > 0 && (
              <div className="info-row">
                <div className="info-label" style={{ marginBottom: 8 }}>{t('plans.plannedActivitiesLabel')}</div>
                <div className="data-table data-table-plans" style={{ marginTop: 4 }}>
                  <div className="table-header">
                    <span>{t('plans.rowSubject')}</span>
                    <span>{t('plans.rowLocation')}</span>
                    <span>{t('plans.rowFrequency')}</span>
                  </div>
                  {planned.map((row, i) => (
                    <div className="table-row" key={i}>
                      <span>{row.subject || '—'}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{row.location || '—'}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{row.frequency || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
