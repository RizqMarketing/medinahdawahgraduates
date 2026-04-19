import { Link } from 'react-router-dom'
import { parseMonthId } from '../lib/months.js'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function intensityLevel(hours) {
  if (!hours || hours <= 0) return 0
  if (hours <= 2) return 1
  if (hours <= 5) return 2
  if (hours <= 8) return 3
  return 4
}

export default function ReportHeatmap({ reports = [], monthId, graduateSlug }) {
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

  return (
    <div className="heatmap">
      <div className="heatmap-stats">
        <span><strong>{totalActive}</strong> active day{totalActive === 1 ? '' : 's'}</span>
        <span>of {daysInMonth}</span>
      </div>

      <div className="heatmap-grid-header">
        {WEEKDAY_LABELS.map((w, i) => <div key={i}>{w}</div>)}
      </div>

      <div className="heatmap-grid">
        {cells.map(cell => {
          if (cell.kind === 'pad') {
            return <div key={cell.key} className="heatmap-cell heatmap-cell-pad" />
          }
          const level = intensityLevel(cell.hours)
          const title = cell.hours > 0
            ? `${cell.date} · ${cell.hours.toFixed(1)} hours`
            : `${cell.date} · no report`

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
        <span>Less</span>
        <div className="heatmap-legend-scale">
          <div className="heatmap-cell heatmap-cell-level-0" />
          <div className="heatmap-cell heatmap-cell-level-1" />
          <div className="heatmap-cell heatmap-cell-level-2" />
          <div className="heatmap-cell heatmap-cell-level-3" />
          <div className="heatmap-cell heatmap-cell-level-4" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
