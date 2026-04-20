import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import GraduateForm from './GraduateForm.jsx'
import { createGraduate, uploadGraduatePhoto } from '../../lib/api.js'

export default function AdminGraduateNew() {
  const { t } = useTranslation()
  const nav = useNavigate()

  const handleSubmit = async (payload) => {
    const { photoFile, ...rest } = payload
    let photo_url = null
    if (photoFile) photo_url = await uploadGraduatePhoto(photoFile)

    await createGraduate({ ...rest, photo_url })
    nav('/admin', { replace: true })
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <button onClick={() => nav(-1)} className="back-link">{t('adminGradForm.backLink')}</button>
        <p className="eyebrow">{t('adminGradForm.eyebrow')}</p>
        <h1 className="page-title">{t('adminGradForm.addTitle')}</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          {t('adminGradForm.addSubtitle')}
        </p>

        <GraduateForm
          submitLabel={t('adminGradForm.submitAdd')}
          onSubmit={handleSubmit}
          onCancel={() => nav('/admin')}
        />
      </div>
    </div>
  )
}
