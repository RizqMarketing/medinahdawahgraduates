import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import GraduateForm from './GraduateForm.jsx'
import InviteGraduateModal from './InviteGraduateModal.jsx'
import { createGraduate, uploadGraduatePhoto } from '../../lib/api.js'

export default function AdminGraduateNew() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [createdGraduate, setCreatedGraduate] = useState(null)

  const handleSubmit = async (payload) => {
    const { photoFile, ...rest } = payload
    let photo_url = null
    if (photoFile) photo_url = await uploadGraduatePhoto(photoFile)

    const created = await createGraduate({ ...rest, photo_url })
    setCreatedGraduate(created)
  }

  const closeAndContinue = () => {
    if (createdGraduate?.slug) {
      nav(`/admin/graduates/${createdGraduate.slug}`, { replace: true })
    } else {
      nav('/admin', { replace: true })
    }
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
          mode="new"
          submitLabel={t('adminGradForm.submitAdd')}
          onSubmit={handleSubmit}
          onCancel={() => nav('/admin')}
        />
      </div>

      {createdGraduate && (
        <InviteGraduateModal
          graduate={createdGraduate}
          onClose={closeAndContinue}
        />
      )}
    </div>
  )
}
