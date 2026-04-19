import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getGraduateBySlug, updateGraduateStatus, endSponsorship } from '../../lib/api.js'
import InviteGraduateModal from './InviteGraduateModal.jsx'
import AssignSponsorModal from './AssignSponsorModal.jsx'

const STATUS_LABELS = {
  active: 'Active — teaching',
  seeking: 'Seeking sponsor',
  paused: 'Paused',
  alumni: 'Alumni',
}

export default function AdminGraduateDetail() {
  const { slug } = useParams()
  const nav = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [showInvite, setShowInvite] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [ending, setEnding] = useState(false)

  const load = ({ silent = false } = {}) => {
    if (!silent) setState(s => ({ ...s, status: 'loading' }))
    getGraduateBySlug(slug)
      .then(data => setState(s => ({ ...s, status: 'ok', data, error: null })))
      .catch(error => setState({ status: 'error', data: null, error }))
  }

  useEffect(() => { load() }, [slug])

  const handleEndSponsorship = async (sponsorshipId) => {
    if (!confirm('End this sponsorship? The graduate will become unsponsored.')) return
    setEnding(true)
    try {
      await endSponsorship(sponsorshipId)
      load({ silent: true })
    } catch (err) {
      alert('Could not end sponsorship: ' + err.message)
    } finally {
      setEnding(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    setSavingStatus(true)
    try {
      await updateGraduateStatus(state.data.id, newStatus)
      setState(s => ({ ...s, data: { ...s.data, status: newStatus } }))
    } catch (err) {
      alert('Status change failed: ' + err.message)
    } finally {
      setSavingStatus(false)
    }
  }

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
  const hasLogin = !!g.profile?.id
  const activeSponsorship = (g.sponsorships || []).find(s => s.status === 'active')

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav('/admin')} className="back-link">← Back to dashboard</button>

        <div className="detail-header">
          <div className="detail-header-main">
            <div className="detail-avatar">
              {g.photo_url
                ? <img src={g.photo_url} alt={g.full_name} />
                : <span>{(g.full_name || '?').split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase()}</span>}
            </div>
            <div>
              <p className="eyebrow">Graduate record</p>
              <h1 className="page-title" style={{ marginBottom: 6 }}>{g.full_name}</h1>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {g.country}{g.teaching_location ? ` · ${g.teaching_location}` : ''}
              </div>
              <div className="status" style={{ marginTop: 10 }}>
                <span className={`dot ${g.status === 'active' ? 'dot-active' : 'dot-pending'}`} />
                {STATUS_LABELS[g.status] || g.status}
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <Link to={`/admin/graduates/${g.slug}/edit`} className="btn btn-secondary">Edit details</Link>
            {!hasLogin && (
              <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
                Invite to log in
              </button>
            )}
          </div>
        </div>

        <div className="detail-grid">
          <section className="card" style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Credentials</h2>
            <div className="info-grid">
              <div><div className="info-label">University</div><div className="info-value">{g.university}</div></div>
              {g.duration_years && <div><div className="info-label">Duration</div><div className="info-value">{g.duration_years} years</div></div>}
              {g.gpa && <div><div className="info-label">GPA</div><div className="info-value">{g.gpa}</div></div>}
              {g.graduation_year && (
                <div>
                  <div className="info-label">Graduated</div>
                  <div className="info-value">
                    {g.graduation_month ? new Date(2000, g.graduation_month - 1).toLocaleString('en', { month: 'long' }) + ' ' : ''}
                    {g.graduation_year}
                  </div>
                </div>
              )}
              <div><div className="info-label">Country</div><div className="info-value">{g.country}</div></div>
              {g.teaching_location && <div><div className="info-label">Teaching at</div><div className="info-value">{g.teaching_location}</div></div>}
            </div>
          </section>

          <section className="card" style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Quick admin</h2>

            <div style={{ marginBottom: 20 }}>
              <div className="info-label" style={{ marginBottom: 8 }}>Status</div>
              <select
                className="text-input"
                value={g.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={savingStatus}
              >
                <option value="active">Active — teaching</option>
                <option value="seeking">Seeking sponsor</option>
                <option value="paused">Paused</option>
                <option value="alumni">Alumni</option>
              </select>
              <div className="form-hint" style={{ marginTop: 6 }}>
                {savingStatus ? 'Saving…' : 'Changes save immediately'}
              </div>
            </div>

            <div>
              <div className="info-label" style={{ marginBottom: 8 }}>Login account</div>
              {hasLogin ? (
                <div style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--success)' }}>✓ Has login</span>
                  <div className="form-hint" style={{ marginTop: 4 }}>
                    Logged in as {g.profile.full_name}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No login yet</div>
                  <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => setShowInvite(true)}>
                    Create login
                  </button>
                </>
              )}
            </div>
          </section>
        </div>

        {g.focus_areas?.length > 0 && (
          <section className="section">
            <h2 className="section-title" style={{ marginBottom: 16 }}>Teaching focus</h2>
            <ul className="focus-list">
              {g.focus_areas.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </section>
        )}

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
          <h2 className="section-title" style={{ marginBottom: 16 }}>Sponsorship</h2>
          {activeSponsorship ? (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                Sponsored by{' '}
                <Link to={`/admin/sponsors/${activeSponsorship.sponsor?.id}`}>
                  <strong>{activeSponsorship.sponsor?.profile?.full_name
                    || activeSponsorship.sponsor?.country
                    || 'sponsor'}</strong>
                </Link>
                {activeSponsorship.sponsor?.country && ` (${activeSponsorship.sponsor.country})`}
              </div>
              <div className="form-hint" style={{ marginTop: 6 }}>
                ${activeSponsorship.monthly_amount_usd}/month · started {activeSponsorship.started_on}
              </div>
              <button
                className="file-clear"
                onClick={() => handleEndSponsorship(activeSponsorship.id)}
                disabled={ending}
                style={{ marginTop: 10 }}
              >
                End sponsorship
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                No active sponsorship.
              </div>
              <button className="btn btn-primary" onClick={() => setShowAssign(true)}>
                Assign sponsor
              </button>
            </div>
          )}
        </section>

        {showInvite && (
          <InviteGraduateModal
            graduate={g}
            onClose={() => { setShowInvite(false); load({ silent: true }) }}
            onInvited={() => load({ silent: true })}
          />
        )}

        {showAssign && (
          <AssignSponsorModal
            graduate={g}
            onClose={() => setShowAssign(false)}
            onAssigned={() => load({ silent: true })}
          />
        )}
      </div>
    </div>
  )
}
