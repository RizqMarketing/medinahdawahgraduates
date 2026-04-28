import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { slugify } from '../../lib/slug.js'

const MONTH_KEYS = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
]

export default function GraduateForm({
  initial = {},
  submitLabel,
  onSubmit,
  onCancel,
  mode = 'edit', // 'new' hides teaching+story (graduate fills on first login); 'edit' shows everything
}) {
  const { t } = useTranslation()
  const [fullName, setFullName] = useState(initial.full_name || '')
  const [slug, setSlug] = useState(initial.slug || '')
  const [slugTouched, setSlugTouched] = useState(!!initial.slug)
  const [country, setCountry] = useState(initial.country || '')
  const [university, setUniversity] = useState(initial.university || 'Islamic University of Madinah')
  const [gradYear, setGradYear] = useState(initial.graduation_year || '')
  const [gradMonth, setGradMonth] = useState(initial.graduation_month || '')
  const [duration, setDuration] = useState(initial.duration_years || '')
  const [gpa, setGpa] = useState(initial.gpa || '')
  const [focusText, setFocusText] = useState(
    (initial.focus_areas || []).join('\n')
  )
  const [story, setStory] = useState(initial.story || '')
  const [teachingLocation, setTeachingLocation] = useState(initial.teaching_location || '')
  const [status, setStatus] = useState(initial.status || 'active')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(initial.photo_url || null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(fullName))
  }, [fullName, slugTouched])

  useEffect(() => {
    if (!photoFile) return
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!fullName.trim()) return setError(t('adminGradForm.errFullNameRequired'))
    if (!country.trim()) return setError(t('adminGradForm.errCountryRequired'))
    if (!slug.trim()) return setError(t('adminGradForm.errSlugRequired'))

    const focusAreas = focusText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = {
      full_name: fullName.trim(),
      slug: slug.trim(),
      country: country.trim(),
      university: university.trim() || 'Islamic University of Madinah',
      graduation_year: gradYear ? Number(gradYear) : null,
      graduation_month: gradMonth ? Number(gradMonth) : null,
      duration_years: duration ? Number(duration) : null,
      gpa: gpa ? Number(gpa) : null,
      focus_areas: focusAreas,
      story: story.trim() || null,
      teaching_location: teachingLocation.trim() || null,
      status,
      photoFile,
    }

    setSubmitting(true)
    try {
      await onSubmit(payload)
    } catch (err) {
      setError(err?.message || t('adminGradForm.errCouldNotSave'))
      setSubmitting(false)
    }
  }

  const label = submitLabel || t('adminGradForm.submitSave')

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert-card" style={{ marginBottom: 20 }}>
          <div className="alert-title">{error}</div>
        </div>
      )}

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 20 }}>{t('adminGradForm.sectionBasics')}</h2>

        <div className="form-row">
          <label className="info-label" htmlFor="full_name">{t('adminGradForm.fullName')}</label>
          <input id="full_name" className="text-input" value={fullName}
            onChange={e => setFullName(e.target.value)} required />
        </div>

        <div className="form-row">
          <label className="info-label" htmlFor="slug">{t('adminGradForm.slug')}</label>
          <input id="slug" className="text-input" value={slug}
            onChange={e => { setSlug(e.target.value); setSlugTouched(true) }} required dir="ltr" />
          <div className="form-hint">{t('adminGradForm.slugHint', { slug: slug || '…' })}</div>
        </div>

        <div className="form-row">
          <label className="info-label" htmlFor="country">{t('adminGradForm.country')}</label>
          <input id="country" className="text-input" value={country}
            onChange={e => setCountry(e.target.value)} placeholder={t('adminGradForm.countryPlaceholder')} required />
        </div>

        {mode === 'edit' && (
          <div className="form-row">
            <label className="info-label" htmlFor="teaching_location">{t('adminGradForm.teachingLocation')}</label>
            <input id="teaching_location" className="text-input" value={teachingLocation}
              onChange={e => setTeachingLocation(e.target.value)} placeholder={t('adminGradForm.teachingLocationPlaceholder')} />
          </div>
        )}

        <div className="form-row">
          <label className="info-label" htmlFor="status">{t('adminGradForm.status')}</label>
          <select id="status" className="text-input" value={status}
            onChange={e => setStatus(e.target.value)}>
            <option value="active">{t('graduateStatus.activeLong')}</option>
            <option value="seeking">{t('graduateStatus.seeking')}</option>
            <option value="paused">{t('graduateStatus.paused')}</option>
            <option value="alumni">{t('graduateStatus.alumni')}</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 20 }}>{t('adminGradForm.sectionCredentials')}</h2>

        <div className="form-row">
          <label className="info-label" htmlFor="university">{t('adminGradForm.university')}</label>
          <input id="university" className="text-input" value={university}
            onChange={e => setUniversity(e.target.value)} />
        </div>

        <div className="form-row-grid">
          <div className="form-row">
            <label className="info-label" htmlFor="grad_year">{t('adminGradForm.gradYear')}</label>
            <input id="grad_year" className="text-input" type="number" min="2000" max="2100"
              value={gradYear} onChange={e => setGradYear(e.target.value)} placeholder={t('adminGradForm.gradYearPlaceholder')} dir="ltr" />
          </div>
          <div className="form-row">
            <label className="info-label" htmlFor="grad_month">{t('adminGradForm.gradMonth')}</label>
            <select id="grad_month" className="text-input" value={gradMonth}
              onChange={e => setGradMonth(e.target.value)}>
              <option value="">{t('common.dash')}</option>
              {MONTH_KEYS.map((key, i) => <option key={key} value={i + 1}>{t(`time.months.${key}`)}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row-grid">
          <div className="form-row">
            <label className="info-label" htmlFor="duration">{t('adminGradForm.durationYears')}</label>
            <input id="duration" className="text-input" type="number" step="0.1" min="0" max="20"
              value={duration} onChange={e => setDuration(e.target.value)} placeholder={t('adminGradForm.durationPlaceholder')} dir="ltr" />
          </div>
          <div className="form-row">
            <label className="info-label" htmlFor="gpa">{t('adminGradForm.gpa')}</label>
            <input id="gpa" className="text-input" type="number" step="0.01" min="0" max="5"
              value={gpa} onChange={e => setGpa(e.target.value)} placeholder={t('adminGradForm.gpaPlaceholder')} dir="ltr" />
          </div>
        </div>
      </div>

      {mode === 'edit' && (
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h2 className="section-title" style={{ marginBottom: 20 }}>{t('adminGradForm.sectionTeachingStory')}</h2>

          <div className="form-row">
            <label className="info-label" htmlFor="focus_areas">{t('adminGradForm.focusAreas')}</label>
            <textarea id="focus_areas" className="text-input" rows={4}
              value={focusText} onChange={e => setFocusText(e.target.value)}
              placeholder={t('adminGradForm.focusPlaceholder')} />
          </div>

          <div className="form-row">
            <label className="info-label" htmlFor="story">{t('adminGradForm.story')}</label>
            <textarea id="story" className="text-input" rows={6}
              value={story} onChange={e => setStory(e.target.value)}
              placeholder={t('adminGradForm.storyPlaceholder')} />
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 20 }}>{t('adminGradForm.sectionPhoto')}</h2>

        <div className="photo-upload-row">
          <div className="photo-preview">
            {photoPreview
              ? <img src={photoPreview} alt={t('common.photo')} />
              : <span className="photo-preview-empty">{t('adminGradForm.photoPreviewEmpty')}</span>}
          </div>
          <div className="photo-upload-controls">
            <label htmlFor="photo" className="btn btn-secondary file-btn">
              {photoFile ? t('adminGradForm.changePhoto') : t('adminGradForm.choosePhoto')}
            </label>
            <input id="photo" type="file" accept="image/jpeg,image/png,image/webp"
              className="visually-hidden"
              onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
            {photoFile && (
              <button type="button" className="btn-ghost file-clear"
                onClick={() => { setPhotoFile(null); setPhotoPreview(initial.photo_url || null) }}>
                {t('adminGradForm.removePhoto')}
              </button>
            )}
            <div className="file-name">
              {photoFile ? photoFile.name : t('adminGradForm.noFileChosen')}
            </div>
            <div className="form-hint" style={{ marginTop: 6 }}>
              {t('adminGradForm.photoHint')}
            </div>
          </div>
        </div>
      </div>

      <div className="action-row">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? t('common.saving') : label}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          {t('adminGradForm.cancel')}
        </button>
      </div>
    </form>
  )
}
