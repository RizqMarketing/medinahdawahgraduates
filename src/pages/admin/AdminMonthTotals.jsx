import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { listAllGraduatesForAdmin, getAdminRollup } from '../../lib/api.js'
import MonthPicker from '../../components/MonthPicker.jsx'
import LoadingPage from '../../components/LoadingPage.jsx'
import SilentGraduatesModal from './SilentGraduatesModal.jsx'
import LowTeachingRatioModal from './LowTeachingRatioModal.jsx'
import {
  monthIdRange, formatMonthId, monthIdNow, monthIdPrev, isCurrentMonth,
} from '../../lib/months.js'

export default function AdminMonthTotals() {
  const { monthId } = useParams()
  const nav = useNavigate()
  const month = monthId || monthIdNow()
  const [state, setState] = useState({ status: 'loading', graduates: [], rollup: {}, prevRollup: {}, error: null })
  const [showSilent, setShowSilent] = useState(false)
  const [showLowRatio, setShowLowRatio] = useState(false)

  useEffect(() => {
    let cancelled = false
    const { start } = monthIdRange(month)
    const { start: prevStart } = monthIdRange(monthIdPrev(month))
    setState(s => ({ ...s, status: 'loading' }))
    Promise.all([listAllGraduatesForAdmin(), getAdminRollup(start), getAdminRollup(prevStart)])
      .then(([graduates, rollup, prevRollup]) => {
        if (!cancelled) setState({ status: 'ok', graduates, rollup, prevRollup, error: null })
      })
      .catch(error => { if (!cancelled) setState(s => ({ ...s, status: 'error', error })) })
    return () => { cancelled = true }
  }, [month])

  const target = 132
  const LOW_RATIO_THRESHOLD = 0.5      // flag when teaching / logged < 50%
  const LOW_RATIO_MIN_HOURS = 10       // only flag if graduate actually logged ≥10 hrs

  const rows = useMemo(() => {
    return state.graduates.map(g => {
      const r = state.rollup[g.id] || {}
      const hours = Number(r.hours_this_month || 0)
      const counted = Number(r.counted_hours ?? r.hours_this_month ?? 0)
      const teaching = Number(r.teaching_hours ?? counted)
      const teachingRatio = hours > 0 ? teaching / hours : 1
      const teachingPct = Math.round(teachingRatio * 100)
      const lowTeaching = hours >= LOW_RATIO_MIN_HOURS && teachingRatio < LOW_RATIO_THRESHOLD
      return {
        ...g,
        hours,
        counted_hours: counted,
        teaching_hours: teaching,
        teachingPct,
        lowTeaching,
        active_days: Number(r.active_days || 0),
        students_reached: Number(r.students_reached || 0),
        reports_count: Number(r.reports_count || 0),
      }
    }).sort((a, b) => b.counted_hours - a.counted_hours)
  }, [state.graduates, state.rollup])

  const prevRows = useMemo(() => {
    return state.graduates.map(g => ({
      hours: Number(state.prevRollup[g.id]?.hours_this_month || 0),
    }))
  }, [state.graduates, state.prevRollup])

  const totalHours = rows.reduce((s, r) => s + r.hours, 0)
  const totalCounted = rows.reduce((s, r) => s + r.counted_hours, 0)
  const prevTotalHours = prevRows.reduce((s, r) => s + r.hours, 0)
  const deltaPct = prevTotalHours > 0 ? Math.round(((totalHours - prevTotalHours) / prevTotalHours) * 100) : null

  const hitTarget = rows.filter(r => r.counted_hours >= target).length
  const activeGraduates = rows.filter(r => r.status === 'active').length
  const silentList = rows.filter(r => r.status === 'active' && r.active_days === 0)
  const silent = silentList.length
  const lowRatioList = rows.filter(r => r.status === 'active' && r.lowTeaching)
  const lowRatio = lowRatioList.length
  const reporting = rows.filter(r => r.active_days > 0).length
  const totalStudents = rows.reduce((s, r) => s + r.students_reached, 0)
  const totalReports = rows.reduce((s, r) => s + r.reports_count, 0)
  const hitPct = activeGraduates > 0 ? Math.round((hitTarget / activeGraduates) * 100) : 0
  const avgHours = reporting > 0 ? Math.round((totalHours / reporting) * 10) / 10 : 0

  const topGraduate = rows.length > 0 && rows[0].counted_hours > 0 ? rows[0] : null

  const onMonthChange = (newMonth) => {
    nav(`/admin/months/${newMonth}`, { replace: true })
  }

  if (state.status === 'loading') return <LoadingPage message="Loading month…" />
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">Could not load</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav('/admin')} className="back-link">← Back to dashboard</button>
        <p className="eyebrow">Monthly totals</p>
        <h1 className="page-title">{formatMonthId(month)}</h1>
        <p className="page-subtitle">
          {isCurrentMonth(month) ? 'Live — updates as reports come in.' : `Historical view of ${formatMonthId(month)}.`}
        </p>

        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <MonthPicker value={month} onChange={onMonthChange} />
        </div>

        <div className="month-stats-grid">
          <div className="month-stat month-stat-primary">
            <div className="month-stat-number">{totalHours.toLocaleString()}</div>
            <div className="month-stat-label">Total dawah hours</div>
            {deltaPct !== null && (
              <div className={`month-stat-delta ${deltaPct > 0 ? 'delta-up' : deltaPct < 0 ? 'delta-down' : 'delta-same'}`}>
                {deltaPct > 0 ? '↑' : deltaPct < 0 ? '↓' : '→'}
                {' '}
                {deltaPct === 0 ? 'same as last month' : `${Math.abs(deltaPct)}% vs last month`}
              </div>
            )}
          </div>

          <div className="month-stat">
            <div className="month-stat-number">{hitTarget}<span className="month-stat-of">/{activeGraduates}</span></div>
            <div className="month-stat-label">Met 132-hour standard</div>
            <div className="month-stat-progress">
              <div className="month-stat-progress-fill" style={{ width: `${hitPct}%` }} />
            </div>
            <div className="month-stat-sub">
              {hitPct}% of active graduates
              {totalCounted < totalHours - 0.5 && (
                <> · {Math.round(totalHours - totalCounted)} hrs excluded as non-counted</>
              )}
            </div>
          </div>

          <div className="month-stat">
            <div className="month-stat-number">{totalStudents.toLocaleString()}</div>
            <div className="month-stat-label">Students reached</div>
            <div className="month-stat-sub">across all activities</div>
          </div>

          <button
            type="button"
            className={`month-stat month-stat-warning ${silent > 0 ? 'month-stat-clickable' : ''}`}
            onClick={silent > 0 ? () => setShowSilent(true) : undefined}
            disabled={silent === 0}
            style={{ textAlign: 'left', cursor: silent > 0 ? 'pointer' : 'default' }}
          >
            <div className="month-stat-number">{silent}</div>
            <div className="month-stat-label">Silent graduates</div>
            <div className="month-stat-sub">
              {silent === 0
                ? 'Everyone reported at least once'
                : <>Tap to see who{silent === 1 ? '' : ''} · {silent === 1 ? '1 graduate' : `${silent} graduates`} with no reports</>}
            </div>
          </button>

          <button
            type="button"
            className={`month-stat month-stat-warning ${lowRatio > 0 ? 'month-stat-clickable' : ''}`}
            onClick={lowRatio > 0 ? () => setShowLowRatio(true) : undefined}
            disabled={lowRatio === 0}
            style={{ textAlign: 'left', cursor: lowRatio > 0 ? 'pointer' : 'default' }}
          >
            <div className="month-stat-number">{lowRatio}</div>
            <div className="month-stat-label">Low teaching ratio</div>
            <div className="month-stat-sub">
              {lowRatio === 0
                ? 'Everyone active is mostly teaching'
                : <>Tap to review · less than 50% of logged time was teaching</>}
            </div>
          </button>

          <div className="month-stat">
            <div className="month-stat-number">{totalReports}</div>
            <div className="month-stat-label">Reports submitted</div>
            <div className="month-stat-sub">{avgHours} hrs avg per reporting graduate</div>
          </div>

          {topGraduate && (
            <div className="month-stat month-stat-accent">
              <div className="month-stat-number" style={{ fontSize: 22 }}>{topGraduate.full_name}</div>
              <div className="month-stat-label">Top by counted hours</div>
              <div className="month-stat-sub">{topGraduate.counted_hours} hours · {topGraduate.country}</div>
            </div>
          )}
        </div>

        <section className="section">
          <h2 className="section-title" style={{ marginBottom: 16 }}>Ranked by hours</h2>
          <div className="leaderboard">
            {rows.map((g, i) => {
              const rank = i + 1
              const tier = g.counted_hours >= target ? 'hit' : g.counted_hours > 0 ? 'active' : 'silent'
              const rankClass = rank === 1 ? 'leaderboard-rank-gold'
                : rank === 2 ? 'leaderboard-rank-silver'
                : rank === 3 ? 'leaderboard-rank-bronze'
                : ''
              const hasUncounted = g.hours > g.counted_hours + 0.01
              return (
                <Link key={g.id} to={`/admin/graduates/${g.slug}`} className={`leaderboard-row tier-${tier}`}>
                  <div className={`leaderboard-rank ${rankClass}`}>{rank}</div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-name">
                      {g.full_name}
                      {g.lowTeaching && (
                        <span className="teaching-ratio-warn" title={`${g.teaching_hours.toFixed(1)} teaching hrs of ${g.hours.toFixed(1)} logged`}>
                          ⚠ {g.teachingPct}% teaching
                        </span>
                      )}
                    </div>
                    <div className="leaderboard-meta">
                      {g.country}
                      <span className="leaderboard-meta-dot" aria-hidden="true" />
                      {g.active_days} active {g.active_days === 1 ? 'day' : 'days'}
                      {g.students_reached > 0 && (
                        <>
                          <span className="leaderboard-meta-dot" aria-hidden="true" />
                          {g.students_reached} students
                        </>
                      )}
                      {hasUncounted && (
                        <>
                          <span className="leaderboard-meta-dot" aria-hidden="true" />
                          {(g.hours - g.counted_hours).toFixed(1)} hrs not counted
                        </>
                      )}
                    </div>
                  </div>
                  <div className="leaderboard-hours">
                    <strong>{g.counted_hours}</strong>
                    <span>/ {target}</span>
                    <div className="leaderboard-hours-label">hours</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {showSilent && (
          <SilentGraduatesModal
            graduates={silentList}
            monthLabel={formatMonthId(month)}
            onClose={() => setShowSilent(false)}
          />
        )}

        {showLowRatio && (
          <LowTeachingRatioModal
            graduates={lowRatioList}
            monthLabel={formatMonthId(month)}
            onClose={() => setShowLowRatio(false)}
          />
        )}
      </div>
    </div>
  )
}
