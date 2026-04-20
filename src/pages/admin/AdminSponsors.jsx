import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { listAllSponsors } from '../../lib/api.js'
import { formatNumber } from '../../lib/format.js'

export default function AdminSponsors() {
  const { t } = useTranslation()
  const [state, setState] = useState({ status: 'loading', data: [], error: null })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    listAllSponsors()
      .then(data => setState({ status: 'ok', data, error: null }))
      .catch(error => setState({ status: 'error', data: [], error }))
  }, [])

  const sponsors = state.data
  const normalized = (s) => (s || '').toLowerCase().trim()
  const filtered = useMemo(() => {
    const q = normalized(query)
    return sponsors.filter(s => {
      const isActive = (s.sponsorships || []).some(sp => sp.status === 'active')
      if (filter === 'active' && !isActive) return false
      if (filter === 'unassigned' && isActive) return false
      if (!q) return true
      const sponsoredName = normalized(
        (s.sponsorships || []).find(sp => sp.status === 'active')?.graduate?.full_name
      )
      const sponsoredCountry = normalized(
        (s.sponsorships || []).find(sp => sp.status === 'active')?.graduate?.country
      )
      return (
        normalized(s.full_name).includes(q) ||
        normalized(s.country).includes(q) ||
        normalized(s.phone).includes(q) ||
        sponsoredName.includes(q) ||
        sponsoredCountry.includes(q)
      )
    })
  }, [sponsors, query, filter])

  if (state.status === 'loading') {
    return <div className="page"><div className="container"><p className="page-subtitle">{t('sponsorsPage.loadingSponsors')}</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('sponsorsPage.couldNotLoad')}</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  const activeCount = sponsors.filter(s => (s.sponsorships || []).some(sp => sp.status === 'active')).length
  const unassignedCount = sponsors.length - activeCount
  const dash = t('common.dash')

  const filterSuffix = filter !== 'all' ? t('sponsorsPage.inFilter', { filter: t(`sponsorsPage.filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`) }) : ''

  return (
    <div className="page">
      <div className="container">
        <p className="eyebrow">{t('sponsorsPage.eyebrow')}</p>
        <h1 className="page-title">{t('sponsorsPage.title')}</h1>
        <p className="page-subtitle">
          {t('sponsorsPage.subtitleCount', {
            total: formatNumber(sponsors.length),
            active: formatNumber(activeCount),
            unassigned: formatNumber(unassignedCount),
          })}
        </p>

        <div className="action-row" style={{ marginTop: 24 }}>
          <Link to="/admin/sponsors/new" className="btn btn-primary">{t('sponsorsPage.addSponsor')}</Link>
          <Link to="/admin" className="btn btn-secondary">{t('sponsorsPage.backDashboard')}</Link>
        </div>

        {sponsors.length > 0 && (
          <>
            <div className="sponsors-toolbar">
              <div className="sponsors-search">
                <svg className="sponsors-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="search"
                  className="sponsors-search-input"
                  placeholder={t('sponsorsPage.searchPlaceholder')}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="sponsors-search-clear"
                    onClick={() => setQuery('')}
                    aria-label={t('sponsorsPage.clearSearch')}
                  >×</button>
                )}
              </div>
              <div className="filter-tabs">
                <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t('sponsorsPage.filterAll')}</button>
                <button className={`filter-tab ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>{t('sponsorsPage.filterActive')}</button>
                <button className={`filter-tab ${filter === 'unassigned' ? 'active' : ''}`} onClick={() => setFilter('unassigned')}>{t('sponsorsPage.filterUnassigned')}</button>
              </div>
            </div>
            <div className="sponsors-search-hint">
              {t('sponsorsPage.searchHint')}
            </div>
          </>
        )}

        <section className="section">
          {sponsors.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('sponsorsPage.emptyNoSponsors')}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('sponsorsPage.emptyNoMatch', { query, filterSuffix })}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                {t('sponsorsPage.showingOf', { shown: formatNumber(filtered.length), total: formatNumber(sponsors.length) })}
              </div>
              <div className="data-table">
                <div className="table-header">
                  <span></span>
                  <span>{t('sponsorsPage.tableName')}</span>
                  <span>{t('sponsorsPage.tableCountry')}</span>
                  <span>{t('sponsorsPage.tableSponsoring')}</span>
                  <span style={{ textAlign: 'end' }}></span>
                </div>
                {filtered.map(s => {
                  const active = (s.sponsorships || []).filter(sp => sp.status === 'active')
                  const sponsoredName = active[0]?.graduate?.full_name
                  return (
                    <Link key={s.id} to={`/admin/sponsors/${s.id}`} className="table-row table-row-link">
                      <span className={`dot ${active.length ? 'dot-active' : 'dot-pending'}`} />
                      <span className="cell-name">{s.full_name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.country || dash}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {sponsoredName || <em style={{ color: 'var(--text-muted)', fontStyle: 'normal' }}>{dash}</em>}
                      </span>
                      <span className="icon-flip" style={{ textAlign: 'end', color: 'var(--text-muted)', fontSize: 13 }}>›</span>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
