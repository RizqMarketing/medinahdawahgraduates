import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getSponsorById, endSponsorship } from '../../lib/api.js'
import InviteSponsorModal from './InviteSponsorModal.jsx'
import AssignGraduateModal from './AssignGraduateModal.jsx'

export default function AdminSponsorDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [showInvite, setShowInvite] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [ending, setEnding] = useState(false)

  const load = ({ silent = false } = {}) => {
    if (!silent) setState(s => ({ ...s, status: 'loading' }))
    getSponsorById(id)
      .then(data => setState(s => ({ ...s, status: 'ok', data, error: null })))
      .catch(error => setState({ status: 'error', data: null, error }))
  }

  useEffect(() => { load() }, [id])

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

  if (state.status === 'loading') {
    return <div className="page"><div className="container"><p className="page-subtitle">Loading…</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">Could not load sponsor</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  const s = state.data
  const hasLogin = !!s.profile?.id
  const history = (s.sponsorships || []).sort((a, b) =>
    (a.started_on < b.started_on ? 1 : -1)
  )
  const active = history.filter(h => h.status === 'active')
  const past = history.filter(h => h.status === 'ended')

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav('/admin/sponsors')} className="back-link">← Back to sponsors</button>

        <div className="detail-header">
          <div className="detail-header-main">
            <div className="detail-avatar">
              <span>{(s.full_name || '?').split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase()}</span>
            </div>
            <div>
              <p className="eyebrow">Sponsor record</p>
              <h1 className="page-title" style={{ marginBottom: 6 }}>{s.full_name}</h1>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {s.country || '—'}{s.phone ? ` · ${s.phone}` : ''}
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <Link to={`/admin/sponsors/${s.id}/edit`} className="btn btn-secondary">Edit details</Link>
            {!hasLogin && (
              <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
                Invite to log in
              </button>
            )}
          </div>
        </div>

        <div className="detail-grid">
          <section className="card" style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Current sponsorship</h2>
            {active.length === 0 ? (
              <>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 14 }}>
                  Not sponsoring anyone currently.
                </div>
                <button className="btn btn-primary" onClick={() => setShowAssign(true)}>
                  Assign a graduate
                </button>
              </>
            ) : active.map(sp => (
              <div key={sp.id} style={{ marginBottom: 12 }}>
                <Link to={`/admin/graduates/${sp.graduate?.slug}`} className="graduate-pill">
                  <strong>{sp.graduate?.full_name}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}> · {sp.graduate?.country}</span>
                </Link>
                <div className="form-hint" style={{ marginTop: 8 }}>
                  ${sp.monthly_amount_usd}/month · since {sp.started_on}
                </div>
                <button
                  className="file-clear"
                  onClick={() => handleEndSponsorship(sp.id)}
                  disabled={ending}
                  style={{ marginTop: 10 }}
                >
                  End sponsorship
                </button>
              </div>
            ))}
          </section>

          <section className="card" style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>Login account</h2>
            {hasLogin ? (
              <div style={{ fontSize: 14 }}>
                <span style={{ color: 'var(--success)' }}>✓ Has login</span>
                <div className="form-hint" style={{ marginTop: 4 }}>
                  {s.profile.full_name}
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
          </section>
        </div>

        {past.length > 0 && (
          <section className="section">
            <h2 className="section-title" style={{ marginBottom: 16 }}>Past sponsorships</h2>
            <div className="data-table">
              <div className="table-header">
                <span>Graduate</span>
                <span>Country</span>
                <span>Started</span>
                <span>Ended</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
              </div>
              {past.map(sp => (
                <Link key={sp.id} to={`/admin/graduates/${sp.graduate?.slug}`} className="table-row table-row-link">
                  <span className="cell-name">{sp.graduate?.full_name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{sp.graduate?.country}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{sp.started_on}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{sp.ended_on || '—'}</span>
                  <span style={{ textAlign: 'right' }}>${sp.monthly_amount_usd}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {showInvite && (
          <InviteSponsorModal
            sponsor={s}
            onClose={() => { setShowInvite(false); load({ silent: true }) }}
            onInvited={() => load({ silent: true })}
          />
        )}

        {showAssign && (
          <AssignGraduateModal
            sponsor={s}
            onClose={() => setShowAssign(false)}
            onAssigned={() => load({ silent: true })}
          />
        )}
      </div>
    </div>
  )
}
