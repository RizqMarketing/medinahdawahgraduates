import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllSponsors } from '../../lib/api.js'

export default function AdminSponsors() {
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
    return <div className="page"><div className="container"><p className="page-subtitle">Loading sponsors…</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">Could not load sponsors</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  const activeCount = sponsors.filter(s => (s.sponsorships || []).some(sp => sp.status === 'active')).length
  const unassignedCount = sponsors.length - activeCount

  return (
    <div className="page">
      <div className="container">
        <p className="eyebrow">Sponsors</p>
        <h1 className="page-title">All sponsors</h1>
        <p className="page-subtitle">
          {sponsors.length} total · {activeCount} currently sponsoring · {unassignedCount} unassigned
        </p>

        <div className="action-row" style={{ marginTop: 24 }}>
          <Link to="/admin/sponsors/new" className="btn btn-primary">Add sponsor</Link>
          <Link to="/admin" className="btn btn-secondary">← Dashboard</Link>
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
                  placeholder="Search sponsors…"
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
              <div className="filter-tabs">
                <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                <button className={`filter-tab ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Sponsoring</button>
                <button className={`filter-tab ${filter === 'unassigned' ? 'active' : ''}`} onClick={() => setFilter('unassigned')}>Unassigned</button>
              </div>
            </div>
            <div className="sponsors-search-hint">
              Searches name, country, phone, and the graduate they sponsor
            </div>
          </>
        )}

        <section className="section">
          {sponsors.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              No sponsors yet. Add your first sponsor to start.
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              No sponsors match "{query}" {filter !== 'all' ? `in ${filter}` : ''}.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Showing {filtered.length} of {sponsors.length}
              </div>
              <div className="data-table">
                <div className="table-header">
                  <span></span>
                  <span>Name</span>
                  <span>Country</span>
                  <span>Sponsoring</span>
                  <span style={{ textAlign: 'right' }}></span>
                </div>
                {filtered.map(s => {
                  const active = (s.sponsorships || []).filter(sp => sp.status === 'active')
                  const sponsoredName = active[0]?.graduate?.full_name
                  return (
                    <Link key={s.id} to={`/admin/sponsors/${s.id}`} className="table-row table-row-link">
                      <span className={`dot ${active.length ? 'dot-active' : 'dot-pending'}`} />
                      <span className="cell-name">{s.full_name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.country || '—'}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {sponsoredName || <em style={{ color: 'var(--text-muted)', fontStyle: 'normal' }}>—</em>}
                      </span>
                      <span style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 13 }}>›</span>
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
