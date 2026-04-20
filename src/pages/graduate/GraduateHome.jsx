import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getMyGraduate,
  getMyMonthlyHours,
  listReportsForGraduate,
  listReportsForGraduateInMonth,
  getReportForToday,
} from '../../lib/api.js'
import { getDailyGreeting } from '../../lib/dailyGreeting.js'
import { formatHoursMinutes, formatNumber } from '../../lib/format.js'
import MonthPicker from '../../components/MonthPicker.jsx'
import ReportHeatmap from '../../components/ReportHeatmap.jsx'
import LoadingPage from '../../components/LoadingPage.jsx'
import {
  monthIdNow, monthIdRange, formatMonthId, isCurrentMonth, daysLeftInMonth,
} from '../../lib/months.js'

const MONTH_KEYS = ['january','february','march','april','may','june','july','august','september','october','november','december']

export default function GraduateHome() {
  const { t } = useTranslation()
  const [state, setState] = useState({ status: 'loading', error: null })
  const [graduate, setGraduate] = useState(null)
  const [hours, setHours] = useState(0)
  const [reports, setReports] = useState([])
  const [todayReport, setTodayReport] = useState(null)
  const [month, setMonth] = useState(monthIdNow())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const g = graduate || await getMyGraduate()
        if (!g) throw new Error(t('graduateHome.noGraduateRecord'))
        if (cancelled) return
        setGraduate(g)
        const { start, end } = monthIdRange(month)
        const [m, reps, todays] = await Promise.all([
          getMyMonthlyHours(g.id, { start, end }),
          listReportsForGraduateInMonth(g.id, month),
          isCurrentMonth(month) ? getReportForToday(g.id) : Promise.resolve(null),
        ])
        if (cancelled) return
        setHours(m)
        setReports(reps)
        setTodayReport(todays)
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
          <div className="alert-title">{t('graduateHome.couldNotLoad')}</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  const target = graduate.target_hours_monthly || 132
  const pct = Math.min(100, Math.round((hours / target) * 100))
  const monthLabel = formatMonthId(month)
  const viewingCurrent = isCurrentMonth(month)
  const daysLeft = daysLeftInMonth()
  const showMonthEndBanner = viewingCurrent && daysLeft <= 3 && hours < target
  const firstName = graduate.full_name?.split(' ')[0] || t('graduateHome.akhiFallback')

  return (
    <div className="page">
      <div className="container">
        <p className="eyebrow">{monthLabel}</p>
        <h1 className="page-title" translate="no">
          {t('graduateHome.assalamGreeting')}<em>{firstName}</em>
        </h1>
        <p className="page-subtitle">
          {/* Daily du'a stays in Arabic in both language modes. */}
          <span className="arabic" translate="no">{getDailyGreeting()}</span>
        </p>

        {showMonthEndBanner && (
          <div className="month-end-banner">
            {daysLeft === 0
              ? t('graduateHome.lastDayBanner', { month: monthLabel, hours: formatNumber(hours) })
              : t('graduateHome.daysLeftBanner', { count: daysLeft, month: monthLabel, hours: formatNumber(hours), target: formatNumber(target) })}
          </div>
        )}

        {viewingCurrent ? (
          <section className="section">
            <div className="card" style={{ padding: 24 }}>
            {todayReport ? (
              <>
                <div className="info-label">{t('graduateHome.todaysReport')}</div>
                <div style={{ fontSize: 16, marginTop: 4, color: 'var(--success)' }}>
                  {t('graduateHome.submittedAlhamd')}
                </div>
                <div className="action-row" style={{ marginTop: 18 }}>
                  <Link to={`/graduate/${graduate.slug}/reports/${todayReport.report_date}`} className="btn btn-primary">
                    {t('graduateHome.viewEditToday')}
                  </Link>
                  <Link to="/reports/new" className="btn btn-secondary">
                    {t('graduateHome.submitDifferentDay')}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="info-label">{t('graduateHome.todaysReport')}</div>
                <div style={{ fontSize: 16, marginTop: 4, color: 'var(--text-secondary)' }}>
                  {t('graduateHome.notYetSubmitted')}
                </div>
                <div className="action-row" style={{ marginTop: 18 }}>
                  <Link to="/reports/new" className="btn btn-primary">
                    {t('graduateHome.submitTodayBtn')}
                  </Link>
                </div>
              </>
            )}
            </div>
          </section>
        ) : null}

        <section className="section">
          <div className="section-header section-header-wrap" style={{ marginBottom: 16 }}>
            <h2 className="section-title">{viewingCurrent ? t('graduateHome.thisMonth') : monthLabel}</h2>
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div className="progress-label">
              <span>{t('graduateHome.hoursOfService')}</span>
              <span><strong><bdi>{formatNumber(hours)}</bdi></strong> / <bdi>{formatNumber(target)}</bdi></span>
            </div>
            <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            <div className="stats-grid" style={{ marginTop: 24 }}>
              <div className="stat-card">
                <div className="stat-number"><bdi>{formatNumber(reports.length)}</bdi></div>
                <div className="stat-label">{viewingCurrent ? t('graduateHome.activeDaysThisMonth') : t('graduateHome.activeDays')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-number"><bdi>{formatNumber(pct)}%</bdi></div>
                <div className="stat-label">{t('graduateHome.towardStandard')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title" style={{ marginBottom: 16 }}>{t('graduateHome.activityCalendar')}</h2>
          <ReportHeatmap reports={reports} monthId={month} graduateSlug={graduate.slug} />
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{viewingCurrent ? t('graduateHome.recentReports') : t('graduateHome.latestIn', { month: monthLabel })}</h2>
          </div>
          {reports.length === 0 ? (
            <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>
              {viewingCurrent
                ? t('graduateHome.noReportsThisMonth')
                : t('graduateHome.noReportsIn', { month: monthLabel })}
            </div>
          ) : (
            <div className="report-list">
              {reports.slice(0, 5).map(r => {
                const d = new Date(r.report_date + 'T00:00:00')
                const monthShort = t(`time.months.${MONTH_KEYS[d.getMonth()]}`).slice(0, 3)
                return (
                  <Link key={r.id} to={`/graduate/${graduate.slug}/reports/${r.report_date}`} className="report-row">
                    <div className="report-date">
                      <span className="day"><bdi>{formatNumber(d.getDate())}</bdi></span>
                      <span className="month">{monthShort}</span>
                    </div>
                    <div>
                      <div className="report-title">
                        {r.overall_text
                          ? r.overall_text.slice(0, 64) + (r.overall_text.length > 64 ? '…' : '')
                          : t('graduateHome.dailyReport')}
                      </div>
                      <div className="report-sub">
                        {r.location
                          ? t('graduateHome.reportSubWithLoc', {
                              duration: formatHoursMinutes(r.total_hours),
                              count: formatNumber((r.activities || []).length),
                              location: r.location,
                            })
                          : t('graduateHome.reportSub', {
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
                  {t('graduateHome.moreThisMonth', { count: reports.length - 5 })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
