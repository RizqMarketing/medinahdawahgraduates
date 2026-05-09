import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMySponsorship, getGraduateMonthSummary } from '../lib/api.js'
import LoadingPage from '../components/LoadingPage.jsx'
import MonthPicker from '../components/MonthPicker.jsx'
import { monthIdNow, formatMonthId } from '../lib/months.js'
import { formatNumber } from '../lib/format.js'

function initialsFrom(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function SponsorMyGraduates() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { monthId } = useParams()
  const month = monthId || monthIdNow()

  const [state, setState] = useState({ status: 'loading', cards: [], error: null })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, status: 'loading' }))
    ;(async () => {
      try {
        const { sponsor } = await getMySponsorship()
        if (cancelled) return
        const active = (sponsor?.sponsorships || []).filter(s => s.status === 'active' && s.graduate)
        const cards = await Promise.all(active.map(async (s) => {
          const summary = await getGraduateMonthSummary(s.graduate.id, month).catch(() => null)
          return { sponsorship: s, graduate: s.graduate, summary }
        }))
        if (!cancelled) setState({ status: 'ok', cards, error: null })
      } catch (err) {
        if (!cancelled) setState({ status: 'error', cards: [], error: err })
      }
    })()
    return () => { cancelled = true }
  }, [month])

  if (state.status === 'loading') return <LoadingPage />
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('myGraduates.couldNotLoad')}</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  const { cards } = state
  const monthLabel = formatMonthId(month)

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav('/sponsor')} className="back-link">{t('myGraduates.backToDashboard')}</button>
        <p className="eyebrow">{t('myGraduates.eyebrow')}</p>
        <h1 className="page-title">{t('myGraduates.title')}</h1>
        <p className="page-subtitle">{t('myGraduates.subtitle', { month: monthLabel, count: cards.length })}</p>

        <div className="no-print" style={{ marginTop: 12, marginBottom: 18 }}>
          <MonthPicker
            value={month}
            onChange={(m) => nav(`/my-graduates/months/${m}`, { replace: true })}
          />
        </div>

        {cards.length === 0 ? (
          <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>
            {t('myGraduates.noActive')}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {cards.map(({ graduate: g, summary }) => {
              const target = g.target_hours_monthly || 132
              const totalHours = summary?.totalHours || 0
              const pct = Math.min(100, Math.round((totalHours / target) * 100))
              const filed = summary?.reportsCount > 0
              return (
                <article key={g.id} className="card graduate-card">
                  <div className="graduate-card-avatar">
                    {g.photo_url
                      ? <img src={g.photo_url} alt={g.full_name} />
                      : <span>{initialsFrom(g.full_name)}</span>}
                  </div>
                  <div>
                    <h3>
                      {g.graduate_number != null && (
                        <bdi className="grad-id-badge">#{g.graduate_number}</bdi>
                      )}
                      {g.full_name}
                    </h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                      {g.teaching_location || g.country}
                    </div>
                    {filed ? (
                      <>
                        <div className="progress-block" style={{ marginTop: 12 }}>
                          <div className="progress-label">
                            <span>{monthLabel}</span>
                            <span>
                              <strong><bdi>{formatNumber(Math.round(totalHours))}</bdi></strong>
                              {' / '}<bdi>{formatNumber(target)}</bdi> {t('common.hours')}
                            </span>
                          </div>
                          <div className="progress">
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                          <span><strong><bdi>{formatNumber(summary.activeDays)}</bdi></strong> {t('myGraduates.activeDays')}</span>
                          <span><strong><bdi>{formatNumber(summary.studentsReached)}</bdi></strong> {t('myGraduates.studentsReached')}</span>
                          <span><strong><bdi>{formatNumber(summary.reportsCount)}</bdi></strong> {t('myGraduates.reportsFiled')}</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>
                        {t('myGraduates.noReportsThisMonth')}
                      </div>
                    )}
                  </div>
                  <div className="graduate-card-actions">
                    <Link
                      to={`/graduate/${g.slug}/months/${month}`}
                      className="btn btn-primary"
                    >
                      {t('myGraduates.viewFullReport')}
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
