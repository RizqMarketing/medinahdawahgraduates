import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyGraduate,
  getMyMonthlyHours,
  listReportsForGraduate,
  listReportsForGraduateInMonth,
  getReportForToday,
} from '../../lib/api.js'
import { getDailyGreeting } from '../../lib/dailyGreeting.js'
import { formatHoursMinutes } from '../../lib/format.js'
import MonthPicker from '../../components/MonthPicker.jsx'
import ReportHeatmap from '../../components/ReportHeatmap.jsx'
import LoadingPage from '../../components/LoadingPage.jsx'
import {
  monthIdNow, monthIdRange, formatMonthId, isCurrentMonth, daysLeftInMonth,
} from '../../lib/months.js'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function formatDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate + 'T00:00:00')
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`
}

export default function GraduateHome() {
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
        if (!g) throw new Error('Your graduate record could not be found. Please contact admin.')
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
          <div className="alert-title">Could not load your page</div>
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

  return (
    <div className="page">
      <div className="container">
        <p className="eyebrow">{monthLabel}</p>
        <h1 className="page-title">
          Assalamu alaykum, <em>{graduate.full_name?.split(' ')[0] || 'akhi'}</em>
        </h1>
        <p className="page-subtitle">{getDailyGreeting()}</p>

        {showMonthEndBanner && (
          <div className="month-end-banner">
            {daysLeft === 0
              ? `Last day of ${monthLabel} — you're at ${hours} hours. May Allah accept.`
              : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in ${monthLabel}. You're at ${hours} / ${target} hours.`}
          </div>
        )}

        {viewingCurrent ? (
          <section className="section">
            <div className="card" style={{ padding: 24 }}>
            {todayReport ? (
              <>
                <div className="info-label">Today's report</div>
                <div style={{ fontSize: 16, marginTop: 4, color: 'var(--success)' }}>
                  ✓ Submitted, alhamdulillah
                </div>
                <div className="action-row" style={{ marginTop: 18 }}>
                  <Link to={`/graduate/${graduate.slug}/reports/${todayReport.report_date}`} className="btn btn-primary">
                    View / edit today's report
                  </Link>
                  <Link to="/reports/new" className="btn btn-secondary">
                    Submit for a different day
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="info-label">Today's report</div>
                <div style={{ fontSize: 16, marginTop: 4, color: 'var(--text-secondary)' }}>
                  Not yet submitted. Take a moment when you're done, in sha Allah.
                </div>
                <div className="action-row" style={{ marginTop: 18 }}>
                  <Link to="/reports/new" className="btn btn-primary">
                    Submit today's report
                  </Link>
                </div>
              </>
            )}
            </div>
          </section>
        ) : null}

        <section className="section">
          <div className="section-header section-header-wrap" style={{ marginBottom: 16 }}>
            <h2 className="section-title">{viewingCurrent ? 'This month' : monthLabel}</h2>
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div className="progress-label">
              <span>Hours of service</span>
              <span><strong>{hours}</strong> / {target}</span>
            </div>
            <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            <div className="stats-grid" style={{ marginTop: 24 }}>
              <div className="stat-card">
                <div className="stat-number">{reports.length}</div>
                <div className="stat-label">{viewingCurrent ? 'Active days this month' : 'Active days'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{pct}%</div>
                <div className="stat-label">Toward monthly standard</div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title" style={{ marginBottom: 16 }}>Activity calendar</h2>
          <ReportHeatmap reports={reports} monthId={month} graduateSlug={graduate.slug} />
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{viewingCurrent ? 'Recent reports' : `Latest in ${monthLabel}`}</h2>
          </div>
          {reports.length === 0 ? (
            <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>
              {viewingCurrent
                ? 'No reports yet this month. Your first one is waiting in sha Allah.'
                : `No reports recorded in ${monthLabel}.`}
            </div>
          ) : (
            <div className="report-list">
              {reports.slice(0, 5).map(r => {
                const d = new Date(r.report_date + 'T00:00:00')
                return (
                  <Link key={r.id} to={`/graduate/${graduate.slug}/reports/${r.report_date}`} className="report-row">
                    <div className="report-date">
                      <span className="day">{d.getDate()}</span>
                      <span className="month">{MONTH_NAMES[d.getMonth()].slice(0, 3)}</span>
                    </div>
                    <div>
                      <div className="report-title">
                        {r.overall_text
                          ? r.overall_text.slice(0, 64) + (r.overall_text.length > 64 ? '…' : '')
                          : 'Daily report'}
                      </div>
                      <div className="report-sub">
                        {formatHoursMinutes(r.total_hours)} · {(r.activities || []).length} activities
                        {r.location ? ` · ${r.location}` : ''}
                      </div>
                    </div>
                  </Link>
                )
              })}
              {reports.length > 5 && (
                <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  {reports.length - 5} more {reports.length - 5 === 1 ? 'report' : 'reports'} this month — click any day on the calendar above
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
