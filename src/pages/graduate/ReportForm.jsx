import { useState } from 'react'
import { kindFromMime } from '../../lib/api.js'
import { CATEGORIES, suggestCategory } from '../../lib/categories.js'
import { formatHoursMinutes } from '../../lib/format.js'

const ACTIVITY_SUGGESTIONS = [
  'Tajweed lesson',
  'Quran memorisation',
  'Tawheed class',
  'Fiqh class',
  'Aqeedah lesson',
  'Friday khutbah',
  'Khutbah preparation',
  'Lesson preparation',
  'Village visit',
  'Community lecture',
  'One-on-one teaching',
  'Children\'s class',
  'Adults\' class',
  'Nasihah / advice session',
  'New Muslim support',
  'Dawah conversation',
  'Translation work',
  'Writing / content',
  'Community event',
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
  mode = 'new',            // 'new' | 'edit'
  initial = {},            // { report_date, overall_text, activities: [...], media: [...] }
  submitLabel = 'Submit report',
  onSubmit,                // async ({ report_date, overall_text, activities, newMediaFiles, newLinks, removedMediaIds }) => void
  onCancel,
  submittingText = 'Submitting…',
}) {
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
      return setError('Please give each activity a type')
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
      return setError('Each activity needs at least some hours (or valid start/end times)')
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
      setError(err?.message || 'Could not save')
      setSubmitting(false)
      setStatus('')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label className="info-label" htmlFor="report_date">Date</label>
          <input id="report_date" type="date" className="text-input"
            value={reportDate} onChange={e => setReportDate(e.target.value)}
            max={today()} required />
          <div className="form-hint" style={{ marginTop: 6 }}>
            {reportDate === today()
              ? 'Today'
              : 'Backdated — pick an earlier day if you missed one'}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="section-header" style={{ marginBottom: 12 }}>
          <h2 className="section-title">Activities</h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Total: <strong style={{ color: 'var(--text-primary)' }}>{formatHoursMinutes(totalHours)}</strong>
          </div>
        </div>

        {activities.map((a, i) => (
          <div key={i} className="card activity-card" style={{ padding: 20, marginBottom: 12 }}>
            <div className="activity-card-header">
              <span className="activity-index">Activity {i + 1}</span>
              {activities.length > 1 && (
                <button type="button" className="file-clear"
                  onClick={() => removeActivity(i)}>Remove</button>
              )}
            </div>

            <div className="form-row-grid">
              <div className="form-row">
                <label className="info-label">Type</label>
                <input className="text-input" list={`act-suggestions-${i}`}
                  value={a.activity_type}
                  onChange={e => {
                    const next = e.target.value
                    const patch = { activity_type: next }
                    if (!a.categoryTouched) patch.category = suggestCategory(next)
                    setActivity(i, patch)
                  }}
                  placeholder="Tajweed lesson" required />
                <datalist id={`act-suggestions-${i}`}>
                  {ACTIVITY_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="form-row">
                <label className="info-label">Category</label>
                <select className="text-input"
                  value={a.category}
                  onChange={e => setActivity(i, { category: e.target.value, categoryTouched: true })}>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <div className="form-hint" style={{ marginTop: 6 }}>
                  {CATEGORIES.find(c => c.value === a.category)?.hint}
                  {a.category === 'other' && (
                    <> <strong style={{ color: 'var(--accent-warning, #e0a84a)' }}>
                      — hours won't count toward the 132-hour standard.
                    </strong></>
                  )}
                </div>
              </div>
            </div>

            <div className="entry-mode-tabs">
              <button type="button"
                className={`entry-mode-tab ${a.entryMode === 'hours' ? 'active' : ''}`}
                onClick={() => setActivity(i, { entryMode: 'hours' })}>
                Enter hours
              </button>
              <button type="button"
                className={`entry-mode-tab ${a.entryMode === 'times' ? 'active' : ''}`}
                onClick={() => setActivity(i, { entryMode: 'times' })}>
                Enter start/end time
              </button>
            </div>

            {a.entryMode === 'hours' ? (
              <div className="form-row">
                <label className="info-label">Hours</label>
                <input type="number" step="0.25" min="0" max="24" className="text-input"
                  value={a.hours}
                  onChange={e => setActivity(i, { hours: e.target.value })}
                  placeholder="2.5" />
              </div>
            ) : (
              <>
                <div className="form-row-grid">
                  <div className="form-row">
                    <label className="info-label">Start</label>
                    <input type="time" className="text-input"
                      value={a.start_time}
                      onChange={e => setActivity(i, { start_time: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <label className="info-label">End</label>
                    <input type="time" className="text-input"
                      value={a.end_time}
                      onChange={e => setActivity(i, { end_time: e.target.value })} />
                  </div>
                </div>
                {a.start_time && a.end_time && (
                  <div className="form-hint" style={{ marginTop: -10, marginBottom: 14 }}>
                    = {hoursFromTimes(a.start_time, a.end_time)} hours
                  </div>
                )}
              </>
            )}

            <div className="form-row-grid">
              <div className="form-row">
                <label className="info-label">Students (optional)</label>
                <input type="number" min="0" className="text-input"
                  value={a.students_count}
                  onChange={e => setActivity(i, { students_count: e.target.value })}
                  placeholder="25" />
              </div>
              <div className="form-row">
                <label className="info-label">Location (optional)</label>
                <input className="text-input"
                  value={a.location}
                  onChange={e => setActivity(i, { location: e.target.value })}
                  placeholder="Main masjid" />
              </div>
            </div>

            <div className="form-row">
              <label className="info-label">Details (optional)</label>
              <textarea className="text-input" rows={3}
                value={a.notes}
                onChange={e => setActivity(i, { notes: e.target.value })}
                placeholder="e.g. what was taught, what was prepared, who you visited, or any context you want to share" />
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addActivity}
          style={{ width: '100%' }}>
          + Add another activity
        </button>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 className="section-title" style={{ marginBottom: 14 }}>Photos, videos, voice notes</h2>
        <p className="form-hint" style={{ marginBottom: 14 }}>
          Optional — share media from your day. Max 50 MB per file.
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
                  Remove
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
            {dragOver ? 'Drop to add' : 'Drag files here, or click to browse'}
          </div>
          <div className="dropzone-sub">
            Images, videos, voice notes · up to 50 MB each
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
                  {(f.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <button type="button" className="file-clear"
                  onClick={() => setMediaFiles(list => list.filter((_, idx) => idx !== i))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: 20 }}>
          <div className="info-label" style={{ marginBottom: 8 }}>Or paste a link (YouTube, Facebook, etc.)</div>
          <div className="link-row">
            <input className="text-input" placeholder="https://..."
              value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
            <input className="text-input" placeholder="Short caption"
              value={linkCaption} onChange={e => setLinkCaption(e.target.value)} />
            <button type="button" className="btn btn-secondary"
              onClick={() => {
                const u = linkUrl.trim()
                if (!u) return
                setLinks(arr => [...arr, { url: u, caption: linkCaption.trim() || null }])
                setLinkUrl(''); setLinkCaption('')
              }}>
              Add link
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
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label className="info-label" htmlFor="overall">Overall summary (optional)</label>
          <textarea id="overall" className="text-input" rows={6}
            value={overallText} onChange={e => setOverallText(e.target.value)}
            placeholder="A few sentences about the day — how it went, what Allah made easy, any reflections" />
        </div>
      </div>

      {error && (
        <div className="alert-card" style={{ marginBottom: 16 }}>
          <div className="alert-title">{error}</div>
        </div>
      )}

      <div className="action-row">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? (status || submittingText) : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
