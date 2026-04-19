import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getGraduateBySlug, getMonthlyHoursForGraduate,
  listReportsForGraduate,
} from '../lib/api.js'
import { formatHoursMinutes } from '../lib/format.js'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function initialsFrom(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function GraduateProfile() {
  const { slug } = useParams()
  const nav = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [monthlyHours, setMonthlyHours] = useState(0)
  const [reports, setReports] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const g = await getGraduateBySlug(slug)
        if (cancelled) return
        const [m, reps] = await Promise.all([
          getMonthlyHoursForGraduate(g.id),
          listReportsForGraduate(g.id, { limit: 10 }),
        ])
        if (cancelled) return
        setMonthlyHours(m)
        setReports(reps)
        setState({ status: 'ok', data: g, error: null })
      } catch (err) {
        if (!cancelled) setState({ status: 'error', data: null, error: err })
      }
    })()
    return () => { cancelled = true }
  }, [slug])

  if (state.status === 'loading') {
    return <div className="page"><div className="container"><p className="page-subtitle">Loading…</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">Could not load graduate</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  const g = state.data
  const target = g.target_hours_monthly || 132
  const pct = Math.min(100, Math.round((monthlyHours / target) * 100))
  const gradDate = g.graduation_year
    ? `${g.graduation_month ? MONTH_NAMES[g.graduation_month - 1] + ' ' : ''}${g.graduation_year}`
    : null

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav(-1)} className="back-link">← Back</button>

        <div className="profile-hero">
          <div className="graduate-card-avatar" style={{ width: 116, height: 116, fontSize: 32 }}>
            {g.photo_url
              ? <img src={g.photo_url} alt={g.full_name} />
              : <span>{initialsFrom(g.full_name)}</span>}
          </div>
          <div className="ornament" aria-hidden="true">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="currentColor"/></svg>
          </div>
          <h1>{g.full_name}</h1>
          <div className="title-line">Student of Knowledge · {g.university || 'Islamic University of Madinah'}</div>
          <div className="status">
            <span className={`dot ${g.status === 'active' ? 'dot-active' : 'dot-pending'}`} />
            {g.status === 'active' ? 'Active — teaching full-time'
              : g.status === 'seeking' ? 'Seeking sponsor'
              : g.status === 'paused' ? 'Paused'
              : 'Alumni'}
          </div>
        </div>

        <div className="two-col">
          <div>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Credentials</h2>
            <div className="info-grid">
              <div>
                <div className="info-label">University</div>
                <div className="info-value">{g.university || 'Islamic University of Madinah'}</div>
              </div>
              {g.duration_years && (
                <div>
                  <div className="info-label">Duration</div>
                  <div className="info-value">{g.duration_years} years</div>
                </div>
              )}
              {g.gpa && (
                <div>
                  <div className="info-label">GPA</div>
                  <div className="info-value">{g.gpa}</div>
                </div>
              )}
              {gradDate && (
                <div>
                  <div className="info-label">Graduated</div>
                  <div className="info-value">{gradDate}</div>
                </div>
              )}
              <div>
                <div className="info-label">Country</div>
                <div className="info-value">{g.country}</div>
              </div>
              {g.teaching_location && (
                <div>
                  <div className="info-label">Teaching at</div>
                  <div className="info-value">{g.teaching_location}</div>
                </div>
              )}
            </div>
          </div>

          {g.focus_areas?.length > 0 && (
            <div>
              <h2 className="section-title" style={{ marginBottom: 16 }}>Teaching focus</h2>
              <ul className="focus-list">
                {g.focus_areas.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>

        <section className="section">
          <h2 className="section-title" style={{ marginBottom: 16 }}>This month</h2>
          <div className="card" style={{ padding: 24 }}>
            <div className="progress-label">
              <span>Dawah hours</span>
              <span><strong>{monthlyHours}</strong> / {target}</span>
            </div>
            <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>

            <div className="stats-grid" style={{ marginTop: 28 }}>
              <div className="stat-card">
                <div className="stat-number">{reports.filter(r => {
                  const d = new Date(r.report_date + 'T00:00:00')
                  const now = new Date()
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                }).length}</div>
                <div className="stat-label">Reports this month</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{pct}%</div>
                <div className="stat-label">Toward monthly target</div>
              </div>
            </div>
          </div>
        </section>

        {g.story && (
          <section className="section">
            <h2 className="section-title" style={{ marginBottom: 16 }}>His story</h2>
            <blockquote className="quote-block">
              {g.story}
              <footer style={{ marginTop: 18, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                — {g.full_name}, in his own words
              </footer>
            </blockquote>
          </section>
        )}

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recent reports</h2>
          </div>
          {reports.length === 0 ? (
            <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>
              No reports yet.
            </div>
          ) : (
            <div className="report-list">
              {reports.map(r => {
                const d = new Date(r.report_date + 'T00:00:00')
                return (
                  <Link key={r.id} to={`/graduate/${g.slug}/reports/${r.report_date}`} className="report-row">
                    <div className="report-date">
                      <span className="day">{d.getDate()}</span>
                      <span className="month">{MONTH_NAMES[d.getMonth()].slice(0, 3)}</span>
                    </div>
                    <div>
                      <div className="report-title">
                        {r.overall_text
                          ? r.overall_text.slice(0, 72) + (r.overall_text.length > 72 ? '…' : '')
                          : 'Daily report'}
                      </div>
                      <div className="report-sub">
                        {formatHoursMinutes(r.total_hours)} · {(r.activities || []).length} activities
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
