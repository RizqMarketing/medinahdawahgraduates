import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getGraduateBySlug, updateGraduateStatus, endSponsorship } from '../../lib/api.js'
import InviteGraduateModal from './InviteGraduateModal.jsx'
import AssignSponsorModal from './AssignSponsorModal.jsx'
import { formatNumber } from '../../lib/format.js'

export default function AdminGraduateDetail() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const nav = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [showInvite, setShowInvite] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [ending, setEnding] = useState(false)

  const STATUS_LABELS = {
    active: t('graduateStatus.active'),
    seeking: t('graduateStatus.seeking'),
    paused: t('graduateStatus.paused'),
    alumni: t('graduateStatus.alumni'),
  }

  const load = ({ silent = false } = {}) => {
    if (!silent) setState(s => ({ ...s, status: 'loading' }))
    getGraduateBySlug(slug)
      .then(data => setState(s => ({ ...s, status: 'ok', data, error: null })))
      .catch(error => setState({ status: 'error', data: null, error }))
  }

  useEffect(() => { load() }, [slug])

  const handleEndSponsorship = async (sponsorshipId) => {
    if (!confirm(t('adminGradDetail.confirmEndSponsorship'))) return
    setEnding(true)
    try {
      await endSponsorship(sponsorshipId)
      load({ silent: true })
    } catch (err) {
      alert(t('adminGradDetail.couldNotEndSponsorship', { message: err.message }))
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
      alert(t('adminGradDetail.statusChangeFailed', { message: err.message }))
    } finally {
      setSavingStatus(false)
    }
  }

  if (state.status === 'loading') {
    return <div className="page"><div className="container"><p className="page-subtitle">{t('adminGradDetail.loading')}</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('adminGradDetail.couldNotLoad')}</div>
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

  // Get translated month name via i18n keys (same order used across the app)
  const MONTH_KEYS = ['january','february','march','april','may','june','july','august','september','october','november','december']
  const gradMonthName = g.graduation_month
    ? t(`time.months.${MONTH_KEYS[g.graduation_month - 1]}`)
    : null

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav('/admin')} className="back-link">{t('common.backToDashboard')}</button>

        <div className="detail-header">
          <div className="detail-header-main">
            <div className="detail-avatar">
              {g.photo_url
                ? <img src={g.photo_url} alt={g.full_name} />
                : <span>{(g.full_name || '?').split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase()}</span>}
            </div>
            <div>
              <p className="eyebrow">{t('adminGradDetail.eyebrow')}</p>
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
            <Link to={`/admin/graduates/${g.slug}/edit`} className="btn btn-secondary">{t('adminGradDetail.editDetails')}</Link>
            {!hasLogin && (
              <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
                {t('adminGradDetail.inviteToLogIn')}
              </button>
            )}
          </div>
        </div>

        <div className="detail-grid">
          <section className="card" style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>{t('adminGradDetail.credentials')}</h2>
            <div className="info-grid">
              <div><div className="info-label">{t('adminGradDetail.university')}</div><div className="info-value">{g.university}</div></div>
              {g.duration_years && <div><div className="info-label">{t('adminGradDetail.duration')}</div><div className="info-value"><bdi>{formatNumber(g.duration_years)}</bdi> {t('adminGradDetail.yearsSuffix')}</div></div>}
              {g.gpa && <div><div className="info-label">{t('adminGradDetail.gpa')}</div><div className="info-value"><bdi>{formatNumber(g.gpa)}</bdi></div></div>}
              {g.graduation_year && (
                <div>
                  <div className="info-label">{t('adminGradDetail.graduated')}</div>
                  <div className="info-value">
                    {gradMonthName ? `${gradMonthName} ` : ''}
                    <bdi>{g.graduation_year}</bdi>
                  </div>
                </div>
              )}
              <div><div className="info-label">{t('adminGradDetail.countryField')}</div><div className="info-value">{g.country}</div></div>
              {g.teaching_location && <div><div className="info-label">{t('adminGradDetail.teachingAt')}</div><div className="info-value">{g.teaching_location}</div></div>}
            </div>
          </section>

          <section className="card" style={{ padding: 24 }}>
            <h2 className="section-title" style={{ marginBottom: 16 }}>{t('adminGradDetail.quickAdmin')}</h2>

            <div style={{ marginBottom: 20 }}>
              <div className="info-label" style={{ marginBottom: 8 }}>{t('adminGradDetail.statusLabel')}</div>
              <select
                className="text-input"
                value={g.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={savingStatus}
              >
                <option value="active">{t('graduateStatus.active')}</option>
                <option value="seeking">{t('graduateStatus.seeking')}</option>
                <option value="paused">{t('graduateStatus.paused')}</option>
                <option value="alumni">{t('graduateStatus.alumni')}</option>
              </select>
              <div className="form-hint" style={{ marginTop: 6 }}>
                {savingStatus ? t('adminGradDetail.savingShort') : t('adminGradDetail.changesSaveImmediately')}
              </div>
            </div>

            <div>
              <div className="info-label" style={{ marginBottom: 8 }}>{t('adminGradDetail.loginAccount')}</div>
              {hasLogin ? (
                <div style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--success)' }}>{t('adminGradDetail.hasLogin')}</span>
                  <div className="form-hint" style={{ marginTop: 4 }}>
                    {t('adminGradDetail.loggedInAs', { name: g.profile.full_name })}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t('adminGradDetail.noLoginYet')}</div>
                  <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => setShowInvite(true)}>
                    {t('adminGradDetail.createLogin')}
                  </button>
                </>
              )}
            </div>
          </section>
        </div>

        {g.focus_areas?.length > 0 && (
          <section className="section">
            <h2 className="section-title" style={{ marginBottom: 16 }}>{t('adminGradDetail.teachingFocus')}</h2>
            <ul className="focus-list">
              {g.focus_areas.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </section>
        )}

        {g.story && (
          <section className="section">
            <h2 className="section-title" style={{ marginBottom: 16 }}>{t('adminGradDetail.hisStory')}</h2>
            <blockquote className="quote-block">
              {g.story}
              <footer style={{ marginTop: 18, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {t('adminGradDetail.inHisWords', { name: g.full_name })}
              </footer>
            </blockquote>
          </section>
        )}

        <section className="section">
          <h2 className="section-title" style={{ marginBottom: 16 }}>{t('adminGradDetail.sponsorshipHeading')}</h2>
          {activeSponsorship ? (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>
                {t('adminGradDetail.sponsoredByPrefix')}
                <Link to={`/admin/sponsors/${activeSponsorship.sponsor?.id}`}>
                  <strong>{activeSponsorship.sponsor?.profile?.full_name
                    || activeSponsorship.sponsor?.country
                    || t('adminGradDetail.sponsorFallback')}</strong>
                </Link>
                {activeSponsorship.sponsor?.country && ` (${activeSponsorship.sponsor.country})`}
              </div>
              <div className="form-hint" style={{ marginTop: 6 }}>
                {t('adminGradDetail.sponsorshipMeta', {
                  amount: formatNumber(activeSponsorship.monthly_amount_usd),
                  date: activeSponsorship.started_on,
                })}
              </div>
              <button
                className="file-clear"
                onClick={() => handleEndSponsorship(activeSponsorship.id)}
                disabled={ending}
                style={{ marginTop: 10 }}
              >
                {t('adminGradDetail.endSponsorship')}
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                {t('adminGradDetail.noActiveSponsorship')}
              </div>
              <button className="btn btn-primary" onClick={() => setShowAssign(true)}>
                {t('adminGradDetail.assignSponsor')}
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
