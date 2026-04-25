import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listAllGraduatesForAdmin, getAdminRollup, getAdminRollupRange } from '../lib/api.js'
import MonthPicker from '../components/MonthPicker.jsx'
import DayPicker from '../components/DayPicker.jsx'
import LoadingPage from '../components/LoadingPage.jsx'
import { formatNumber } from '../lib/format.js'
import {
  monthIdNow, monthIdNext, monthIdRange, formatMonthId, isCurrentMonth,
  dayIdNow, dayIdRange, formatDayId, isToday,
} from '../lib/months.js'
import DevQuickSwitch from '../components/DevQuickSwitch.jsx'

function displayName(g, dash) {
  return g.full_name || g.profile?.full_name || g.slug || dash
}

export default function AdminDashboard() {
  const { t } = useTranslation()
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

  const reportedInPeriod = mode === 'day'
    ? rows.filter(r => r.status === 'active' && r.reports_count > 0).length
    : rows.filter(r => r.status === 'active' && r.reportedToday).length
  const pending = mode === 'day'
    ? rows.filter(r => r.status === 'active' && r.reports_count === 0)
    : rows.filter(r => r.status === 'active' && !r.reportedToday)
  const pendingCount = pending.length
  const totalHours = rows.reduce((sum, r) => sum + r.hours, 0)

  const rowReported = (r) =>
    mode === 'day' ? r.reports_count > 0 : r.reportedToday

  const normalized = (s) => (s || '').toLowerCase().trim()
  const q = normalized(query)
  const dash = t('common.dash')
  const filtered = rows.filter(r => {
    const reported = rowReported(r)
    if (mode === 'month' && !viewingCurrent) {
      if (filter === 'reported' && !(r.active_days > 0)) return false
      if (filter === 'pending'  && (r.status !== 'active' || (r.active_days || 0) > 0)) return false
    } else {
      if (filter === 'reported' && !reported) return false
      if (filter === 'pending'  && (r.status !== 'active' || reported)) return false
    }
    if (!q) return true
    return (
      normalized(displayName(r, dash)).includes(q) ||
      normalized(r.country).includes(q) ||
      normalized(r.status).includes(q)
    )
  })

  if (state.status === 'loading') {
    return <LoadingPage />
  }

  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('admin.couldNotLoadDashboard')}</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  // Stats labels adapt to current period mode
  const reportedLabel = mode === 'day'
    ? (isToday(day) ? t('admin.reportedToday') : t('admin.reportedThatDay'))
    : (viewingCurrent ? t('admin.reportedToday') : t('admin.reportedThisMonth'))
  const pendingLabel = mode === 'day'
    ? (isToday(day) ? t('admin.pendingToday') : t('admin.silentThatDay'))
    : (viewingCurrent ? t('admin.pendingReports') : t('admin.silentThisMonth'))
  const hoursLabel = mode === 'day'
    ? t('admin.hoursOnDate', { date: periodLabel.split('·').pop().trim() })
    : (viewingCurrent ? t('admin.hoursThisMonth') : t('admin.hoursInPeriod', { period: periodLabel }))

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

  const subtitle = viewingCurrent
    ? t('admin.liveSubtitle')
    : (mode === 'day'
        ? t('admin.daySnapshotSubtitle', { period: periodLabel })
        : t('admin.historicalSubtitle', { period: periodLabel }))

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 24 }}>
          <p className="eyebrow">{t('admin.controlRoom')} · <bdi>{periodLabel}</bdi></p>
          <h1 className="page-title">{t('admin.dashboardTitle')}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="filter-tabs" role="tablist" aria-label={t('nav.language') /* period mode */}>
            <button
              className={`filter-tab ${mode === 'month' ? 'active' : ''}`}
              onClick={() => setMode('month')}
              role="tab"
              aria-selected={mode === 'month'}
            >{t('time.monthMode')}</button>
            <button
              className={`filter-tab ${mode === 'day' ? 'active' : ''}`}
              onClick={() => setMode('day')}
              role="tab"
              aria-selected={mode === 'day'}
            >{t('time.dayMode')}</button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          {mode === 'month'
            ? <MonthPicker value={month} onChange={setMonth} />
            : <DayPicker value={day} onChange={setDay} />}
        </div>

        <div className="stats-grid stats-grid-4">
          <div className="stat-card">
            <div className="stat-number"><bdi>{formatNumber(activeCount)}</bdi></div>
            <div className="stat-label">{t('admin.activeGraduates')}</div>
          </div>
          <div className="stat-card accent-green">
            <div className="stat-number"><bdi>{formatNumber(reportedStat)}</bdi></div>
            <div className="stat-label">{reportedLabel}</div>
          </div>
          <div className="stat-card accent-gold">
            <div className="stat-number"><bdi>{formatNumber(pendingStat)}</bdi></div>
            <div className="stat-label">{pendingLabel}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number"><bdi>{formatNumber(totalHours)}</bdi></div>
            <div className="stat-label">{hoursLabel}</div>
          </div>
        </div>

        <section className="section">
          <div className="admin-toolbar">
            <h2 className="section-title">{t('admin.allGraduatesHeader')}</h2>
            <div className="filter-tabs">
              <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t('admin.filterAll')}</button>
              <button className={`filter-tab ${filter === 'reported' ? 'active' : ''}`} onClick={() => setFilter('reported')}>{t('admin.filterReported')}</button>
              <button className={`filter-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>{t('admin.filterPending')}</button>
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
                  placeholder={t('admin.searchGraduatesPlaceholder')}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="sponsors-search-clear"
                    onClick={() => setQuery('')}
                    aria-label={t('common.clear')}
                  >×</button>
                )}
              </div>
              <div className="sponsors-search-hint" style={{ marginBottom: 16 }}>
                {t('admin.searchHint')}
              </div>
            </>
          )}

          {filtered.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('admin.noGraduatesMatch')}
            </div>
          ) : (
            <div className="data-table data-table-graduates">
              <div className="table-header">
                <span></span>
                <span>{t('admin.tableName')}</span>
                <span>{t('admin.tableLocation')}</span>
                <span>{t('admin.tableHours')}</span>
                <span style={{ textAlign: 'end' }}>{mode === 'day' ? t('admin.tableDay') : t('admin.tableToday')}</span>
              </div>
              {filtered.map(g => {
                const reported = rowReported(g)
                // Pending/reported indicators only apply to active graduates.
                // Seeking / paused / alumni aren't expected to report, so they
                // get a neutral dash instead of a misleading hourglass.
                const isActive = g.status === 'active'
                return (
                  <Link to={`/admin/graduates/${g.slug}`} className="table-row table-row-link" key={g.id}>
                    <span className={`dot ${!isActive ? 'dot-muted' : reported ? 'dot-active' : 'dot-pending'}`} />
                    <span className="cell-name">{displayName(g, dash)}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{g.country}</span>
                    <span className="cell-hours"><bdi>{mode === 'day' ? formatNumber(g.hours) : `${formatNumber(g.hours)}/${formatNumber(g.target_hours_monthly)}`}</bdi></span>
                    <span className="cell-status" style={{
                      color: !isActive ? 'var(--text-muted)'
                        : reported ? 'var(--success)'
                        : 'var(--warning)'
                    }}>
                      {!isActive ? dash : reported ? '✓' : '⏳'}
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
              <div className="alert-title">{t('admin.pendingAlert', { count: pendingCount })}</div>
              <ul className="alert-list">
                {pending.map(p => (
                  <li key={p.id}>
                    {mode === 'day'
                      ? t('admin.noReportThatDay', { name: displayName(p, dash) })
                      : t('admin.noReportToday', { name: displayName(p, dash) })}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {import.meta.env.DEV && <DevQuickSwitch />}

        <section className="section">
          <div className="admin-toolbar">
            <h2 className="section-title">{t('admin.quickActions')}</h2>
          </div>
          <div className="action-row">
            <Link to="/admin/graduates/new" className="btn btn-primary">{t('admin.addGraduate')}</Link>
            <Link to="/admin/sponsors" className="btn btn-secondary">{t('admin.viewSponsors')}</Link>
            <Link to="/admin/sponsors/new" className="btn btn-secondary">{t('admin.addSponsor')}</Link>
            <Link to={`/admin/months/${month}`} className="btn btn-secondary">{t('admin.monthlyTotals')}</Link>
            <Link to={`/admin/plans/${monthIdNext(monthIdNow())}`} className="btn btn-secondary">{t('plans.monthlyPlans')}</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
