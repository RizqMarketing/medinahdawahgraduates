import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SponsorForm from './SponsorForm.jsx'
import { getSponsorById, updateSponsor } from '../../lib/api.js'

export default function AdminSponsorEdit() {
  const { t } = useTranslation()
  const { id } = useParams()
  const nav = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  useEffect(() => {
    getSponsorById(id)
      .then(data => setState({ status: 'ok', data, error: null }))
      .catch(error => setState({ status: 'error', data: null, error }))
  }, [id])

  const handleSubmit = async (payload) => {
    await updateSponsor(id, payload)
    nav(`/admin/sponsors/${id}`, { replace: true })
  }

  if (state.status === 'loading') {
    return <div className="page"><div className="container"><p className="page-subtitle">{t('adminSponsorDetail.loading')}</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">{t('adminSponsorDetail.couldNotLoad')}</div>
        </div>
      </div></div>
    )
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <button onClick={() => nav(-1)} className="back-link">{t('adminSponsorForm.back')}</button>
        <p className="eyebrow">{t('adminGradForm.eyebrow')}</p>
        <h1 className="page-title">{t('adminSponsorForm.editTitle')}</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          {t('adminSponsorForm.editSubtitle')}
        </p>

        <SponsorForm
          initial={state.data}
          submitLabel={t('adminSponsorForm.submitSave')}
          onSubmit={handleSubmit}
          onCancel={() => nav(`/admin/sponsors/${id}`)}
        />
      </div>
    </div>
  )
}
