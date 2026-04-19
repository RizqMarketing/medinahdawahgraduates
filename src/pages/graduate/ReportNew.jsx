import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReportForm from './ReportForm.jsx'
import {
  getMyGraduate, createReport,
  uploadReportMedia, insertReportMediaRows,
} from '../../lib/api.js'

export default function ReportNew() {
  const nav = useNavigate()
  const [graduate, setGraduate] = useState(null)
  const [loadErr, setLoadErr] = useState(null)

  useEffect(() => {
    getMyGraduate()
      .then(g => {
        if (!g) throw new Error('Your graduate record could not be found. Please contact admin.')
        setGraduate(g)
      })
      .catch(err => setLoadErr(err))
  }, [])

  const handleSubmit = async ({ report_date, overall_text, activities, newMediaFiles, newLinks, setStatus }) => {
    if (!graduate) throw new Error('Your graduate record is not loaded yet')

    const report = await createReport({
      graduate_id: graduate.id,
      report_date,
      location: null,
      overall_text,
      activities,
    })

    const mediaRows = []
    for (let i = 0; i < newMediaFiles.length; i++) {
      setStatus?.(`Uploading file ${i + 1} of ${newMediaFiles.length}…`)
      try {
        const { storage_path, kind } = await uploadReportMedia({
          graduateId: graduate.id,
          reportId: report.id,
          file: newMediaFiles[i],
        })
        mediaRows.push({ report_id: report.id, kind, storage_path, caption: null })
      } catch (err) { console.error('Upload failed:', err) }
    }
    for (const l of newLinks) {
      mediaRows.push({ report_id: report.id, kind: 'link', external_url: l.url, caption: l.caption || null })
    }
    if (mediaRows.length) {
      setStatus?.('Saving media…')
      try { await insertReportMediaRows(mediaRows) }
      catch (err) { console.error('Media insert failed:', err) }
    }

    nav(`/graduate/${graduate.slug}/reports/${report.report_date}`, { replace: true })
  }

  if (loadErr) {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">Could not load your record</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {loadErr.message}
          </pre>
        </div>
      </div></div>
    )
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <button onClick={() => nav('/graduate-home')} className="back-link">← Back</button>
        <p className="eyebrow">Daily report</p>
        <h1 className="page-title">Submit report</h1>
        <p className="page-subtitle" style={{ marginBottom: 28 }}>
          Record your dawah work — teaching, preparation, visits, or anything you gave to the ummah.
        </p>

        <ReportForm
          mode="new"
          submitLabel="Submit report"
          submittingText="Submitting…"
          onSubmit={handleSubmit}
          onCancel={() => nav('/graduate-home')}
        />
      </div>
    </div>
  )
}
