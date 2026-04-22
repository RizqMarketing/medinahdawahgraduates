import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ReportForm from './ReportForm.jsx'
import {
  getMyGraduate, getReportForEditBySlugAndDate, updateReport, replaceActivities,
  uploadReportMedia, insertReportMediaRows, deleteReportMediaItem,
} from '../../lib/api.js'

export default function ReportEdit() {
  const { t } = useTranslation()
  const { slug, date } = useParams()
  const nav = useNavigate()
  const [graduate, setGraduate] = useState(null)
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    Promise.all([getMyGraduate(), getReportForEditBySlugAndDate(slug, date)])
      .then(([g, report]) => {
        if (!g) throw new Error(t('reportPages.noRecord'))
        if (report.graduate_id !== g.id) {
          throw new Error(t('reportPages.notOwnReport'))
        }
        setGraduate(g)
        setState({ status: 'ok', data: report, error: null })
      })
      .catch(error => setState({ status: 'error', data: null, error }))
  }, [slug, date])

  const handleSubmit = async ({
    report_date, overall_text, activities,
    newMediaFiles, newLinks, removedMediaIds, setStatus,
  }) => {
    if (!graduate || !state.data) throw new Error(t('reportPages.notLoadedYet'))
    const reportId = state.data.id

    setStatus?.(t('reportPages.savingShort'))
    await updateReport(reportId, { report_date, overall_text })
    await replaceActivities(reportId, activities)

    for (const mediaId of removedMediaIds) {
      const item = state.data.media?.find(m => m.id === mediaId)
      setStatus?.(t('reportPages.removingMedia'))
      try { await deleteReportMediaItem(mediaId, item?.storage_path || null) }
      catch (err) { console.error('Remove failed:', err) }
    }

    const mediaRows = []
    for (let i = 0; i < newMediaFiles.length; i++) {
      const m = newMediaFiles[i]
      const file = m.file || m
      const proofType = m.proof_type || null
      setStatus?.(t('reportPages.uploadingOfTotal', { current: i + 1, total: newMediaFiles.length }))
      try {
        const { storage_path, kind } = await uploadReportMedia({
          graduateId: graduate.id,
          reportId,
          file,
        })
        mediaRows.push({
          report_id: reportId,
          kind,
          storage_path,
          caption: null,
          proof_type: kind === 'video' ? proofType : null,
        })
      } catch (err) { console.error('Upload failed:', err) }
    }
    for (const l of newLinks) {
      mediaRows.push({ report_id: reportId, kind: 'link', external_url: l.url, caption: l.caption || null })
    }
    if (mediaRows.length) {
      setStatus?.(t('reportPages.savingMedia'))
      try { await insertReportMediaRows(mediaRows) }
      catch (err) { console.error('Media insert failed:', err) }
    }

    nav(`/graduate/${graduate.slug}/reports/${report_date}`, { replace: true })
  }

  if (state.status === 'loading') {
    return <div className="page"><div className="container"><p className="page-subtitle">{t('reportPages.loadingShort')}</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('reportPages.couldNotLoadReport')}</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 12 }}>
            {state.error?.message || String(state.error)}
          </pre>
        </div>
      </div></div>
    )
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <button onClick={() => nav(-1)} className="back-link">{t('reportPages.backHome')}</button>
        <p className="eyebrow">{t('reportPages.eyebrow')}</p>
        <h1 className="page-title">{t('reportPages.editTitle')}</h1>
        <p className="page-subtitle" style={{ marginBottom: 28 }}>
          {t('reportPages.editSubtitleShort')}
        </p>

        <ReportForm
          mode="edit"
          initial={state.data}
          graduate={graduate}
          submitLabel={t('reportForm.saveLabel')}
          submittingText={t('reportForm.savingLabel')}
          onSubmit={handleSubmit}
          onCancel={() => nav(-1)}
        />
      </div>
    </div>
  )
}
