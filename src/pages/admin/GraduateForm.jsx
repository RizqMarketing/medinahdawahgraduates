import { useEffect, useState } from 'react'
import { slugify } from '../../lib/slug.js'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const STATUSES = [
  { value: 'active',  label: 'Active — currently teaching' },
  { value: 'seeking', label: 'Seeking sponsor' },
  { value: 'paused', label: 'Paused' },
  { value: 'alumni', label: 'Alumni' },
]

export default function GraduateForm({
  initial = {},
  submitLabel = 'Save graduate',
  onSubmit,
  onCancel,
}) {
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
    if (!fullName.trim()) return setError('Full name is required')
    if (!country.trim()) return setError('Country is required')
    if (!slug.trim()) return setError('Slug is required')

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
      setError(err?.message || 'Could not save')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert-card" style={{ marginBottom: 20 }}>
          <div className="alert-title">{error}</div>
        </div>
      )}

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 20 }}>Basics</h2>

        <div className="form-row">
          <label className="info-label" htmlFor="full_name">Full name</label>
          <input id="full_name" className="text-input" value={fullName}
            onChange={e => setFullName(e.target.value)} required autoFocus />
        </div>

        <div className="form-row">
          <label className="info-label" htmlFor="slug">Slug (URL identifier)</label>
          <input id="slug" className="text-input" value={slug}
            onChange={e => { setSlug(e.target.value); setSlugTouched(true) }} required />
          <div className="form-hint">Used in profile URL: /graduate/{slug || '…'}</div>
        </div>

        <div className="form-row-grid">
          <div className="form-row">
            <label className="info-label" htmlFor="country">Country</label>
            <input id="country" className="text-input" value={country}
              onChange={e => setCountry(e.target.value)} placeholder="Tanzania" required />
          </div>
          <div className="form-row">
            <label className="info-label" htmlFor="teaching_location">Teaching location</label>
            <input id="teaching_location" className="text-input" value={teachingLocation}
              onChange={e => setTeachingLocation(e.target.value)} placeholder="Dar es Salaam" />
          </div>
        </div>

        <div className="form-row">
          <label className="info-label" htmlFor="status">Status</label>
          <select id="status" className="text-input" value={status}
            onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 20 }}>Credentials</h2>

        <div className="form-row">
          <label className="info-label" htmlFor="university">University</label>
          <input id="university" className="text-input" value={university}
            onChange={e => setUniversity(e.target.value)} />
        </div>

        <div className="form-row-grid">
          <div className="form-row">
            <label className="info-label" htmlFor="grad_year">Graduation year</label>
            <input id="grad_year" className="text-input" type="number" min="2000" max="2100"
              value={gradYear} onChange={e => setGradYear(e.target.value)} placeholder="2025" />
          </div>
          <div className="form-row">
            <label className="info-label" htmlFor="grad_month">Graduation month</label>
            <select id="grad_month" className="text-input" value={gradMonth}
              onChange={e => setGradMonth(e.target.value)}>
              <option value="">—</option>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row-grid">
          <div className="form-row">
            <label className="info-label" htmlFor="duration">Duration (years)</label>
            <input id="duration" className="text-input" type="number" step="0.1" min="0" max="20"
              value={duration} onChange={e => setDuration(e.target.value)} placeholder="5.5" />
          </div>
          <div className="form-row">
            <label className="info-label" htmlFor="gpa">GPA</label>
            <input id="gpa" className="text-input" type="number" step="0.01" min="0" max="5"
              value={gpa} onChange={e => setGpa(e.target.value)} placeholder="4.80" />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 20 }}>Teaching & story</h2>

        <div className="form-row">
          <label className="info-label" htmlFor="focus_areas">Teaching focus (one per line)</label>
          <textarea id="focus_areas" className="text-input" rows={4}
            value={focusText} onChange={e => setFocusText(e.target.value)}
            placeholder={'Tajweed lessons for children\nTawheed and Fiqh for adults\nFriday khutbahs'} />
        </div>

        <div className="form-row">
          <label className="info-label" htmlFor="story">Story (in their own words)</label>
          <textarea id="story" className="text-input" rows={6}
            value={story} onChange={e => setStory(e.target.value)}
            placeholder="Optional — a short paragraph about their journey" />
        </div>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 20 }}>Photo</h2>

        <div className="photo-upload-row">
          <div className="photo-preview">
            {photoPreview
              ? <img src={photoPreview} alt="Preview" />
              : <span className="photo-preview-empty">No photo</span>}
          </div>
          <div className="photo-upload-controls">
            <label htmlFor="photo" className="btn btn-secondary file-btn">
              {photoFile ? 'Change photo' : 'Choose photo'}
            </label>
            <input id="photo" type="file" accept="image/jpeg,image/png,image/webp"
              className="visually-hidden"
              onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
            {photoFile && (
              <button type="button" className="btn-ghost file-clear"
                onClick={() => { setPhotoFile(null); setPhotoPreview(initial.photo_url || null) }}>
                Remove
              </button>
            )}
            <div className="file-name">
              {photoFile ? photoFile.name : 'No file chosen'}
            </div>
            <div className="form-hint" style={{ marginTop: 6 }}>
              JPG, PNG, or WebP · max 2 MB · optional, can be added later
            </div>
          </div>
        </div>
      </div>

      <div className="action-row">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
