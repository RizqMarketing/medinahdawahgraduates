import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getGraduateBySlug,
  getMonthlyReportData,
  getGraduateMonthBreakdown,
  getMyPlan,
  getActiveSponsorForGraduate,
} from '../lib/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import ReportMediaItem from '../components/ReportMediaItem.jsx'
import LoadingPage from '../components/LoadingPage.jsx'
import MonthPicker from '../components/MonthPicker.jsx'
import { formatHoursMinutes, formatNumber, formatTimeRange } from '../lib/format.js'
import { formatMonthId, formatDayId, formatReportPeriod } from '../lib/months.js'
import { planVsActualCoverage } from '../lib/subjects.js'
import { buildWaLink, buildReportShareText } from '../lib/whatsapp.js'

function initialsFrom(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

// Rank reports by activity strength (hours weighted heavily, students lightly),
// then take their media in order until we hit `max`.
const reportScore = r => Number(r.total_hours || 0) + Number(r.total_students || 0) * 0.05

function pickHighlights(reports, max = 6) {
  const ranked = reports
    .filter(r => (r.media || []).length > 0)
    .sort((a, b) => reportScore(b) - reportScore(a))
  const out = []
  for (const r of ranked) {
    for (const m of r.media || []) {
      out.push({ ...m, report_date: r.report_date })
      if (out.length >= max) return out
    }
  }
  return out
}

export default function MonthlyReport() {
  const { t, i18n } = useTranslation()
  const { slug, monthId } = useParams()
  const nav = useNavigate()
  const { role } = useAuth()
  const isArabic = i18n.language?.startsWith('ar')

  const [state, setState] = useState({
    status: 'loading',
    graduate: null,
    reports: [],
    breakdown: [],
    plan: null,
    sponsor: null,
    error: null,
  })
  const [copyState, setCopyState] = useState(null) // 'summary' | 'link' | null

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, status: 'loading' }))
    ;(async () => {
      try {
        const graduate = await getGraduateBySlug(slug)
        if (!graduate) throw new Error(t('monthlyReport.couldNotLoad'))
        const tasks = [
          getMonthlyReportData(graduate.id, monthId),
          getGraduateMonthBreakdown(graduate.id, monthId),
        ]
        // Plans are only readable by admin + the graduate themselves.
        // Skip the query entirely for sponsors so we don't spam errors.
        if (role === 'admin' || role === 'graduate') {
          tasks.push(getMyPlan(graduate.id, monthId).catch(() => null))
        } else {
          tasks.push(Promise.resolve(null))
        }
        // Active sponsor — admin only (powers the "Send to sponsor" button).
        if (role === 'admin') {
          tasks.push(getActiveSponsorForGraduate(graduate.id).catch(() => null))
        } else {
          tasks.push(Promise.resolve(null))
        }
        const [reports, breakdown, plan, sponsor] = await Promise.all(tasks)
        if (!cancelled) setState({ status: 'ok', graduate, reports, breakdown, plan, sponsor, error: null })
      } catch (err) {
        if (!cancelled) setState(s => ({ ...s, status: 'error', error: err }))
      }
    })()
    return () => { cancelled = true }
  }, [slug, monthId, role])

  // Hooks must run on every render — keep useMemo above the early returns.
  const highlights = useMemo(
    () => pickHighlights(state.reports || [], 6),
    [state.reports],
  )

  if (state.status === 'loading') return <LoadingPage />
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('monthlyReport.couldNotLoad')}</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  const { graduate, reports, breakdown, plan, sponsor } = state
  const monthLabel = formatMonthId(monthId)

  // Aggregate stats
  const totalHours = reports.reduce((s, r) => s + Number(r.total_hours || 0), 0)
  const activeDays = new Set(reports.map(r => r.report_date)).size
  const studentsReached = reports.reduce((s, r) => s + Number(r.total_students || 0), 0)
  const reportsCount = reports.length
  const target = graduate.target_hours_monthly || 132
  const targetMet = totalHours >= target
  const hoursShort = Math.max(0, Math.round(target - totalHours))

  const breakdownTotal = breakdown.reduce((s, b) => s + b.hours, 0)

  const showPlanBlock = (role === 'admin' || role === 'graduate')
  const planExists = !!plan
  const planned = Array.isArray(plan?.planned_activities) ? plan.planned_activities : []

  const summaryText = t('monthlyReport.summaryTemplate', {
    name: graduate.full_name,
    month: monthLabel,
    hours: formatNumber(Math.round(totalHours)),
    target: formatNumber(target),
    activeDays: formatNumber(activeDays),
    studentsReached: formatNumber(studentsReached),
    reports: formatNumber(reportsCount),
  })

  const copy = async (kind, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyState(kind)
      setTimeout(() => setCopyState(null), 2000)
    } catch {
      // Fallback: select-all via prompt
      window.prompt(t('monthlyReport.copySummary'), text)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav(-1)} className="back-link">{t('monthlyReport.backToProfile')}</button>

        {/* Print-only branded header bar (hidden on screen, shows in PDF/print).
            Mirrors the founder's existing PDF cover identity. */}
        <div className="print-only print-header-bar" aria-hidden="true">
          <img src="/logo.jpg" alt="" className="print-logo" />
          <div>
            <div className="print-wordmark">{t('monthlyReport.printWordmark')}</div>
            <div className="print-subline">{t('monthlyReport.printSubline')}</div>
          </div>
        </div>

        <p className="eyebrow">{t('monthlyReport.eyebrow')}</p>
        <h1 className="page-title">{t('monthlyReport.title', { name: graduate.full_name })}</h1>
        <p className="page-subtitle">
          {t('monthlyReport.subtitle', { month: monthLabel })}
          {reports.length > 0 && (
            <>
              {' · '}
              <span style={{ color: 'var(--text-muted)' }}>
                {t('monthlyReport.periodCovered')}: <bdi>{formatReportPeriod(reports, monthId)}</bdi>
              </span>
            </>
          )}
        </p>

        <div className="no-print" style={{ marginTop: 12, marginBottom: 4 }}>
          <MonthPicker
            value={monthId}
            onChange={(m) => nav(`/graduate/${graduate.slug}/months/${m}`, { replace: true })}
          />
        </div>

        {/* Hero card */}
        <article className="card graduate-card" style={{ marginTop: 18 }}>
          <div className="graduate-card-avatar">
            {graduate.photo_url
              ? <img src={graduate.photo_url} alt={graduate.full_name} />
              : <span>{initialsFrom(graduate.full_name)}</span>}
          </div>
          <div>
            <h3>{graduate.full_name}</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {graduate.teaching_location || graduate.country}
            </div>
            <div className="progress-block" style={{ marginTop: 12 }}>
              <div className="progress-label">
                <span>{monthLabel}</span>
                <span>
                  <strong><bdi>{formatNumber(Math.round(totalHours))}</bdi></strong> / <bdi>{formatNumber(target)}</bdi> {t('common.hours')}
                </span>
              </div>
              <div className="progress">
                <div className="progress-fill" style={{ width: `${Math.min(100, Math.round((totalHours / target) * 100))}%` }} />
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: targetMet ? 'var(--success)' : 'var(--text-muted)' }}>
                {targetMet
                  ? t('monthlyReport.targetMet')
                  : t('monthlyReport.targetShortBy', { count: formatNumber(hoursShort), target: formatNumber(target) })}
              </div>
            </div>
          </div>
        </article>

        {/* Headline numbers */}
        <section className="section">
          <div className="stats-grid stats-grid-4">
            <div className="stat-card">
              <div className="stat-number"><bdi>{formatNumber(Math.round(totalHours))}</bdi></div>
              <div className="stat-label">{t('monthlyReport.statHours')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number"><bdi>{formatNumber(activeDays)}</bdi></div>
              <div className="stat-label">{t('monthlyReport.statActiveDays')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number"><bdi>{formatNumber(studentsReached)}</bdi></div>
              <div className="stat-label">{t('monthlyReport.statStudents')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-number"><bdi>{formatNumber(reportsCount)}</bdi></div>
              <div className="stat-label">{t('monthlyReport.statReports')}</div>
            </div>
          </div>
        </section>

        {/* Activity breakdown */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{t('monthlyReport.activityBreakdownTitle')}</h2>
          </div>
          {breakdown.length === 0 ? (
            <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>
              {t('monthlyReport.activityBreakdownEmpty')}
            </div>
          ) : (
            <div className="subject-breakdown">
              {breakdown.map(b => {
                const pctNum = breakdownTotal > 0 ? (b.hours / breakdownTotal) * 100 : 0
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
              })}
            </div>
          )}
        </section>

        {/* Plan vs actual — admin & graduate only */}
        {showPlanBlock && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">{t('monthlyReport.planVsActualTitle')}</h2>
              {role === 'admin' && (
                <div className="section-sub">{t('monthlyReport.planVsActualAdminOnly')}</div>
              )}
            </div>
            <div className="card" style={{ padding: 24 }}>
              {!planExists ? (
                <div style={{ color: 'var(--text-muted)' }}>{t('monthlyReport.noPlanFiled')}</div>
              ) : (() => {
                const plannedHours = plan.hours_target || target
                const actualRounded = Math.round(totalHours)
                const delta = actualRounded - plannedHours
                const deltaText = delta === 0
                  ? t('monthlyReport.deltaOnTarget')
                  : delta > 0
                    ? t('monthlyReport.deltaPositive', { value: formatNumber(delta) })
                    : t('monthlyReport.deltaNegative', { value: formatNumber(delta) })
                const deltaColor = delta === 0 ? 'var(--text-muted)'
                  : delta > 0 ? 'var(--success)'
                  : 'var(--error)'
                const coverage = planVsActualCoverage(planned, reports)
                return (
                  <>
                    <div className="stats-grid" style={{ marginBottom: 22 }}>
                      <div className="stat-card">
                        <div className="stat-number"><bdi>{formatNumber(plannedHours)}</bdi></div>
                        <div className="stat-label">{t('monthlyReport.plannedTarget')}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-number"><bdi>{formatNumber(actualRounded)}</bdi></div>
                        <div className="stat-label">{t('monthlyReport.actualHours')}</div>
                        <div style={{ marginTop: 6, fontSize: 13, fontWeight: 500, color: deltaColor }}>
                          {deltaText}
                        </div>
                      </div>
                    </div>

                    {plan.focus_text && (
                      <div style={{ marginBottom: 22 }}>
                        <div className="info-label" style={{ marginBottom: 6 }}>{t('monthlyReport.plannedFocus')}</div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{plan.focus_text}</div>
                      </div>
                    )}

                    {coverage.length > 0 && (
                      <div>
                        <div className="info-label" style={{ marginBottom: 6 }}>{t('monthlyReport.coverageTitle')}</div>
                        <div className="form-hint" style={{ marginBottom: 10 }}>{t('monthlyReport.coverageHint')}</div>
                        <div className="data-table data-table-coverage">
                          <div className="table-header">
                            <span>{t('monthlyReport.colPlanned')}</span>
                            <span>{t('monthlyReport.colActual')}</span>
                            <span style={{ textAlign: 'end' }}>{t('monthlyReport.colStatus')}</span>
                          </div>
                          {coverage.map((row, i) => {
                            const badgeClass = row.status === 'delivered' ? 'badge-success'
                              : row.status === 'partial' ? 'badge-gold'
                              : 'badge-late'
                            const statusLabel = row.status === 'delivered' ? t('monthlyReport.statusDelivered')
                              : row.status === 'partial' ? t('monthlyReport.statusPartial')
                              : t('monthlyReport.statusMissed')
                            // Actual cell anchored to planned hours when present:
                            // "12 / 30 hrs · 5 days". Falls back to "X hrs · Y days"
                            // for legacy rows where hours_per_month wasn't set.
                            const daysSuffix = row.actualDays > 0
                              ? (row.actualDays === 1
                                  ? t('monthlyReport.daysOneSuffix', { days: formatNumber(row.actualDays) })
                                  : t('monthlyReport.daysSuffix', { days: formatNumber(row.actualDays) }))
                              : ''
                            const actualText = row.plannedHours > 0
                              ? t('monthlyReport.actualOfPlanned', { actual: formatNumber(row.actualHours), planned: formatNumber(row.plannedHours) })
                              : row.actualHours === 0
                                ? t('monthlyReport.actualNone')
                                : t('monthlyReport.actualHoursOnly', { hours: formatNumber(row.actualHours) })
                            const subLine = [row.location].filter(Boolean).join(' · ')
                            return (
                              <div className="table-row" key={i}>
                                <span>
                                  <div style={{ fontWeight: 500 }}>{row.subject || '—'}</div>
                                  {subLine && (
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                      {subLine}
                                    </div>
                                  )}
                                </span>
                                <span style={{ color: row.actualHours === 0 ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                                  <bdi>{actualText}</bdi>
                                  {daysSuffix && <span style={{ color: 'var(--text-muted)', marginInlineStart: 6 }}><bdi>{daysSuffix}</bdi></span>}
                                </span>
                                <span style={{ textAlign: 'end' }}>
                                  <span className={`badge ${badgeClass}`}>{statusLabel}</span>
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </section>
        )}

        {/* Detailed daily activities — matches the founder's existing PDF
            format (Day 1, Day 2, …) so sponsors get the granular log they're
            used to. Visible to all roles.
            `print-page-break-before` makes this start on a fresh page in
            print/PDF so the cover (header + identity + key metrics) sits
            clean on page 1. */}
        {reports.length > 0 && (
          <section className="section print-page-break-before">
            <div className="section-header">
              <h2 className="section-title">{t('monthlyReport.dailyActivitiesTitle')}</h2>
              <div className="section-sub">{t('monthlyReport.dailyActivitiesSub')}</div>
            </div>
            <div className="card" style={{ padding: 24 }}>
              {[...reports].sort((a, b) => a.report_date.localeCompare(b.report_date)).map((report, dayIdx) => {
                const acts = [...(report.activities || [])].sort((a, b) => {
                  // Order by position if set, otherwise start_time, otherwise stable.
                  const pa = a.position ?? 0, pb = b.position ?? 0
                  if (pa !== pb) return pa - pb
                  if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time)
                  return 0
                })
                const dayHours = acts.reduce((s, a) => s + Number(a.hours || 0), 0)
                // Collect unique activity locations for the day, fall back to report.location.
                const dayLocations = Array.from(new Set(
                  acts.map(a => a.location).filter(Boolean)
                ))
                const headerLocation = dayLocations.length > 0
                  ? dayLocations.join(' · ')
                  : report.location || ''
                return (
                  <div key={report.id} style={{ marginBottom: dayIdx === reports.length - 1 ? 0 : 22 }}>
                    <h3 style={{
                      fontSize: 15, fontWeight: 700, color: 'var(--accent)',
                      margin: '0 0 8px', letterSpacing: 0.3,
                    }}>
                      {t('monthlyReport.dayN', { n: formatNumber(dayIdx + 1) })}
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginInlineStart: 8 }}>
                        · <bdi>{formatDayId(report.report_date)}</bdi>
                      </span>
                    </h3>
                    {headerLocation && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>
                        <strong style={{ color: 'var(--text-muted)' }}>{t('monthlyReport.locationLabel')}:</strong> {headerLocation}
                      </div>
                    )}
                    <ul style={{ margin: '0 0 6px', paddingInlineStart: 22, lineHeight: 1.7 }}>
                      {acts.map((a, i) => {
                        const range = formatTimeRange(a.start_time, a.end_time)
                        const parts = []
                        if (a.students_count > 0) parts.push(t('monthlyReport.studentsCountInline', { count: a.students_count }))
                        if (a.notes) parts.push(a.notes)
                        const paren = parts.length ? ` (${parts.join('; ')})` : ''
                        const trailing = range
                          ? `: ${range}`
                          : `: ${formatHoursMinutes(a.hours)}`
                        return (
                          <li key={a.id || i}>
                            <bdi>{a.activity_type}{paren}{trailing}</bdi>
                          </li>
                        )
                      })}
                    </ul>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      <strong style={{ color: 'var(--text-muted)' }}>{t('monthlyReport.dayTotalLabel')}:</strong>{' '}
                      <bdi>{formatHoursMinutes(dayHours)}</bdi>
                    </div>
                    {report.overall_text && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6, fontStyle: 'italic' }}>
                        “{report.overall_text}”
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Highlights */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{t('monthlyReport.highlightsTitle')}</h2>
            {highlights.length > 0 && (
              <div className="section-sub">{t('monthlyReport.highlightsHint')}</div>
            )}
          </div>
          {highlights.length === 0 ? (
            <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>
              {t('monthlyReport.highlightsEmpty')}
            </div>
          ) : (
            <div className="media-grid">
              {highlights.map(m => {
                const dateLabel = formatDayId(m.report_date)
                const captionPrefix = m.kind === 'voice' ? t('monthlyReport.voicenoteFromDate', { date: dateLabel })
                  : m.kind === 'video' ? t('monthlyReport.videoFromDate', { date: dateLabel })
                  : m.kind === 'link' ? t('monthlyReport.linkFromDate', { date: dateLabel })
                  : t('monthlyReport.photoFromDate', { date: dateLabel })
                return (
                  <ReportMediaItem
                    key={m.id}
                    item={{ ...m, caption: m.caption || captionPrefix }}
                  />
                )
              })}
            </div>
          )}
        </section>

        {/* Share actions — visible to all roles. Individual buttons gate
            themselves: "Send to sponsor" is admin-only, summary copy is
            admin/graduate (it's worded to be sent TO a sponsor). */}
        <section className="section no-print">
          <div className="section-header">
            <h2 className="section-title">{t('monthlyReport.actionsTitle')}</h2>
          </div>
          <div className="action-row">
            {role === 'admin' && sponsor?.sponsor && (() => {
                const waLink = buildWaLink({
                  phone: sponsor.sponsor.phone,
                  text: buildReportShareText({
                    sponsorName: sponsor.sponsor.full_name,
                    graduateName: graduate.full_name,
                    monthLabel,
                    url: window.location.href,
                  }),
                })
                if (!waLink) {
                  // Sponsor has no phone on file — surface a disabled hint
                  // so the admin sees why the button isn't there.
                  return (
                    <button type="button" className="btn btn-secondary" disabled title={t('monthlyReport.sponsorNoPhone')}>
                      {t('monthlyReport.sendToSponsorNoPhone')}
                    </button>
                  )
                }
                return (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    {t('monthlyReport.sendToSponsor', { name: sponsor.sponsor.full_name })}
                  </a>
                )
              })()}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => copy('summary', summaryText)}
              >
                {copyState === 'summary' ? t('monthlyReport.copySummaryDone') : t('monthlyReport.copySummary')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => copy('link', window.location.href)}
              >
                {copyState === 'link' ? t('monthlyReport.copyLinkDone') : t('monthlyReport.copyLink')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
                title={t('monthlyReport.downloadPdfHint')}
              >
                {t('monthlyReport.downloadPdf')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
              >
                {t('monthlyReport.printPage')}
              </button>
            </div>
          </section>

        {/* Footer ayah */}
        <section className="section" style={{ textAlign: 'center', marginTop: 32 }}>
          <span className="arabic" translate="no" style={{ fontSize: 22, color: 'var(--accent-gold)' }}>
            وَمَا عِندَ اللَّهِ خَيْرٌ وَأَبْقَىٰ
          </span>
          {!isArabic && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              {t('monthlyReport.footerAyahTranslation')}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
            {t('monthlyReport.footerCaption', { month: monthLabel })}
          </div>
        </section>
      </div>
    </div>
  )
}
