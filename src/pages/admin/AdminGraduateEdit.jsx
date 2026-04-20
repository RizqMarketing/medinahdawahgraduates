import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import GraduateForm from './GraduateForm.jsx'
import { getGraduateBySlug, updateGraduate, uploadGraduatePhoto } from '../../lib/api.js'

export default function AdminGraduateEdit() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const nav = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    getGraduateBySlug(slug)
      .then(data => setState({ status: 'ok', data, error: null }))
      .catch(error => setState({ status: 'error', data: null, error }))
  }, [slug])

  const handleSubmit = async (payload) => {
    const { photoFile, ...rest } = payload
    let changes = { ...rest }
    if (photoFile) {
      changes.photo_url = await uploadGraduatePhoto(photoFile)
    }
    const updated = await updateGraduate(state.data.id, changes)
    nav(`/admin/graduates/${updated.slug}`, { replace: true })
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

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <button onClick={() => nav(-1)} className="back-link">{t('adminGradForm.backLink')}</button>
        <p className="eyebrow">{t('adminGradForm.eyebrow')}</p>
        <h1 className="page-title">{t('adminGradForm.editTitle')}</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          {t('adminGradForm.editSubtitle')}
        </p>

        <GraduateForm
          initial={state.data}
          submitLabel={t('adminGradForm.submitSave')}
          onSubmit={handleSubmit}
          onCancel={() => nav(`/admin/graduates/${state.data.slug}`)}
        />
      </div>
    </div>
  )
}
