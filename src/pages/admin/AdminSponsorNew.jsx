import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SponsorForm from './SponsorForm.jsx'
import { createSponsor } from '../../lib/api.js'

export default function AdminSponsorNew() {
  const { t } = useTranslation()
  const nav = useNavigate()

  const handleSubmit = async (payload) => {
    const sponsor = await createSponsor(payload)
    nav(`/admin/sponsors/${sponsor.id}`, { replace: true })
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <button onClick={() => nav('/admin/sponsors')} className="back-link">{t('adminSponsorDetail.backToSponsors')}</button>
        <p className="eyebrow">{t('adminGradForm.eyebrow')}</p>
        <h1 className="page-title">{t('adminSponsorForm.addTitle')}</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          {t('adminSponsorForm.addSubtitle')}
        </p>

        <SponsorForm
          submitLabel={t('adminSponsorForm.submitAdd')}
          onSubmit={handleSubmit}
          onCancel={() => nav('/admin/sponsors')}
        />
      </div>
    </div>
  )
}
