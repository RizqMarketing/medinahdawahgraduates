import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReportForm from './ReportForm.jsx'
import {
  getMyGraduate, createReport,
  uploadReportMedia, insertReportMediaRows,
} from '../../lib/api.js'

export default function ReportNew() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [graduate, setGraduate] = useState(null)
  const [loadErr, setLoadErr] = useState(null)

  useEffect(() => {
    getMyGraduate()
      .then(g => {
        if (!g) throw new Error(t('reportPages.noRecord'))
        setGraduate(g)
      })
      .catch(err => setLoadErr(err))
  }, [])

  const handleSubmit = async ({ report_date, overall_text, activities, newMediaFiles, newLinks, setStatus }) => {
    if (!graduate) throw new Error(t('reportPages.noRecordYet'))

    const report = await createReport({
      graduate_id: graduate.id,
      report_date,
      location: null,
      overall_text,
      activities,
    })

    const mediaRows = []
    for (let i = 0; i < newMediaFiles.length; i++) {
      const m = newMediaFiles[i]
      const file = m.file || m
      const proofType = m.proof_type || null
      setStatus?.(t('reportPages.uploadingOfTotal', { current: i + 1, total: newMediaFiles.length }))
      try {
        const { storage_path, kind } = await uploadReportMedia({
          graduateId: graduate.id,
          reportId: report.id,
          file,
        })
        mediaRows.push({
          report_id: report.id,
          kind,
          storage_path,
          caption: null,
          proof_type: kind === 'video' ? proofType : null,
        })
      } catch (err) { console.error('Upload failed:', err) }
    }
    for (const l of newLinks) {
      mediaRows.push({ report_id: report.id, kind: 'link', external_url: l.url, caption: l.caption || null })
    }
    if (mediaRows.length) {
      setStatus?.(t('reportPages.savingMedia'))
      try { await insertReportMediaRows(mediaRows) }
      catch (err) { console.error('Media insert failed:', err) }
    }

    nav(`/graduate/${graduate.slug}/reports/${report.report_date}`, { replace: true })
  }

  if (loadErr) {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('reportPages.couldNotLoad')}</div>
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
        <button onClick={() => nav('/graduate-home')} className="back-link">{t('reportPages.backHome')}</button>
        <p className="eyebrow">{t('reportPages.eyebrow')}</p>
        <h1 className="page-title">{t('reportPages.newTitle')}</h1>
        <p className="page-subtitle" style={{ marginBottom: 28 }}>
          {t('reportPages.newSubtitle')}
        </p>

        <ReportForm
          mode="new"
          graduate={graduate}
          submitLabel={t('reportForm.submitReport')}
          submittingText={t('reportForm.submittingDefault')}
          onSubmit={handleSubmit}
          onCancel={() => nav('/graduate-home')}
        />
      </div>
    </div>
  )
}
