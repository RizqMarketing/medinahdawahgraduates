import { Link } from 'react-router-dom'
import { currentGraduate, recentReports } from '../data.js'

export default function SponsorDashboard() {
  const g = currentGraduate
  const percent = Math.round((g.hours / g.targetHours) * 100)

  return (
    <div className="page">
      <div className="container">
        <div className="greeting">
          <div>
            <p className="eyebrow">April 2026 · may Allah bless your support</p>
            <h1 className="page-title">Assalamu alaykum, <em>Abdullah</em></h1>
          </div>
        </div>

        <section>
          <div className="section-header">
            <h2 className="section-title">Your graduate</h2>
            <span className="status"><span className="dot dot-active" />Active</span>
          </div>

          <article className="card graduate-card">
            <div className="avatar">{g.initials}</div>
            <div>
              <h3>{g.name}</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{g.university}</div>
              <div className="meta-row">
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {g.location}
                </span>
                <span>Student of Knowledge</span>
              </div>
              <div className="progress-block">
                <div className="progress-label">
                  <span>This month</span>
                  <span><strong>{g.hours}</strong> / {g.targetHours} hours</span>
                </div>
                <div className="progress"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
              </div>
            </div>
            <div className="graduate-card-actions">
              <Link to={`/graduate/${g.slug}`} className="btn btn-primary">View full profile</Link>
            </div>
          </article>
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recent reports</h2>
            <Link to={`/graduate/${g.slug}`} className="btn-ghost">View all →</Link>
          </div>
          <div className="report-list">
            {recentReports.map(r => (
              <Link to={`/report/${r.slug}`} key={r.slug} className="report-row">
                <div className="report-date">
                  <span className="day">{r.day}</span>
                  <span className="month">{r.month}</span>
                </div>
                <div>
                  <div className="report-title">{r.title}</div>
                  <div className="report-sub">{r.sub}</div>
                </div>
                {r.video && (
                  <span className="video-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    Video
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Your impact</h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Alhamdulillah</span>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">4</div>
              <div className="stat-label">Months sponsored</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">587</div>
              <div className="stat-label">Hours of teaching</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">28</div>
              <div className="stat-label">Reports received</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
