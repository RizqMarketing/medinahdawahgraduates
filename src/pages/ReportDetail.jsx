import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getReportBySlugAndDate } from '../lib/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import ReportMediaItem from '../components/ReportMediaItem.jsx'
import LoadingPage from '../components/LoadingPage.jsx'
import { categoryLabel, COUNTED_CATEGORIES } from '../lib/categories.js'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function formatHuman(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate + 'T00:00:00')
  return `${WEEKDAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function initialsFrom(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

export default function ReportDetail() {
  const { slug, date } = useParams()
  const nav = useNavigate()
  const { role, user } = useAuth()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    getReportBySlugAndDate(slug, date)
      .then(data => setState({ status: 'ok', data, error: null }))
      .catch(error => setState({ status: 'error', data: null, error }))
  }, [slug, date])

  if (state.status === 'loading') {
    return <LoadingPage />
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">Could not load report</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  const r = state.data
  const activities = (r.activities || []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const totalHours = activities.reduce((s, a) => s + Number(a.hours || 0), 0)
  const countedHours = activities.reduce(
    (s, a) => s + (COUNTED_CATEGORIES.has(a.category || 'teaching') ? Number(a.hours || 0) : 0),
    0,
  )
  const hasUncounted = countedHours < totalHours - 0.001
  const totalStudents = activities.reduce((s, a) => s + (a.students_count || 0), 0)
  const canEdit = role === 'graduate' && r.graduate?.profile?.id === user?.id

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav(-1)} className="back-link">← Back</button>

        {(() => {
          const d = new Date(r.report_date + 'T00:00:00')
          return (
            <div className="report-hero-v2">
              <div className="report-hero-avatar-v2">
                {r.graduate?.photo_url
                  ? <img src={r.graduate.photo_url} alt={r.graduate.full_name} />
                  : <span>{initialsFrom(r.graduate?.full_name)}</span>}
              </div>
              <div className="report-hero-text-v2">
                <div className="report-hero-weekday">
                  {WEEKDAY_NAMES[d.getDay()]}
                  <span className="report-hero-dot" aria-hidden="true" />
                  Daily report
                </div>
                <h1 className="report-hero-date-v2">
                  {MONTH_NAMES[d.getMonth()]} {d.getDate()}, {d.getFullYear()}
                </h1>
                <div className="report-hero-sub-v2">
                  <span className="report-hero-name">{r.graduate?.full_name}</span>
                  {r.graduate?.country && <span className="report-hero-divider">·</span>}
                  {r.graduate?.country && <span>{r.graduate.country}</span>}
                </div>
              </div>
              {canEdit && (
                <Link to={`/graduate/${r.graduate.slug}/reports/${r.report_date}/edit`} className="btn btn-secondary report-hero-edit">
                  Edit report
                </Link>
              )}
            </div>
          )
        })()}

        <div className="report-stats-row">
          <div className="stat-chip stat-chip-accent">
            <div className="stat-chip-number">{totalHours.toFixed(2)}</div>
            <div className="stat-chip-label">Hours</div>
          </div>
          {hasUncounted && (
            <div className="stat-chip">
              <div className="stat-chip-number">{countedHours.toFixed(2)}</div>
              <div className="stat-chip-label">Counted toward 132</div>
            </div>
          )}
          <div className="stat-chip">
            <div className="stat-chip-number">{activities.length}</div>
            <div className="stat-chip-label">{activities.length === 1 ? 'Activity' : 'Activities'}</div>
          </div>
          {totalStudents > 0 && (
            <div className="stat-chip">
              <div className="stat-chip-number">{totalStudents}</div>
              <div className="stat-chip-label">Students reached</div>
            </div>
          )}
        </div>

        {activities.length > 0 && (
          <section className="section">
            <h2 className="section-title" style={{ marginBottom: 16 }}>Activities</h2>
            <div className="activities-list">
              {activities.map(a => {
                const cat = a.category || 'teaching'
                return (
                  <div key={a.id} className="activity-row">
                    <div className="activity-row-hours">
                      <div className="activity-row-hours-num">{Number(a.hours).toFixed(2)}</div>
                      <div className="activity-row-hours-unit">hrs</div>
                    </div>
                    <div className="activity-row-body">
                      <div className="activity-row-type">
                        {a.activity_type}
                        <span className={`category-badge category-${cat}`}>
                          {categoryLabel(cat)}
                          {!COUNTED_CATEGORIES.has(cat) && <span className="category-badge-flag" title="Not counted toward 132-hour standard">·not counted</span>}
                        </span>
                      </div>
                      <div className="activity-row-meta">
                        {a.start_time && a.end_time && (
                          <span><ClockIcon />{a.start_time.slice(0,5)}–{a.end_time.slice(0,5)}</span>
                        )}
                        {a.students_count != null && (
                          <span><UsersIcon />{a.students_count} students</span>
                        )}
                        {a.location && (
                          <span><PinIcon />{a.location}</span>
                        )}
                      </div>
                      {a.notes && <div className="activity-row-notes">{a.notes}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {r.overall_text && (
          <section className="section">
            <h2 className="section-title" style={{ marginBottom: 16 }}>Summary</h2>
            <blockquote className="quote-block">
              {r.overall_text.split('\n').filter(Boolean).map((p, i) => <p key={i} style={{ marginBottom: 12 }}>{p}</p>)}
              <footer style={{ marginTop: 14, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                — {r.graduate?.full_name}
              </footer>
            </blockquote>
          </section>
        )}

        {(() => {
          const media = r.media || []
          const visual = media.filter(m => m.kind === 'photo' || m.kind === 'video')
          const voices = media.filter(m => m.kind === 'voice')
          const links  = media.filter(m => m.kind === 'link')
          return (
            <>
              {visual.length > 0 && (
                <section className="section">
                  <h2 className="section-title" style={{ marginBottom: 16 }}>Photos & videos</h2>
                  <div className="media-grid">
                    {visual.map(m => <ReportMediaItem key={m.id} item={m} />)}
                  </div>
                </section>
              )}
              {voices.length > 0 && (
                <section className="section">
                  <h2 className="section-title" style={{ marginBottom: 16 }}>Voice notes</h2>
                  <div className="voice-list">
                    {voices.map(m => <ReportMediaItem key={m.id} item={m} />)}
                  </div>
                </section>
              )}
              {links.length > 0 && (
                <section className="section">
                  <h2 className="section-title" style={{ marginBottom: 16 }}>External links</h2>
                  <div className="links-grid">
                    {links.map(m => <ReportMediaItem key={m.id} item={m} />)}
                  </div>
                </section>
              )}
            </>
          )
        })()}
      </div>
    </div>
  )
}
