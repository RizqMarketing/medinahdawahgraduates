import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { kindFromMime } from '../../lib/api.js'
import { CATEGORIES, suggestCategory } from '../../lib/categories.js'
import { formatHoursMinutes, formatNumber } from '../../lib/format.js'

// Activity-type suggestions — rendered via i18n so both English and Arabic
// graduates see suggestions in their language.
const ACTIVITY_SUGGESTION_KEYS = [
  'tajweedLesson','quranMemorisation','tawheedClass','fiqhClass','aqeedahLesson',
  'fridayKhutbah','khutbahPrep','lessonPrep','villageVisit','communityLecture',
  'oneOnOne','childrensClass','adultsClass','nasihahSession','newMuslimSupport',
  'dawahConversation','translationWork','writingContent','communityEvent',
]

export function today() { return new Date().toISOString().slice(0, 10) }

export function hoursFromTimes(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return 0
  return Math.round((mins / 60) * 100) / 100
}

function blankActivity() {
  return {
    activity_type: '',
    category: 'teaching',
    categoryTouched: false,
    entryMode: 'hours',
    hours: '',
    start_time: '',
    end_time: '',
    students_count: '',
    location: '',
    notes: '',
  }
}

function activityFromDb(a) {
  const hasTimes = !!(a.start_time && a.end_time)
  return {
    activity_type: a.activity_type || '',
    category: a.category || 'teaching',
    categoryTouched: true,
    entryMode: hasTimes ? 'times' : 'hours',
    hours: hasTimes ? '' : (a.hours != null ? String(a.hours) : ''),
    start_time: a.start_time ? a.start_time.slice(0, 5) : '',
    end_time: a.end_time ? a.end_time.slice(0, 5) : '',
    students_count: a.students_count != null ? String(a.students_count) : '',
    location: a.location || '',
    notes: a.notes || '',
  }
}

export default function ReportForm({
  mode = 'new',
  initial = {},
  submitLabel,
  onSubmit,
  onCancel,
  submittingText,
}) {
  const { t } = useTranslation()
  const [reportDate, setReportDate] = useState(initial.report_date || today())
  const [overallText, setOverallText] = useState(initial.overall_text || '')
  const [activities, setActivities] = useState(
    initial.activities?.length
      ? initial.activities.slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map(activityFromDb)
      : [blankActivity()]
  )
  const [existingMedia, setExistingMedia] = useState(initial.media || [])
  const [removedMediaIds, setRemovedMediaIds] = useState([])
  const [mediaFiles, setMediaFiles] = useState([])
  const [links, setLinks] = useState([])
  const [linkUrl, setLinkUrl] = useState('')
  const [linkCaption, setLinkCaption] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const acceptDroppedFiles = (files) => {
    const allowed = files.filter(f =>
      f.type.startsWith('image/') ||
      f.type.startsWith('video/') ||
      f.type.startsWith('audio/')
    )
    if (allowed.length === 0) return
    setMediaFiles(list => [...list, ...allowed])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragOver) setDragOver(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const files = Array.from(e.dataTransfer?.files || [])
    acceptDroppedFiles(files)
  }

  const setActivity = (i, patch) => setActivities(list =>
    list.map((a, idx) => idx === i ? { ...a, ...patch } : a)
  )
  const removeActivity = (i) => setActivities(list =>
    list.length === 1 ? list : list.filter((_, idx) => idx !== i)
  )
  const addActivity = () => setActivities(list => [...list, blankActivity()])

  const totalHours = activities.reduce((sum, a) => {
    const h = a.entryMode === 'times'
      ? hoursFromTimes(a.start_time, a.end_time)
      : (Number(a.hours) || 0)
    return sum + h
  }, 0)

  const removeExistingMedia = (id) => {
    setRemovedMediaIds(ids => [...ids, id])
    setExistingMedia(m => m.filter(x => x.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (activities.some(a => !a.activity_type.trim())) {
      return setError(t('reportForm.eachActivityType'))
    }

    const prepared = activities.map(a => ({
      activity_type: a.activity_type.trim(),
      category: a.category || 'teaching',
      start_time: a.entryMode === 'times' ? (a.start_time || null) : null,
      end_time: a.entryMode === 'times' ? (a.end_time || null) : null,
      hours: a.entryMode === 'times' ? hoursFromTimes(a.start_time, a.end_time) : (Number(a.hours) || 0),
      students_count: a.students_count ? Number(a.students_count) : null,
      location: a.location.trim() || null,
      notes: a.notes.trim() || null,
    }))

    if (prepared.some(a => a.hours <= 0)) {
      return setError(t('reportForm.eachActivityHours'))
    }

    setSubmitting(true)
    try {
      await onSubmit({
        report_date: reportDate,
        overall_text: overallText.trim() || null,
        activities: prepared,
        newMediaFiles: mediaFiles,
        newLinks: links,
        removedMediaIds,
        setStatus,
      })
    } catch (err) {
      setError(err?.message || t('reportForm.couldNotSave'))
      setSubmitting(false)
      setStatus('')
    }
  }

  const effectiveSubmit = submitLabel || t('reportForm.submitReport')
  const effectiveSubmitting = submittingText || t('reportForm.submittingDefault')

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label className="info-label" htmlFor="report_date">{t('reportForm.dateLabel')}</label>
          <input id="report_date" type="date" className="text-input"
            value={reportDate} onChange={e => setReportDate(e.target.value)}
            max={today()} required dir="ltr" />
          <div className="form-hint" style={{ marginTop: 6 }}>
            {reportDate === today()
              ? t('reportForm.dateHintToday')
              : t('reportForm.dateHintBackdated')}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="section-header" style={{ marginBottom: 12 }}>
          <h2 className="section-title">{t('reportForm.activities')}</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {t('reportForm.totalLabel')} <strong style={{ color: 'var(--text-primary)' }}>{formatHoursMinutes(totalHours)}</strong>
          </div>
        </div>

        {activities.map((a, i) => (
          <div key={i} className="card activity-card" style={{ padding: 20, marginBottom: 12 }}>
            <div className="activity-card-header">
              <span className="activity-index">{t('reportForm.activityN', { n: i + 1 })}</span>
              {activities.length > 1 && (
                <button type="button" className="file-clear"
                  onClick={() => removeActivity(i)}>{t('reportForm.remove')}</button>
              )}
            </div>

            <div className="form-row-grid">
              <div className="form-row">
                <label className="info-label">{t('reportForm.typeLabel')}</label>
                <input className="text-input" list={`act-suggestions-${i}`}
                  value={a.activity_type}
                  onChange={e => {
                    const next = e.target.value
                    const patch = { activity_type: next }
                    if (!a.categoryTouched) patch.category = suggestCategory(next)
                    setActivity(i, patch)
                  }}
                  placeholder={t('reportForm.typePlaceholder')} required />
                <datalist id={`act-suggestions-${i}`}>
                  {ACTIVITY_SUGGESTION_KEYS.map(k => (
                    <option key={k} value={t(`activitySuggestions.${k}`)} />
                  ))}
                </datalist>
              </div>

              <div className="form-row">
                <label className="info-label">{t('reportForm.categoryLabel')}</label>
                <select className="text-input"
                  value={a.category}
                  onChange={e => setActivity(i, { category: e.target.value, categoryTouched: true })}>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{t(c.labelKey)}</option>
                  ))}
                </select>
                <div className="form-hint" style={{ marginTop: 6 }}>
                  {t(CATEGORIES.find(c => c.value === a.category)?.hintKey || 'category.teachingHint')}
                  {a.category === 'other' && (
                    <> <strong style={{ color: 'var(--accent-warning, #e0a84a)' }}>
                      {t('reportForm.otherWarning')}
                    </strong></>
                  )}
                </div>
              </div>
            </div>

            <div className="entry-mode-tabs">
              <button type="button"
                className={`entry-mode-tab ${a.entryMode === 'hours' ? 'active' : ''}`}
                onClick={() => setActivity(i, { entryMode: 'hours' })}>
                {t('reportForm.enterHours')}
              </button>
              <button type="button"
                className={`entry-mode-tab ${a.entryMode === 'times' ? 'active' : ''}`}
                onClick={() => setActivity(i, { entryMode: 'times' })}>
                {t('reportForm.enterTimes')}
              </button>
            </div>

            {a.entryMode === 'hours' ? (
              <div className="form-row">
                <label className="info-label">{t('reportForm.hoursLabel')}</label>
                <input type="number" step="any" min="0" max="24" className="text-input"
                  value={a.hours}
                  onChange={e => setActivity(i, { hours: e.target.value })}
                  placeholder={t('reportForm.hoursPlaceholder')} dir="ltr" />
              </div>
            ) : (
              <>
                <div className="form-row-grid">
                  <div className="form-row">
                    <label className="info-label">{t('reportForm.startLabel')}</label>
                    <input type="time" className="text-input"
                      value={a.start_time}
                      onChange={e => setActivity(i, { start_time: e.target.value })} dir="ltr" />
                  </div>
                  <div className="form-row">
                    <label className="info-label">{t('reportForm.endLabel')}</label>
                    <input type="time" className="text-input"
                      value={a.end_time}
                      onChange={e => setActivity(i, { end_time: e.target.value })} dir="ltr" />
                  </div>
                </div>
                {a.start_time && a.end_time && (
                  <div className="form-hint" style={{ marginTop: -10, marginBottom: 14 }}>
                    {t('reportForm.equalsHours', { hours: formatNumber(hoursFromTimes(a.start_time, a.end_time)) })}
                  </div>
                )}
              </>
            )}

            <div className="form-row-grid">
              <div className="form-row">
                <label className="info-label">{t('reportForm.studentsOptional')}</label>
                <input type="number" min="0" className="text-input"
                  value={a.students_count}
                  onChange={e => setActivity(i, { students_count: e.target.value })}
                  placeholder={t('reportForm.studentsPlaceholder')} dir="ltr" />
              </div>
              <div className="form-row">
                <label className="info-label">{t('reportForm.locationOptional')}</label>
                <input className="text-input"
                  value={a.location}
                  onChange={e => setActivity(i, { location: e.target.value })}
                  placeholder={t('reportForm.locationPlaceholder')} />
              </div>
            </div>

            <div className="form-row">
              <label className="info-label">{t('reportForm.detailsOptional')}</label>
              <textarea className="text-input" rows={3}
                value={a.notes}
                onChange={e => setActivity(i, { notes: e.target.value })}
                placeholder={t('reportForm.detailsPlaceholder')} />
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addActivity}
          style={{ width: '100%' }}>
          {t('reportForm.addAnother')}
        </button>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 className="section-title" style={{ marginBottom: 14 }}>{t('reportForm.mediaSection')}</h2>
        <p className="form-hint" style={{ marginBottom: 14 }}>
          {t('reportForm.mediaHint')}
        </p>

        {existingMedia.length > 0 && (
          <ul className="media-picker-list" style={{ marginBottom: 14 }}>
            {existingMedia.map(m => (
              <li key={m.id} className="media-picker-item">
                <span className="media-picker-kind">{m.kind}</span>
                <span className="media-picker-name">
                  {m.kind === 'link' ? (m.caption || m.external_url) : m.storage_path?.split('/').pop()}
                </span>
                <button type="button" className="file-clear"
                  onClick={() => removeExistingMedia(m.id)}>
                  {t('reportForm.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}

        <label
          htmlFor="media"
          className={`dropzone ${dragOver ? 'dropzone-active' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="dropzone-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="dropzone-primary">
            {dragOver ? t('reportForm.dropToAdd') : t('reportForm.dragOrClick')}
          </div>
          <div className="dropzone-sub">
            {t('reportForm.mediaTypesHint')}
          </div>
        </label>
        <input id="media" type="file"
          accept="image/*,video/*,audio/*"
          multiple className="visually-hidden"
          onChange={e => {
            const picked = Array.from(e.target.files || [])
            setMediaFiles(list => [...list, ...picked])
            e.target.value = ''
          }} />

        {mediaFiles.length > 0 && (
          <ul className="media-picker-list" style={{ marginTop: 14 }}>
            {mediaFiles.map((f, i) => (
              <li key={i} className="media-picker-item">
                <span className="media-picker-kind">{kindFromMime(f.type) || 'file'}</span>
                <span className="media-picker-name">{f.name}</span>
                <span className="media-picker-size">
                  <bdi>{(f.size / 1024 / 1024).toFixed(1)} MB</bdi>
                </span>
                <button type="button" className="file-clear"
                  onClick={() => setMediaFiles(list => list.filter((_, idx) => idx !== i))}>
                  {t('reportForm.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: 20 }}>
          <div className="info-label" style={{ marginBottom: 8 }}>{t('reportForm.orPasteLink')}</div>
          <div className="link-row">
            <input className="text-input" placeholder={t('reportForm.linkPlaceholder')}
              value={linkUrl} onChange={e => setLinkUrl(e.target.value)} dir="ltr" />
            <input className="text-input" placeholder={t('reportForm.linkCaption')}
              value={linkCaption} onChange={e => setLinkCaption(e.target.value)} />
            <button type="button" className="btn btn-secondary"
              onClick={() => {
                const u = linkUrl.trim()
                if (!u) return
                setLinks(arr => [...arr, { url: u, caption: linkCaption.trim() || null }])
                setLinkUrl(''); setLinkCaption('')
              }}>
              {t('reportForm.addLink')}
            </button>
          </div>
          {links.length > 0 && (
            <ul className="media-picker-list">
              {links.map((l, i) => (
                <li key={i} className="media-picker-item">
                  <span className="media-picker-kind">link</span>
                  <span className="media-picker-name">{l.caption || l.url}</span>
                  <button type="button" className="file-clear"
                    onClick={() => setLinks(arr => arr.filter((_, idx) => idx !== i))}>
                    {t('reportForm.remove')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label className="info-label" htmlFor="overall">{t('reportForm.overallOptional')}</label>
          <textarea id="overall" className="text-input" rows={6}
            value={overallText} onChange={e => setOverallText(e.target.value)}
            placeholder={t('reportForm.overallPlaceholder')} />
        </div>
      </div>

      {error && (
        <div className="alert-card" style={{ marginBottom: 16 }}>
          <div className="alert-title">{error}</div>
        </div>
      )}

      <div className="action-row">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? (status || effectiveSubmitting) : effectiveSubmit}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            {t('reportForm.cancel')}
          </button>
        )}
      </div>
    </form>
  )
}
