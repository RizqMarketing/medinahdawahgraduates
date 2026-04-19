import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function RequireAuth({ role, children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page"><div className="container">
        <p className="page-subtitle">Loading…</p>
      </div></div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && profile?.role !== role) {
    return (
      <div className="page"><div className="container">
        <p className="eyebrow">Access denied</p>
        <h1 className="page-title">This isn't your page</h1>
        <p className="page-subtitle">
          You're signed in as <strong>{profile?.role || 'unknown'}</strong>.
          Please return to your dashboard.
        </p>
      </div></div>
    )
  }

  return children
}
