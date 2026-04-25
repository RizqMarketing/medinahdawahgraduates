import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listAllGraduatesForAdmin, listPlansForMonth } from '../../lib/api.js'
import { buildWaLink, buildPlanReminderText } from '../../lib/whatsapp.js'
import MonthPicker from '../../components/MonthPicker.jsx'
import LoadingPage from '../../components/LoadingPage.jsx'
import { formatNumber } from '../../lib/format.js'
import {
  formatMonthId, monthIdNext, monthIdNow, monthIdPrev, monthIdRange,
} from '../../lib/months.js'

function planStatus(plan, monthId, today) {
  if (plan?.status === 'submitted') return 'submitted'
  // Deadline = 25th of preceding month. Late from 26th onwards (or once
  // covered month has begun and still no submission).
  const prev = monthIdPrev(monthId)
  if (today >= `${prev}-26`) return 'late'
  return 'not_yet'
}

function displayName(g, dash) {
  return g.full_name || g.profile?.full_name || g.slug || dash
}

function StatusBadge({ status, t }) {
  if (status === 'submitted') {
    return <span className="badge badge-success">{t('plans.statusSubmitted')}</span>
  }
  if (status === 'late') {
    return <span className="badge badge-late">{t('plans.statusLate')}</span>
  }
  return <span className="badge badge-muted">{t('plans.statusNotYet')}</span>
}

export default function AdminPlans() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { monthId } = useParams()
  // Default to upcoming month — the admin's "what plans are due" view.
  const month = monthId || monthIdNext(monthIdNow())
  const [state, setState] = useState({ status: 'loading', graduates: [], plansByGraduateId: {}, error: null })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, status: 'loading' }))
    Promise.all([listAllGraduatesForAdmin(), listPlansForMonth(month)])
      .then(([graduates, plansByGraduateId]) => {
        if (!cancelled) setState({ status: 'ok', graduates, plansByGraduateId, error: null })
      })
      .catch(error => { if (!cancelled) setState(s => ({ ...s, status: 'error', error })) })
    return () => { cancelled = true }
  }, [month])

  // Local-date string (not UTC) — admin's "today" should match their wall clock,
  // otherwise late/on-time flips can look wrong by ±1 day depending on timezone.
  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const monthLabel = formatMonthId(month)
  const dash = t('common.dash')

  const rows = useMemo(() => {
    return (state.graduates || [])
      .filter(g => g.status === 'active')
      .map(g => {
        const plan = state.plansByGraduateId[g.id] || null
        const status = planStatus(plan, month, today)
        return { graduate: g, plan, status }
      })
      .sort((a, b) => {
        // late first, then not_yet, then submitted
        const order = { late: 0, not_yet: 1, submitted: 2 }
        const d = order[a.status] - order[b.status]
        if (d !== 0) return d
        return displayName(a.graduate, '').localeCompare(displayName(b.graduate, ''))
      })
  }, [state.graduates, state.plansByGraduateId, month, today])

  const submittedCount = rows.filter(r => r.status === 'submitted').length
  const lateCount = rows.filter(r => r.status === 'late').length
  const pendingCount = rows.filter(r => r.status === 'not_yet').length

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

  const onMonthChange = (newMonth) => {
    nav(`/admin/plans/${newMonth}`, { replace: true })
  }

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav('/admin')} className="back-link">{t('common.backToDashboard')}</button>
        <p className="eyebrow">{t('plans.adminEyebrow')}</p>
        <h1 className="page-title">{t('plans.adminTitle', { month: monthLabel })}</h1>
        <p className="page-subtitle">{t('plans.adminSubtitle', { month: monthLabel })}</p>

        <div style={{ marginBottom: 24, marginTop: 16 }}>
          <MonthPicker value={month} onChange={onMonthChange} />
        </div>

        <div className="stats-grid stats-grid-3" style={{ marginBottom: 24 }}>
          <div className="stat-card accent-green">
            <div className="stat-number"><bdi>{formatNumber(submittedCount)}</bdi></div>
            <div className="stat-label">{t('plans.statusSubmitted')}</div>
          </div>
          <div className="stat-card accent-gold">
            <div className="stat-number"><bdi>{formatNumber(pendingCount)}</bdi></div>
            <div className="stat-label">{t('plans.statusNotYet')}</div>
          </div>
          <div className="stat-card" style={{ borderColor: lateCount > 0 ? 'var(--error)' : undefined }}>
            <div className="stat-number" style={{ color: lateCount > 0 ? 'var(--error)' : undefined }}>
              <bdi>{formatNumber(lateCount)}</bdi>
            </div>
            <div className="stat-label">{t('plans.statusLate')}</div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('plans.noGraduates')}
          </div>
        ) : (
          <section className="section">
            <div className="data-table data-table-plan-list">
              <div className="table-header">
                <span>{t('plans.tableGraduate')}</span>
                <span>{t('plans.tableStatus')}</span>
                <span>{t('plans.tableTarget')}</span>
                <span>{t('plans.tableLastEdited')}</span>
                <span style={{ textAlign: 'end' }}></span>
              </div>
              {rows.map(({ graduate, plan, status }) => {
                const phone = graduate.profile?.phone
                const waLink = (status === 'late' && phone)
                  ? buildWaLink({
                      phone,
                      text: buildPlanReminderText({
                        graduateName: displayName(graduate, ''),
                        monthLabel,
                      }),
                    })
                  : null
                const lastEdited = plan?.updated_at
                  ? new Date(plan.updated_at).toLocaleDateString(undefined, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  : dash
                return (
                  <div className="table-row" key={graduate.id}>
                    <span className="cell-name">
                      <Link to={`/admin/graduates/${graduate.slug}`} style={{ color: 'inherit' }}>
                        {displayName(graduate, dash)}
                      </Link>
                    </span>
                    <span><StatusBadge status={status} t={t} /></span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}><bdi>{plan ? formatNumber(plan.hours_target || 132) : formatNumber(graduate.target_hours_monthly || 132)}</bdi></span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}><bdi>{lastEdited}</bdi></span>
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                      {plan && (
                        <Link
                          to={`/admin/plans/${month}/${graduate.slug}`}
                          className="btn btn-secondary"
                          style={{ fontSize: 13, padding: '6px 12px' }}
                        >
                          {t('plans.viewPlan')}
                        </Link>
                      )}
                      {status === 'late' && (
                        waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ fontSize: 13, padding: '6px 12px' }}
                          >
                            {t('plans.sendReminder')}
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>
                            {t('plans.noPhoneNote')}
                          </span>
                        )
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
