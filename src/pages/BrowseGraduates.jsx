import { Link } from 'react-router-dom'
import { seekingSponsors } from '../data.js'
import Avatar from '../components/Avatar.jsx'

export default function BrowseGraduates() {
  return (
    <div className="page">
      <div className="container">
        <div className="browse-hero">
          <span className="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
          <div className="ornament" aria-hidden="true">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="currentColor"/></svg>
          </div>
          <h1 className="page-title">Students of <em>Knowledge</em></h1>
          <p className="page-subtitle">
            Graduates of the Islamic University of Madinah, dedicated to teaching Islam full-time.
          </p>
          <p className="stats-inline">
            <strong>19</strong> graduates supported · <strong>8</strong> awaiting sponsors
          </p>
        </div>

        <section>
          <div className="section-header">
            <h2 className="section-title">Seeking sponsors</h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>$290 / month · full-time dawah</span>
          </div>

          <div className="graduate-grid">
            {seekingSponsors.map(g => (
              <article className="g-card" key={g.name}>
                <Avatar size={60} />
                <div className="g-card-body">
                  <div className="g-card-name">{g.name}</div>
                  <div className="g-card-meta">
                    <span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-2px', marginRight: 4}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {g.country}
                    </span>
                  </div>
                  <div className="g-card-meta">{g.years} years in Madinah · GPA {g.gpa}</div>
                  <div className="g-card-footer">
                    <div className="g-card-price">$290<span> / month</span></div>
                    <Link to="/graduate/musa-mohsin" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>View profile</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="supported-note">
            Alhamdulillah, <strong>19 graduates</strong> are currently supported by sponsors and teaching full-time across <strong>8 countries</strong>.
          </div>
        </section>

        <section className="bottom-cta">
          <h3>Interested in sponsoring a student of knowledge?</h3>
          <p>We'll walk you through the next steps personally. May Allah reward your intention.</p>
          <button className="btn btn-primary">Contact us</button>
        </section>
      </div>
    </div>
  )
}
