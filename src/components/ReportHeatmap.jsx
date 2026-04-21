import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { parseMonthId } from '../lib/months.js'
import { formatNumber } from '../lib/format.js'

// Thresholds tuned to how a full-time teaching graduate actually spends
// their day. Target is 132 hrs/month ≈ 4.4 hrs/day, so the middle of the
// scale sits around "on-pace" — light days, regular days, strong days,
// and exceptional days all get distinguishable cells.
function intensityLevel(hours) {
  if (!hours || hours <= 0) return 0
  if (hours < 2)  return 1    // light: < 2 hrs
  if (hours < 4)  return 2    // regular: 2–4 hrs (below daily pace)
  if (hours < 6)  return 3    // strong: 4–6 hrs (on / above pace)
  if (hours < 8)  return 4    // excellent: 6–8 hrs
  return 5                     // exceptional: 8+ hrs
}

export default function ReportHeatmap({ reports = [], monthId, graduateSlug }) {
  const { t } = useTranslation()
  const { year, month } = parseMonthId(monthId)
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startWeekday = firstDay.getDay()
  const todayIso = new Date().toISOString().slice(0, 10)

  const byDate = {}
  let totalActive = 0
  for (const r of reports) {
    byDate[r.report_date] = r
    if (r.total_hours > 0) totalActive++
  }

  const cells = []
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ kind: 'pad', key: `pad-start-${i}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const r = byDate[date]
    cells.push({
      kind: 'day',
      key: date,
      day: d,
      date,
      hours: r?.total_hours || 0,
      isToday: date === todayIso,
    })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ kind: 'pad', key: `pad-end-${cells.length}` })
  }

  // Weekday initials pulled from i18n — single string like "SMTWTFS" (EN)
  // or "حنثرخجس" (AR), split into 7 single-char labels.
  const weekdayInitials = t('heatmap.weekdayInitials').split('')

  return (
    <div className="heatmap">
      <div className="heatmap-stats">
        <span><strong><bdi>{formatNumber(totalActive)}</bdi></strong> {t('heatmap.activeDays', { count: totalActive })}</span>
        <span>{t('heatmap.ofDays', { count: formatNumber(daysInMonth) })}</span>
      </div>

      <div className="heatmap-grid-header">
        {weekdayInitials.map((w, i) => <div key={i}>{w}</div>)}
      </div>

      <div className="heatmap-grid">
        {cells.map(cell => {
          if (cell.kind === 'pad') {
            return <div key={cell.key} className="heatmap-cell heatmap-cell-pad" />
          }
          const level = intensityLevel(cell.hours)
          const title = cell.hours > 0
            ? t('heatmap.hoursTitle', { date: cell.date, hours: cell.hours.toFixed(1) })
            : t('heatmap.noReportTitle', { date: cell.date })

          const inner = (
            <div
              className={`heatmap-cell heatmap-cell-level-${level}${cell.isToday ? ' heatmap-cell-today' : ''}${cell.hours > 0 ? ' heatmap-cell-active' : ''}`}
              title={title}
            >
              <span className="heatmap-day">{cell.day}</span>
            </div>
          )

          if (cell.hours > 0 && graduateSlug) {
            return (
              <Link
                key={cell.key}
                to={`/graduate/${graduateSlug}/reports/${cell.date}`}
                className="heatmap-cell-link"
                aria-label={title}
              >
                {inner}
              </Link>
            )
          }
          return <div key={cell.key}>{inner}</div>
        })}
      </div>

      <div className="heatmap-legend">
        <span>{t('heatmap.lessLabel')}</span>
        <div className="heatmap-legend-scale">
          <div className="heatmap-cell heatmap-cell-level-0" />
          <div className="heatmap-cell heatmap-cell-level-1" />
          <div className="heatmap-cell heatmap-cell-level-2" />
          <div className="heatmap-cell heatmap-cell-level-3" />
          <div className="heatmap-cell heatmap-cell-level-4" />
          <div className="heatmap-cell heatmap-cell-level-5" />
        </div>
        <span>{t('heatmap.moreLabel')}</span>
      </div>
    </div>
  )
}
