import { useNavigate } from 'react-router-dom'
import GraduateForm from './GraduateForm.jsx'
import { createGraduate, uploadGraduatePhoto } from '../../lib/api.js'

export default function AdminGraduateNew() {
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
        <button onClick={() => nav(-1)} className="back-link">← Back</button>
        <p className="eyebrow">Admin</p>
        <h1 className="page-title">Add graduate</h1>
        <p className="page-subtitle" style={{ marginBottom: 32 }}>
          Enter the record. A login account can be created later from the graduate's profile.
        </p>

        <GraduateForm
          submitLabel="Add graduate"
          onSubmit={handleSubmit}
          onCancel={() => nav('/admin')}
        />
      </div>
    </div>
  )
}
