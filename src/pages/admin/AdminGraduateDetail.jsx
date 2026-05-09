import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getGraduateBySlug, updateGraduateStatus, endSponsorship, updateGraduate, deleteGraduate, getMonthlyReportData } from '../../lib/api.js'
import { startImpersonation } from '../../lib/impersonation.js'
import GraduateBonusCard from './GraduateBonusCard.jsx'
import InviteGraduateModal from './InviteGraduateModal.jsx'
import AssignSponsorModal from './AssignSponsorModal.jsx'
import ReportHeatmap from '../../components/ReportHeatmap.jsx'
import MonthPicker from '../../components/MonthPicker.jsx'
import { formatNumber } from '../../lib/format.js'
import { monthIdNow } from '../../lib/months.js'

export default function AdminGraduateDetail() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const nav = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })
  const [showInvite, setShowInvite] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [savingStatus, setSavingStatus] = useState(false)
  const [ending, setEnding] = useState(false)
  const [savingFlag, setSavingFlag] = useState(null) // 'video_exempt' | 'voice_fallback_approved' | null
  const [deleting, setDeleting] = useState(false)
  const [impersonating, setImpersonating] = useState(false)
  const [monthReports, setMonthReports] = useState({ status: 'idle', data: [] })

  // Month context for the activity heatmap. Read from `?month=YYYY-MM` so
  // navigating in from the admin dashboard's month view lands on that same
  // month here. Defaults to the current month otherwise.
  const [searchParams, setSearchParams] = useSearchParams()
  const monthFromUrl = searchParams.get('month')
  const currentMonthId = (monthFromUrl && /^\d{4}-\d{2}$/.test(monthFromUrl))
    ? monthFromUrl
    : monthIdNow()
  const setHeatmapMonth = (m) => {
    const next = new URLSearchParams(searchParams)
    if (!m || m === monthIdNow()) next.delete('month')
    else next.set('month', m)
    setSearchParams(next, { replace: true })
  }

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

  // Pull this month's reports for the activity heatmap. Runs separately
  // from the main load so a slow report query never blocks identity +
  // credentials from rendering.
  //
  // Clear data to [] on every month change. Otherwise the heatmap would
  // briefly render the previous month's cells under the new month's label
  // — a confusing flash when the admin clicks "next month" rapidly.
  useEffect(() => {
    const gradId = state.data?.id
    if (!gradId) return
    let cancelled = false
    setMonthReports({ status: 'loading', data: [] })
    getMonthlyReportData(gradId, currentMonthId)
      .then(data => { if (!cancelled) setMonthReports({ status: 'ok', data }) })
      .catch(() => { if (!cancelled) setMonthReports({ status: 'error', data: [] }) })
    return () => { cancelled = true }
  }, [state.data?.id, currentMonthId])

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

  const handleDelete = async () => {
    if (!state.data) return
    if (!confirm(t('adminGradDetail.confirmDelete', { name: state.data.full_name }))) return
    setDeleting(true)
    try {
      await deleteGraduate(state.data.id)
      nav('/admin', { replace: true })
    } catch (err) {
      alert(t('adminGradDetail.deleteFailed', { message: err.message || String(err) }))
      setDeleting(false)
    }
  }

  const handleViewAsGraduate = async () => {
    if (impersonating) return
    setImpersonating(true)
    try {
      await startImpersonation(slug)
      nav('/graduate-home', { replace: true })
    } catch (err) {
      alert(t('admin.impersonation.error', { message: err.message || String(err) }))
      setImpersonating(false)
    }
  }

  const handleFlagToggle = async (flag, next) => {
    const prev = state.data?.[flag]
    setState(s => ({ ...s, data: { ...s.data, [flag]: next } }))
    setSavingFlag(flag)
    try {
      await updateGraduate(state.data.id, { [flag]: next })
    } catch (err) {
      setState(s => ({ ...s, data: { ...s.data, [flag]: prev } }))
      alert(t('adminGradDetail.flagChangeFailed', { message: err.message }))
    } finally {
      setSavingFlag(null)
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
              <p className="eyebrow">
                {t('adminGradDetail.eyebrow')}
                {g.graduate_number != null && (
                  <> · <bdi>#{g.graduate_number}</bdi></>
                )}
              </p>
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
            <Link to={`/graduate/${g.slug}/months/${monthIdNow()}`} className="btn btn-secondary">{t('monthlyReport.eyebrow')}</Link>
            {hasLogin && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleViewAsGraduate}
                disabled={impersonating}
              >
                {impersonating ? t('admin.impersonation.opening') : t('admin.viewAsGraduate')}
              </button>
            )}
            {!hasLogin && (
              <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
                {t('adminGradDetail.inviteToLogIn')}
              </button>
            )}
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t('adminGradDetail.deleting') : t('adminGradDetail.deleteGraduate')}
            </button>
          </div>
        </div>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{t('adminGradDetail.activityThisMonthTitle')}</h2>
            <MonthPicker value={currentMonthId} onChange={setHeatmapMonth} />
          </div>
          {/*
            Always render the heatmap — the component handles empty data
            gracefully (all cells dim). Dropping the conditional avoids
            the loading-card flash on every month switch. While reports
            are being fetched, opacity dim makes the in-flight state
            obvious without a layout swap.
          */}
          <div style={{ opacity: monthReports.status === 'loading' ? 0.6 : 1, transition: 'opacity 120ms' }}>
            <ReportHeatmap reports={monthReports.data} monthId={currentMonthId} graduateSlug={g.slug} />
          </div>
        </section>

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

            <div style={{ marginBottom: 20 }}>
              <div className="info-label" style={{ marginBottom: 8 }}>{t('adminGradDetail.loginAccount')}</div>
              {hasLogin ? (
                <div style={{ fontSize: 14 }}>
                  <span style={{ color: 'var(--success)' }}>{t('adminGradDetail.hasLogin')}</span>
                  <div className="form-hint" style={{ marginTop: 4 }}>
                    {t('adminGradDetail.loggedInAs', { name: g.profile.full_name })}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t('adminGradDetail.noLoginYet')}</div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div className="info-label" style={{ marginBottom: 10 }}>{t('adminGradDetail.gradingOverrides')}</div>

              <label className="toggle-row" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={!!g.video_exempt}
                  onChange={e => handleFlagToggle('video_exempt', e.target.checked)}
                  disabled={savingFlag === 'video_exempt'}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{t('adminGradDetail.videoExemptLabel')}</div>
                  <div className="form-hint" style={{ marginTop: 2 }}>{t('adminGradDetail.videoExemptHint')}</div>
                </div>
              </label>

              <label className="toggle-row" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!g.voice_fallback_approved}
                  onChange={e => handleFlagToggle('voice_fallback_approved', e.target.checked)}
                  disabled={savingFlag === 'voice_fallback_approved'}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{t('adminGradDetail.voiceFallbackLabel')}</div>
                  <div className="form-hint" style={{ marginTop: 2 }}>{t('adminGradDetail.voiceFallbackHint')}</div>
                </div>
              </label>

              <div className="form-hint" style={{ marginTop: 10 }}>
                {savingFlag ? t('adminGradDetail.savingShort') : t('adminGradDetail.changesSaveImmediately')}
              </div>
            </div>
          </section>
        </div>

        <GraduateBonusCard graduateId={g.id} />

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
