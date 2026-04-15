import { Link, useNavigate } from 'react-router-dom'
import { currentGraduate } from '../data.js'

export default function GraduateProfile() {
  const g = currentGraduate
  const nav = useNavigate()
  const percent = Math.round((g.hours / g.targetHours) * 100)

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav(-1)} className="back-link">← Back</button>

        <div className="profile-hero">
          <div className="avatar">{g.initials}</div>
          <div className="ornament" aria-hidden="true">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="currentColor"/></svg>
          </div>
          <h1>{g.name}</h1>
          <div className="title-line">Student of Knowledge · {g.university}</div>
          <div className="status"><span className="dot dot-active" />Active — teaching full-time</div>
        </div>

        <div className="two-col">
          <div>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Credentials</h2>
            <div className="info-grid">
              <div><div className="info-label">University</div><div className="info-value">Islamic University of Madinah</div></div>
              <div><div className="info-label">Duration</div><div className="info-value">{g.duration}</div></div>
              <div><div className="info-label">GPA</div><div className="info-value">{g.gpa}</div></div>
              <div><div className="info-label">Graduated</div><div className="info-value">{g.graduated}</div></div>
              <div><div className="info-label">Location</div><div className="info-value">{g.location}</div></div>
              <div><div className="info-label">Manhaj</div><div className="info-value">{g.manhaj}</div></div>
            </div>
          </div>

          <div>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Teaching focus</h2>
            <ul className="focus-list">
              {g.focus.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        </div>

        <section className="section">
          <h2 className="section-title" style={{ marginBottom: 16 }}>This month</h2>
          <div className="card">
            <div className="progress-label">
              <span>Hours taught</span>
              <span><strong>{g.hours}</strong> / {g.targetHours}</span>
            </div>
            <div className="progress"><div className="progress-fill" style={{ width: `${percent}%` }} /></div>

            <div className="stats-grid" style={{ marginTop: 28 }}>
              <div className="stat-card">
                <div className="stat-number">{g.reportsThisMonth}</div>
                <div className="stat-label">Reports sent</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">~{g.studentsReached}</div>
                <div className="stat-label">Students reached</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{percent}%</div>
                <div className="stat-label">Toward monthly target</div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title" style={{ marginBottom: 16 }}>His story</h2>
          <blockquote className="quote-block">
            {g.story}
            <footer style={{ marginTop: 18, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              — {g.name}, in his own words
            </footer>
          </blockquote>

          <div className="action-row">
            <Link to="/report/2026-04-14" className="btn btn-primary">View reports</Link>
            <button className="btn btn-secondary">Contact via admin</button>
          </div>
        </section>
      </div>
    </div>
  )
}
