import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSponsorById, endSponsorship, deleteSponsor } from '../../lib/api.js'
import InviteSponsorModal from './InviteSponsorModal.jsx'
import AssignGraduateModal from './AssignGraduateModal.jsx'
import { formatNumber } from '../../lib/format.js'

export default function AdminSponsorDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const nav = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [showInvite, setShowInvite] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [ending, setEnding] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = ({ silent = false } = {}) => {
    if (!silent) setState(s => ({ ...s, status: 'loading' }))
    getSponsorById(id)
      .then(data => setState(s => ({ ...s, status: 'ok', data, error: null })))
      .catch(error => setState({ status: 'error', data: null, error }))
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    if (!state.data) return
    if (!confirm(t('adminSponsorDetail.confirmDelete', { name: state.data.full_name }))) return
    setDeleting(true)
    try {
      await deleteSponsor(state.data.id)
      nav('/admin/sponsors', { replace: true })
    } catch (err) {
      alert(t('adminSponsorDetail.deleteFailed', { message: err.message || String(err) }))
      setDeleting(false)
    }
  }

  const handleEndSponsorship = async (sponsorshipId) => {
    if (!confirm(t('adminSponsorDetail.confirmEndSponsorship'))) return
    setEnding(true)
    try {
      await endSponsorship(sponsorshipId)
      load({ silent: true })
    } catch (err) {
      alert(t('adminSponsorDetail.couldNotEndSponsorship', { message: err.message }))
    } finally {
      setEnding(false)
    }
  }

  if (state.status === 'loading') {
    return <div className="page"><div className="container"><p className="page-subtitle">{t('adminSponsorDetail.loading')}</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('adminSponsorDetail.couldNotLoad')}</div>
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
  const dash = t('common.dash')

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav('/admin/sponsors')} className="back-link">{t('adminSponsorDetail.backToSponsors')}</button>

        <div className="detail-header">
          <div className="detail-header-main">
            <div className="detail-avatar">
              <span>{(s.full_name || '?').split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase()}</span>
            </div>
            <div>
              <p className="eyebrow">{t('adminSponsorDetail.eyebrow')}</p>
              <h1 className="page-title" style={{ marginBottom: 6 }}>{s.full_name}</h1>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {s.country || dash}{s.phone ? ` · ${s.phone}` : ''}
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <Link to={`/admin/sponsors/${s.id}/edit`} className="btn btn-secondary">{t('adminSponsorDetail.editDetails')}</Link>
            {!hasLogin && (
              <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
                {t('adminSponsorDetail.inviteLogin')}
              </button>
            )}
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t('adminSponsorDetail.deleting') : t('adminSponsorDetail.deleteSponsor')}
            </button>
          </div>
        </div>

        <div className="detail-grid">
          <section className="card" style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>{t('adminSponsorDetail.currentSponsorship')}</h2>
            {active.length === 0 ? (
              <>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 14 }}>
                  {t('adminSponsorDetail.notSponsoringAnyone')}
                </div>
                <button className="btn btn-primary" onClick={() => setShowAssign(true)}>
                  {t('adminSponsorDetail.assignAGraduate')}
                </button>
              </>
            ) : active.map(sp => (
              <div key={sp.id} style={{ marginBottom: 12 }}>
                <Link to={`/admin/graduates/${sp.graduate?.slug}`} className="graduate-pill">
                  <strong>{sp.graduate?.full_name}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}> · {sp.graduate?.country}</span>
                </Link>
                <div className="form-hint" style={{ marginTop: 8 }}>
                  {t('adminSponsorDetail.sinceLabel', { amount: formatNumber(sp.monthly_amount_usd), date: sp.started_on })}
                </div>
                <button
                  className="file-clear"
                  onClick={() => handleEndSponsorship(sp.id)}
                  disabled={ending}
                  style={{ marginTop: 10 }}
                >
                  {t('adminSponsorDetail.endSponsorship')}
                </button>
              </div>
            ))}
          </section>

          <section className="card" style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>{t('adminGradDetail.loginAccount')}</h2>
            {hasLogin ? (
              <div style={{ fontSize: 14 }}>
                <span style={{ color: 'var(--success)' }}>{t('adminSponsorDetail.hasLogin')}</span>
                <div className="form-hint" style={{ marginTop: 4 }}>
                  {s.profile.full_name}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t('adminSponsorDetail.noLoginYet')}</div>
            )}
          </section>
        </div>

        {past.length > 0 && (
          <section className="section">
            <h2 className="section-title" style={{ marginBottom: 16 }}>{t('adminSponsorDetail.pastSponsorships')}</h2>
            <div className="data-table">
              <div className="table-header">
                <span>{t('adminSponsorDetail.tableHistGraduate')}</span>
                <span>{t('adminSponsorDetail.tableHistCountry')}</span>
                <span>{t('adminSponsorDetail.tableHistStarted')}</span>
                <span>{t('adminSponsorDetail.tableHistEnded')}</span>
                <span style={{ textAlign: 'end' }}>{t('adminSponsorDetail.tableHistAmount')}</span>
              </div>
              {past.map(sp => (
                <Link key={sp.id} to={`/admin/graduates/${sp.graduate?.slug}`} className="table-row table-row-link">
                  <span className="cell-name">{sp.graduate?.full_name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{sp.graduate?.country}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{sp.started_on}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{sp.ended_on || dash}</span>
                  <span style={{ textAlign: 'end' }}>${formatNumber(sp.monthly_amount_usd)}</span>
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
