import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getMySponsorship, getSponsorImpactStats,
  getMonthlyHoursForGraduate, listReportsForGraduateInMonth,
  getGraduateMonthSummary, getGraduateMonthBreakdown,
} from '../lib/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import MonthPicker from '../components/MonthPicker.jsx'
import ReportHeatmap from '../components/ReportHeatmap.jsx'
import LoadingPage from '../components/LoadingPage.jsx'
import {
  monthIdNow, monthIdRange, formatMonthId, isCurrentMonth, lastMonthId,
} from '../lib/months.js'
import { formatHoursMinutes, formatNumber } from '../lib/format.js'

const MONTH_KEYS = ['january','february','march','april','may','june','july','august','september','october','november','december']

function initialsFrom(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function SponsorDashboard() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [state, setState] = useState({ status: 'loading', error: null })
  const [sponsor, setSponsor] = useState(null)
  const [active, setActive] = useState(null)
  const [monthlyHours, setMonthlyHours] = useState(0)
  const [impact, setImpact] = useState({ monthsSponsored: 0, totalHours: 0, reportsCount: 0, activeDays: 0, studentsReached: 0 })
  const [breakdown, setBreakdown] = useState([])
  const [reports, setReports] = useState([])
  const [month, setMonth] = useState(monthIdNow())
  const [lastMonthRecap, setLastMonthRecap] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { sponsor: s, activeSponsorship } = active
          ? { sponsor, activeSponsorship: active }
          : await getMySponsorship()
        if (cancelled) return
        if (!sponsor) setSponsor(s)
        if (!active) setActive(activeSponsorship || null)

        if (activeSponsorship?.graduate) {
          const { start, end } = monthIdRange(month)
          const [m, imp, reps, brk] = await Promise.all([
            getMonthlyHoursForGraduate(activeSponsorship.graduate.id, { start, end }),
            getSponsorImpactStats(activeSponsorship.started_on, activeSponsorship.graduate.id),
            listReportsForGraduateInMonth(activeSponsorship.graduate.id, month),
            getGraduateMonthBreakdown(activeSponsorship.graduate.id, month),
          ])
          if (cancelled) return
          setMonthlyHours(m)
          setImpact(imp)
          setReports(reps)
          setBreakdown(brk)

          if (!lastMonthRecap && isCurrentMonth(month)) {
            const now = new Date()
            if (now.getDate() <= 7) {
              try {
                const recap = await getGraduateMonthSummary(activeSponsorship.graduate.id, lastMonthId())
                if (!cancelled && recap.reportsCount > 0) setLastMonthRecap(recap)
              } catch {}
            }
          }
        }
        setState({ status: 'ok', error: null })
      } catch (err) {
        if (!cancelled) setState({ status: 'error', error: err })
      }
    })()
    return () => { cancelled = true }
  }, [month])

  if (state.status === 'loading') {
    return <LoadingPage />
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('sponsorDashboard.couldNotLoad')}</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  const firstName = (profile?.full_name || sponsor?.full_name || '').split(' ')[0] || t('sponsorDashboard.akhiFallback')
  const monthLabel = formatMonthId(month)
  const viewingCurrent = isCurrentMonth(month)

  if (!active?.graduate) {
    return (
      <div className="page">
        <div className="container">
          <p className="eyebrow">{t('sponsorDashboard.eyebrowMonth', { month: monthLabel })}</p>
          <h1 className="page-title" translate="no">{t('sponsorDashboard.assalam')}<em>{firstName}</em></h1>
          <p className="page-subtitle" style={{ marginBottom: 32 }}>
            {t('sponsorDashboard.noActiveSponsorship')}
          </p>
        </div>
      </div>
    )
  }

  const g = active.graduate
  const target = g.target_hours_monthly || 132
  const pct = Math.min(100, Math.round((monthlyHours / target) * 100))

  return (
    <div className="page">
      <div className="container">
        <div className="greeting">
          <div>
            <p className="eyebrow">{t('sponsorDashboard.eyebrowMonth', { month: monthLabel })}</p>
            <h1 className="page-title" translate="no">{t('sponsorDashboard.assalam')}<em>{firstName}</em></h1>
          </div>
        </div>

        {lastMonthRecap && (
          <div className="recap-card">
            <div className="recap-eyebrow">{t('sponsorDashboard.recapEyebrow')}</div>
            <div className="recap-title">
              {t('sponsorDashboard.recapTitle', { name: g.full_name, month: formatMonthId(lastMonthId()) })}
            </div>
            <div className="recap-stats">
              <span><strong><bdi>{formatNumber(lastMonthRecap.totalHours)}</bdi></strong> {t('common.hoursOfService')}</span>
              <span><strong><bdi>{formatNumber(lastMonthRecap.activeDays)}</bdi></strong> {t('admin.activeDaysShort')}</span>
              <span><strong><bdi>{formatNumber(lastMonthRecap.reportsCount)}</bdi></strong> {t('common.reports')}</span>
              {lastMonthRecap.studentsReached > 0 && (
                <span><strong><bdi>{formatNumber(lastMonthRecap.studentsReached)}</bdi></strong> {t('sponsorDashboard.studentsReached')}</span>
              )}
            </div>
          </div>
        )}

        <section>
          <div className="section-header">
            <h2 className="section-title">{t('sponsorDashboard.yourGraduate')}</h2>
            <span className="status"><span className="dot dot-active" />{t('sponsorDashboard.active')}</span>
          </div>

          <article className="card graduate-card">
            <div className="graduate-card-avatar">
              {g.photo_url
                ? <img src={g.photo_url} alt={g.full_name} />
                : <span>{initialsFrom(g.full_name)}</span>}
            </div>
            <div>
              <h3>{g.full_name}</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {g.university || t('sponsorDashboard.fallbackUniversity')}
              </div>
              <div className="meta-row">
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {g.teaching_location || g.country}
                </span>
                <span>{t('sponsorDashboard.studentOfKnowledge')}</span>
              </div>
              <div className="progress-block">
                <div className="progress-label">
                  <span>{viewingCurrent ? t('sponsorDashboard.thisMonth') : monthLabel}</span>
                  <span><strong><bdi>{formatNumber(monthlyHours)}</bdi></strong> / <bdi>{formatNumber(target)}</bdi> {t('common.hours')}</span>
                </div>
                <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              </div>
            </div>
            <div className="graduate-card-actions">
              <Link to={`/graduate/${g.slug}`} className="btn btn-primary">{t('sponsorDashboard.viewFullProfile')}</Link>
            </div>
          </article>
        </section>

        <section className="section">
          <div className="section-header section-header-wrap">
            <h2 className="section-title">{t('sponsorDashboard.activityCalendar')}</h2>
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <ReportHeatmap reports={reports} monthId={month} graduateSlug={g.slug} />
        </section>

        {breakdown.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">{t('sponsorDashboard.whereHoursWent')}</h2>
              <div className="section-sub">{viewingCurrent ? t('sponsorDashboard.thisMonth') : monthLabel}</div>
            </div>
            <div className="subject-breakdown">
              {(() => {
                const total = breakdown.reduce((s, b) => s + b.hours, 0)
                return breakdown.map(b => {
                  const pctNum = total > 0 ? (b.hours / total) * 100 : 0
                  return (
                    <div key={b.subjectKey} className="subject-row">
                      <div className="subject-row-head">
                        <span className="subject-row-name">{t(`subject.${b.subjectKey}`)}</span>
                        <span className="subject-row-value">{formatHoursMinutes(b.hours)}</span>
                      </div>
                      <div className="subject-row-bar">
                        <div className="subject-row-fill" style={{ width: `${Math.max(2, pctNum)}%` }} />
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </section>
        )}

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{viewingCurrent ? t('sponsorDashboard.recentReports') : t('sponsorDashboard.latestIn', { month: monthLabel })}</h2>
          </div>
          {reports.length === 0 ? (
            <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>
              {t('sponsorDashboard.noReportsYet')}
            </div>
          ) : (
            <div className="report-list">
              {reports.slice(0, 5).map(r => {
                const d = new Date(r.report_date + 'T00:00:00')
                const monthShort = t(`time.months.${MONTH_KEYS[d.getMonth()]}`).slice(0, 3)
                return (
                  <Link key={r.id} to={`/graduate/${g.slug}/reports/${r.report_date}`} className="report-row">
                    <div className="report-date">
                      <span className="day"><bdi>{formatNumber(d.getDate())}</bdi></span>
                      <span className="month">{monthShort}</span>
                    </div>
                    <div>
                      <div className="report-title">
                        {r.overall_text
                          ? r.overall_text.slice(0, 72) + (r.overall_text.length > 72 ? '…' : '')
                          : t('sponsorDashboard.dailyReport')}
                      </div>
                      <div className="report-sub">
                        {t('sponsorDashboard.reportSub', {
                          duration: formatHoursMinutes(r.total_hours),
                          count: formatNumber((r.activities || []).length),
                        })}
                      </div>
                    </div>
                  </Link>
                )
              })}
              {reports.length > 5 && (
                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  {t('sponsorDashboard.moreCount', { count: reports.length - 5 })}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="section">
          <div className="impact-card">
            <div className="impact-header">
              <p className="eyebrow" style={{ marginBottom: 6 }}>{t('sponsorDashboard.yourImpact')}</p>
              <h2 className="impact-title">{t('sponsorDashboard.impactTitle')}</h2>
            </div>
            <div className="impact-grid">
              <div className="impact-stat">
                <div className="impact-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div className="impact-number"><bdi>{formatNumber(impact.monthsSponsored)}</bdi></div>
                <div className="impact-label">{impact.monthsSponsored === 1 ? t('sponsorDashboard.monthLabel') : t('sponsorDashboard.monthsLabel')}</div>
                <div className="impact-sub">{t('sponsorDashboard.steadySupport')}</div>
              </div>

              <div className="impact-divider" aria-hidden="true" />

              <div className="impact-stat">
                <div className="impact-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div className="impact-number"><bdi>{formatNumber(Math.round(impact.totalHours))}</bdi></div>
                <div className="impact-label">{t('sponsorDashboard.hoursOfService')}</div>
                <div className="impact-sub">{t('sponsorDashboard.inPathOfAllah')}</div>
              </div>

              <div className="impact-divider" aria-hidden="true" />

              <div className="impact-stat">
                <div className="impact-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14l2 2 4-4" />
                  </svg>
                </div>
                <div className="impact-number"><bdi>{formatNumber(impact.activeDays || impact.reportsCount)}</bdi></div>
                <div className="impact-label">{t('sponsorDashboard.activeDays')}</div>
                <div className="impact-sub">{t('sponsorDashboard.yourGradsWork')}</div>
              </div>

              {impact.studentsReached > 0 && (
                <>
                  <div className="impact-divider" aria-hidden="true" />
                  <div className="impact-stat">
                    <div className="impact-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <div className="impact-number"><bdi>{formatNumber(impact.studentsReached)}</bdi></div>
                    <div className="impact-label">{t('sponsorDashboard.studentsReached')}</div>
                    <div className="impact-sub">{t('sponsorDashboard.byAllahsPermission')}</div>
                  </div>
                </>
              )}
            </div>
            <div className="impact-footer">
              <span className="arabic" translate="no">وَمَا عِندَ اللَّهِ خَيْرٌ وَأَبْقَىٰ</span>
              <span className="impact-footer-translation" translate="no">{t('sponsorDashboard.impactAyahTranslation')}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
