import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMyGraduate, updateGraduate } from '../../lib/api.js'
import LoadingPage from '../../components/LoadingPage.jsx'

const MAX_STORY_CHARS = 1500

// `mode` controls the page's role in the graduate's lifecycle:
//   'first-login'  — one-shot welcome flow on first sign-in. Redirects away
//                    if setup_completed_at is already set. Stamps the field
//                    on submit and routes to /graduate-home.
//   'edit'         — ongoing "My profile" page. Always accessible. Submit
//                    saves and stays on the page with a "Saved" hint.
export default function Welcome({ mode = 'first-login' }) {
  const { t } = useTranslation()
  const nav = useNavigate()

  const [graduate, setGraduate] = useState(null)
  const [loadStatus, setLoadStatus] = useState('loading')
  const [loadErr, setLoadErr] = useState(null)

  const [teachingLocation, setTeachingLocation] = useState('')
  const [focusText, setFocusText] = useState('')
  const [story, setStory] = useState('')

  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const g = await getMyGraduate()
        if (cancelled) return
        if (!g) {
          setLoadErr(new Error(t('welcome.noGraduateRecord')))
          setLoadStatus('error')
          return
        }
        if (mode === 'first-login' && g.setup_completed_at) {
          nav('/graduate-home', { replace: true })
          return
        }
        setGraduate(g)
        setTeachingLocation(g.teaching_location || '')
        setFocusText((g.focus_areas || []).join('\n'))
        setStory(g.story || '')
        setLoadStatus('ok')
      } catch (err) {
        if (!cancelled) {
          setLoadErr(err)
          setLoadStatus('error')
        }
      }
    })()
    return () => { cancelled = true }
  }, [nav, t, mode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSavedOk(false)
    if (!teachingLocation.trim()) return setError(t('welcome.errTeachingRequired'))
    if (!story.trim()) return setError(t('welcome.errStoryRequired'))

    const focusAreas = focusText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    setSaving(true)
    try {
      const changes = {
        teaching_location: teachingLocation.trim(),
        focus_areas: focusAreas,
        story: story.trim().slice(0, MAX_STORY_CHARS),
      }
      if (mode === 'first-login') {
        changes.setup_completed_at = new Date().toISOString()
      }
      await updateGraduate(graduate.id, changes)
      if (mode === 'first-login') {
        nav('/graduate-home', { replace: true })
      } else {
        setSavedOk(true)
        setSaving(false)
      }
    } catch (err) {
      setError(err?.message || t('welcome.errCouldNotSave'))
      setSaving(false)
    }
  }

  if (loadStatus === 'loading') return <LoadingPage />
  if (loadStatus === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('welcome.couldNotLoad')}</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {loadErr?.message || String(loadErr)}
          </pre>
        </div>
      </div></div>
    )
  }

  const firstName = (graduate.full_name || '').split(/\s+/)[0]
  const isEdit = mode === 'edit'

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        {isEdit && (
          <Link to="/graduate-home" className="back-link">{t('welcome.backToHome')}</Link>
        )}
        <p className="eyebrow">{isEdit ? t('welcome.editEyebrow') : t('welcome.eyebrow')}</p>
        <h1 className="page-title">
          {isEdit ? t('welcome.editTitle') : t('welcome.title', { name: firstName })}
        </h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          {isEdit ? t('welcome.editSubtitle') : t('welcome.subtitle')}
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert-card" style={{ marginBottom: 20 }}>
              <div className="alert-title">{error}</div>
            </div>
          )}

          <div className="card" style={{ padding: 28, marginBottom: 24 }}>
            <div className="form-row">
              <label className="info-label" htmlFor="teaching_location">{t('welcome.teachingLocationLabel')}</label>
              <input
                id="teaching_location"
                className="text-input"
                value={teachingLocation}
                onChange={e => { setTeachingLocation(e.target.value); setSavedOk(false) }}
                placeholder={t('welcome.teachingLocationPlaceholder')}
                required
              />
              <div className="form-hint">{t('welcome.teachingLocationHint')}</div>
            </div>

            <div className="form-row">
              <label className="info-label" htmlFor="focus_areas">{t('welcome.focusAreasLabel')}</label>
              <textarea
                id="focus_areas"
                className="text-input"
                rows={4}
                value={focusText}
                onChange={e => { setFocusText(e.target.value); setSavedOk(false) }}
                placeholder={t('welcome.focusAreasPlaceholder')}
              />
              <div className="form-hint">{t('welcome.focusAreasHint')}</div>
            </div>

            <div className="form-row">
              <label className="info-label" htmlFor="story">{t('welcome.storyLabel')}</label>
              <textarea
                id="story"
                className="text-input"
                rows={8}
                value={story}
                onChange={e => { setStory(e.target.value.slice(0, MAX_STORY_CHARS)); setSavedOk(false) }}
                placeholder={t('welcome.storyPlaceholder')}
                required
              />
              <div className="form-hint">{t('welcome.storyHint', { count: story.length, max: MAX_STORY_CHARS })}</div>
            </div>
          </div>

          <div className="action-row" style={{ alignItems: 'center', gap: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? t('common.saving')
                : (isEdit ? t('welcome.submitEdit') : t('welcome.submit'))}
            </button>
            {savedOk && (
              <span style={{ color: 'var(--success)', fontSize: 14 }}>
                {t('welcome.savedOk')}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
