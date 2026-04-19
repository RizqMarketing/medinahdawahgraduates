import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SponsorForm from './SponsorForm.jsx'
import { getSponsorById, updateSponsor } from '../../lib/api.js'

export default function AdminSponsorEdit() {
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
    return <div className="page"><div className="container"><p className="page-subtitle">Loading…</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">Could not load sponsor</div>
        </div>
      </div></div>
    )
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <button onClick={() => nav(-1)} className="back-link">← Back</button>
        <p className="eyebrow">Admin</p>
        <h1 className="page-title">Edit sponsor</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          Update {state.data.full_name}'s record.
        </p>

        <SponsorForm
          initial={state.data}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => nav(`/admin/sponsors/${id}`)}
        />
      </div>
    </div>
  )
}
