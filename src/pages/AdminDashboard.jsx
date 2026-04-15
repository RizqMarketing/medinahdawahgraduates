import { useState } from 'react'
import { allGraduates } from '../data.js'

export default function AdminDashboard() {
  const [filter, setFilter] = useState('all')

  const filtered = allGraduates.filter(g => {
    if (filter === 'all') return true
    return g.status === filter
  })

  const pending = allGraduates.filter(g => g.status === 'pending')

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 40 }}>
          <p className="eyebrow">Control room · April 2026</p>
          <h1 className="page-title">Admin dashboard</h1>
          <p className="page-subtitle">The work continues, alhamdulillah. Here's where everything stands today.</p>
        </div>

        <div className="stats-grid stats-grid-4">
          <div className="stat-card">
            <div className="stat-number">19</div>
            <div className="stat-label">Active graduates</div>
          </div>
          <div className="stat-card accent-green">
            <div className="stat-number">17</div>
            <div className="stat-label">Reported today</div>
          </div>
          <div className="stat-card accent-gold">
            <div className="stat-number">2</div>
            <div className="stat-label">Pending reports</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">2,847</div>
            <div className="stat-label">Hours this month</div>
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

          <div className="data-table">
            <div className="table-header">
              <span></span>
              <span>Name</span>
              <span>Location</span>
              <span>Hours</span>
              <span style={{ textAlign: 'right' }}>Today</span>
            </div>
            {filtered.map(g => (
              <div className="table-row" key={g.name}>
                <span className={`dot ${g.status === 'reported' ? 'dot-active' : 'dot-pending'}`} />
                <span className="cell-name">{g.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{g.country}</span>
                <span className="cell-hours">{g.hours}/168</span>
                <span className="cell-status" style={{ color: g.status === 'reported' ? 'var(--success)' : 'var(--warning)' }}>
                  {g.status === 'reported' ? '✓' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {pending.length > 0 && (
          <section className="section">
            <div className="alert-card">
              <div className="alert-title">Pending reports — {pending.length} graduates</div>
              <ul className="alert-list">
                {pending.map(p => (
                  <li key={p.name}>{p.name} — no report submitted today</li>
                ))}
              </ul>
              <div style={{ marginTop: 18 }}>
                <button className="btn btn-secondary">Send reminder</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
