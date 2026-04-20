import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllGraduatesForAdmin, getAdminRollup, getAdminRollupRange } from '../lib/api.js'
import MonthPicker from '../components/MonthPicker.jsx'
import DayPicker from '../components/DayPicker.jsx'
import LoadingPage from '../components/LoadingPage.jsx'
import {
  monthIdNow, monthIdRange, formatMonthId, isCurrentMonth,
  dayIdNow, dayIdRange, formatDayId, isToday,
} from '../lib/months.js'

function displayName(g) {
  return g.full_name || g.profile?.full_name || g.slug || '—'
}

export default function AdminDashboard() {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('month') // 'month' | 'day'
  const [month, setMonth] = useState(monthIdNow())
  const [day, setDay] = useState(dayIdNow())
  const [state, setState] = useState({ status: 'loading', graduates: [], rollup: {}, error: null })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, status: 'loading' }))

    const rollupPromise = mode === 'month'
      ? getAdminRollup(monthIdRange(month).start)
      : (() => { const { start, end } = dayIdRange(day); return getAdminRollupRange(start, end) })()

    Promise.all([listAllGraduatesForAdmin(), rollupPromise])
      .then(([graduates, rollup]) => {
        if (cancelled) return
        setState({ status: 'ok', graduates, rollup, error: null })
      })
      .catch(error => {
        if (cancelled) return
        setState(s => ({ ...s, status: 'error', error }))
      })
    return () => { cancelled = true }
  }, [mode, month, day])

  const periodLabel = mode === 'month' ? formatMonthId(month) : formatDayId(day)
  const viewingCurrent = mode === 'month' ? isCurrentMonth(month) : isToday(day)

  const rows = useMemo(() => {
    return state.graduates.map(g => ({
      ...g,
      hours: Number(state.rollup[g.id]?.hours_this_month || 0),
      reportedToday: !!state.rollup[g.id]?.reported_today,
      active_days: Number(state.rollup[g.id]?.active_days || 0),
      reports_count: Number(state.rollup[g.id]?.reports_count || 0),
    }))
  }, [state.graduates, state.rollup])

  const activeCount = rows.filter(r => r.status === 'active').length

  // In day mode, "reported" = has reports_count > 0 (i.e. submitted a report that day)
  const reportedInPeriod = mode === 'day'
    ? rows.filter(r => r.status === 'active' && r.reports_count > 0).length
    : rows.filter(r => r.status === 'active' && r.reportedToday).length
  const pending = mode === 'day'
    ? rows.filter(r => r.status === 'active' && r.reports_count === 0)
    : rows.filter(r => r.status === 'active' && !r.reportedToday)
  const pendingCount = pending.length
  const totalHours = rows.reduce((sum, r) => sum + r.hours, 0)

  // "Reported" flag per row for this view
  const rowReported = (r) =>
    mode === 'day' ? r.reports_count > 0 : r.reportedToday

  const normalized = (s) => (s || '').toLowerCase().trim()
  const q = normalized(query)
  const filtered = rows.filter(r => {
    const reported = rowReported(r)
    if (mode === 'month' && !viewingCurrent) {
      // historical month: "reported" means reported at least once in that month
      if (filter === 'reported' && !(r.active_days > 0)) return false
      if (filter === 'pending'  && (r.status !== 'active' || (r.active_days || 0) > 0)) return false
    } else {
      if (filter === 'reported' && !reported) return false
      if (filter === 'pending'  && (r.status !== 'active' || reported)) return false
    }
    if (!q) return true
    return (
      normalized(displayName(r)).includes(q) ||
      normalized(r.country).includes(q) ||
      normalized(r.status).includes(q)
    )
  })

  if (state.status === 'loading') {
    return <LoadingPage message="Loading dashboard…" />
  }

  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">Could not load dashboard</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  // Labels that adapt to the current period mode
  const reportedLabel = mode === 'day'
    ? (isToday(day) ? 'Reported today' : 'Reported that day')
    : (viewingCurrent ? 'Reported today' : 'Reported this month')
  const pendingLabel = mode === 'day'
    ? (isToday(day) ? 'Pending today' : 'Silent that day')
    : (viewingCurrent ? 'Pending reports' : 'Silent this month')
  const hoursLabel = mode === 'day' ? `Hours on ${periodLabel.split('·').pop().trim()}` : `Hours ${viewingCurrent ? 'this month' : 'in ' + periodLabel}`

  const reportedStat = mode === 'month' && viewingCurrent
    ? reportedInPeriod
    : (mode === 'month'
        ? rows.filter(r => r.active_days > 0).length
        : reportedInPeriod)
  const pendingStat = mode === 'month' && viewingCurrent
    ? pendingCount
    : (mode === 'month'
        ? rows.filter(r => r.status === 'active' && (r.active_days || 0) === 0).length
        : pendingCount)

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 24 }}>
          <p className="eyebrow">Control room · {periodLabel}</p>
          <h1 className="page-title">Admin dashboard</h1>
          <p className="page-subtitle">
            {viewingCurrent
              ? "The work continues, alhamdulillah. Here's where everything stands today."
              : mode === 'day'
                ? `Snapshot of ${periodLabel}.`
                : `Historical view of ${periodLabel}.`}
          </p>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="filter-tabs" role="tablist" aria-label="Period mode">
            <button
              className={`filter-tab ${mode === 'month' ? 'active' : ''}`}
              onClick={() => setMode('month')}
              role="tab"
              aria-selected={mode === 'month'}
            >Month</button>
            <button
              className={`filter-tab ${mode === 'day' ? 'active' : ''}`}
              onClick={() => setMode('day')}
              role="tab"
              aria-selected={mode === 'day'}
            >Day</button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          {mode === 'month'
            ? <MonthPicker value={month} onChange={setMonth} />
            : <DayPicker value={day} onChange={setDay} />}
        </div>

        <div className="stats-grid stats-grid-4">
          <div className="stat-card">
            <div className="stat-number">{activeCount}</div>
            <div className="stat-label">Active graduates</div>
          </div>
          <div className="stat-card accent-green">
            <div className="stat-number">{reportedStat}</div>
            <div className="stat-label">{reportedLabel}</div>
          </div>
          <div className="stat-card accent-gold">
            <div className="stat-number">{pendingStat}</div>
            <div className="stat-label">{pendingLabel}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalHours.toLocaleString()}</div>
            <div className="stat-label">{hoursLabel}</div>
          </div>
        </div>

        <section className="section">
          <div className="admin-toolbar">
            <h2 className="section-title">All graduates</h2>
            <div className="filter-tabs">
              <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`filter-tab ${filter === 'reported' ? 'active' : ''}`} onClick={() => setFilter('reported')}>Reported</button>
              <button className={`filter-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
            </div>
          </div>

          {rows.length > 3 && (
            <>
              <div className="sponsors-search" style={{ marginBottom: 10 }}>
                <svg className="sponsors-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="search"
                  className="sponsors-search-input"
                  placeholder="Search graduates…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="sponsors-search-clear"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  >×</button>
                )}
              </div>
              <div className="sponsors-search-hint" style={{ marginBottom: 16 }}>
                Searches name, country, and status
              </div>
            </>
          )}

          {filtered.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              No graduates match this filter yet.
            </div>
          ) : (
            <div className="data-table data-table-graduates">
              <div className="table-header">
                <span></span>
                <span>Name</span>
                <span>Location</span>
                <span>Hours</span>
                <span style={{ textAlign: 'right' }}>{mode === 'day' ? 'Day' : 'Today'}</span>
              </div>
              {filtered.map(g => {
                const reported = rowReported(g)
                return (
                  <Link to={`/admin/graduates/${g.slug}`} className="table-row table-row-link" key={g.id}>
                    <span className={`dot ${reported ? 'dot-active' : 'dot-pending'}`} />
                    <span className="cell-name">{displayName(g)}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{g.country}</span>
                    <span className="cell-hours">{g.hours}/{g.target_hours_monthly}</span>
                    <span className="cell-status" style={{ color: reported ? 'var(--success)' : 'var(--warning)' }}>
                      {reported ? '✓' : '⏳'}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {viewingCurrent && pendingCount > 0 && (
          <section className="section">
            <div className="alert-card">
              <div className="alert-title">Pending reports — {pendingCount} graduate{pendingCount === 1 ? '' : 's'}</div>
              <ul className="alert-list">
                {pending.map(p => (
                  <li key={p.id}>{displayName(p)} — no report submitted {mode === 'day' ? 'that day' : 'today'}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section className="section">
          <div className="admin-toolbar">
            <h2 className="section-title">Quick actions</h2>
          </div>
          <div className="action-row">
            <Link to="/admin/graduates/new" className="btn btn-primary">Add graduate</Link>
            <Link to="/admin/sponsors" className="btn btn-secondary">View sponsors</Link>
            <Link to="/admin/sponsors/new" className="btn btn-secondary">Add sponsor</Link>
            <Link to={`/admin/months/${month}`} className="btn btn-secondary">Monthly totals</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
