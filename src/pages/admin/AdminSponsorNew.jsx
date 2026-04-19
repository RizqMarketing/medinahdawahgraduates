import { useNavigate } from 'react-router-dom'
import SponsorForm from './SponsorForm.jsx'
import { createSponsor } from '../../lib/api.js'

export default function AdminSponsorNew() {
  const nav = useNavigate()

  const handleSubmit = async (payload) => {
    const sponsor = await createSponsor(payload)
    nav(`/admin/sponsors/${sponsor.id}`, { replace: true })
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <button onClick={() => nav('/admin/sponsors')} className="back-link">← Back to sponsors</button>
        <p className="eyebrow">Admin</p>
        <h1 className="page-title">Add sponsor</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          Create the record. A login account can be created later from the sponsor's detail page.
        </p>

        <SponsorForm
          submitLabel="Add sponsor"
          onSubmit={handleSubmit}
          onCancel={() => nav('/admin/sponsors')}
        />
      </div>
    </div>
  )
}
