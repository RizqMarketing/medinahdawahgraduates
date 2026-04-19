import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import GraduateForm from './GraduateForm.jsx'
import { getGraduateBySlug, updateGraduate, uploadGraduatePhoto } from '../../lib/api.js'

export default function AdminGraduateEdit() {
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
    return <div className="page"><div className="container"><p className="page-subtitle">Loading…</p></div></div>
  }
  if (state.status === 'error') {
    return (
      <div className="page"><div className="container">
        <div className="alert-card">
          <div className="alert-title">Could not load graduate</div>
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
        <button onClick={() => nav(-1)} className="back-link">← Back</button>
        <p className="eyebrow">Admin</p>
        <h1 className="page-title">Edit graduate</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          Update {state.data.full_name}'s record.
        </p>

        <GraduateForm
          initial={state.data}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => nav(`/admin/graduates/${state.data.slug}`)}
        />
      </div>
    </div>
  )
}
