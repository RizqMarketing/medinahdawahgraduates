import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getGraduateBySlug, getMonthlyHoursForGraduate,
  listReportsForGraduate,
} from '../lib/api.js'
import { formatHoursMinutes, formatNumber } from '../lib/format.js'

const MONTH_KEYS = ['january','february','march','april','may','june','july','august','september','october','november','december']

function initialsFrom(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function GraduateProfile() {
  const { t } = useTranslation()
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
    return <div className="page"><div className="container"><p className="page-subtitle">{t('graduateProfile.loading')}</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('graduateProfile.couldNotLoad')}</div>
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
  const gradMonthName = g.graduation_month ? t(`time.months.${MONTH_KEYS[g.graduation_month - 1]}`) : null
  const gradDate = g.graduation_year
    ? `${gradMonthName ? gradMonthName + ' ' : ''}${g.graduation_year}`
    : null

  const statusText = g.status === 'active' ? t('graduateProfile.activeTeaching')
    : g.status === 'seeking' ? t('graduateProfile.seeking')
    : g.status === 'paused' ? t('graduateProfile.paused')
    : t('graduateProfile.alumni')

  const reportsThisMonth = reports.filter(r => {
    const d = new Date(r.report_date + 'T00:00:00')
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav(-1)} className="back-link">{t('graduateProfile.back')}</button>

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
          <div className="title-line">{t('graduateProfile.studentOfKnowledge')} · {g.university || t('graduateProfile.fallbackUniversity')}</div>
          <div className="status">
            <span className={`dot ${g.status === 'active' ? 'dot-active' : 'dot-pending'}`} />
            {statusText}
          </div>
        </div>

        <div className="two-col">
          <div>
            <h2 className="section-title" style={{ marginBottom: 16 }}>{t('graduateProfile.credentials')}</h2>
            <div className="info-grid">
              <div>
                <div className="info-label">{t('graduateProfile.university')}</div>
                <div className="info-value">{g.university || t('graduateProfile.fallbackUniversity')}</div>
              </div>
              {g.duration_years && (
                <div>
                  <div className="info-label">{t('graduateProfile.duration')}</div>
                  <div className="info-value"><bdi>{formatNumber(g.duration_years)}</bdi> {t('graduateProfile.yearsSuffix')}</div>
                </div>
              )}
              {g.gpa && (
                <div>
                  <div className="info-label">{t('graduateProfile.gpa')}</div>
                  <div className="info-value"><bdi>{formatNumber(g.gpa)}</bdi></div>
                </div>
              )}
              {gradDate && (
                <div>
                  <div className="info-label">{t('graduateProfile.graduated')}</div>
                  <div className="info-value"><bdi>{gradDate}</bdi></div>
                </div>
              )}
              <div>
                <div className="info-label">{t('graduateProfile.country')}</div>
                <div className="info-value">{g.country}</div>
              </div>
              {g.teaching_location && (
                <div>
                  <div className="info-label">{t('graduateProfile.teachingAt')}</div>
                  <div className="info-value">{g.teaching_location}</div>
                </div>
              )}
            </div>
          </div>

          {g.focus_areas?.length > 0 && (
            <div>
              <h2 className="section-title" style={{ marginBottom: 16 }}>{t('graduateProfile.teachingFocus')}</h2>
              <ul className="focus-list">
                {g.focus_areas.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>

        <section className="section">
          <h2 className="section-title" style={{ marginBottom: 16 }}>{t('graduateProfile.thisMonth')}</h2>
          <div className="card" style={{ padding: 24 }}>
            <div className="progress-label">
              <span>{t('graduateProfile.hoursOfService')}</span>
              <span><strong><bdi>{formatNumber(monthlyHours)}</bdi></strong> / <bdi>{formatNumber(target)}</bdi></span>
            </div>
            <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>

            <div className="stats-grid" style={{ marginTop: 28 }}>
              <div className="stat-card">
                <div className="stat-number"><bdi>{formatNumber(reportsThisMonth)}</bdi></div>
                <div className="stat-label">{t('graduateProfile.reportsThisMonth')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-number"><bdi>{formatNumber(pct)}%</bdi></div>
                <div className="stat-label">{t('graduateProfile.towardTarget')}</div>
              </div>
            </div>
          </div>
        </section>

        {g.story && (
          <section className="section">
            <h2 className="section-title" style={{ marginBottom: 16 }}>{t('graduateProfile.hisStory')}</h2>
            <blockquote className="quote-block">
              {g.story}
              <footer style={{ marginTop: 18, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {t('graduateProfile.inHisWords', { name: g.full_name })}
              </footer>
            </blockquote>
          </section>
        )}

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{t('graduateProfile.recentReports')}</h2>
          </div>
          {reports.length === 0 ? (
            <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>
              {t('graduateProfile.noReports')}
            </div>
          ) : (
            <div className="report-list">
              {reports.map(r => {
                const d = new Date(r.report_date + 'T00:00:00')
                const monthShort = t(`time.months.${MONTH_KEYS[d.getMonth()]}`).slice(0, 3)
                return (
                  <Link key={r.id} to={`/graduate/${g.slug}/reports/${r.report_date}`} className="report-row">
                    <div className="report-date">
                      <span className="day"><bdi>{formatNumber(d.getDate())}</bdi></span>
                      <span className="month">{monthShort}</span>
                    </div>
                    <div>
                      <div className="report-title">
                        {r.overall_text
                          ? r.overall_text.slice(0, 72) + (r.overall_text.length > 72 ? '…' : '')
                          : t('graduateProfile.dailyReport')}
                      </div>
                      <div className="report-sub">
                        {t('graduateProfile.reportSub', {
                          duration: formatHoursMinutes(r.total_hours),
                          count: formatNumber((r.activities || []).length),
                        })}
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
