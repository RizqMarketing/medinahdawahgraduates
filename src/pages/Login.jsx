import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext.jsx'

const roleHome = {
  admin: '/admin',
  sponsor: '/sponsor',
  graduate: '/graduate-home',
}

function rolePrefixFor(path) {
  if (!path) return null
  if (path.startsWith('/admin')) return 'admin'
  if (path.startsWith('/sponsor')) return 'sponsor'
  if (path.startsWith('/graduate-home') || path.startsWith('/reports')) return 'graduate'
  return null
}

export default function Login() {
  const { t } = useTranslation()
  const { signIn, session, role, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const nav = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  if (session && role && !loading) {
    const fromRole = rolePrefixFor(from)
    const destination = (from && (!fromRole || fromRole === role))
      ? from
      : (roleHome[role] || '/')
    return <Navigate to={destination} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err.message || t('auth.couldNotSignIn'))
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 440 }}>
        <p className="eyebrow">{t('auth.eyebrow')}</p>
        <h1 className="page-title">{t('auth.title')}</h1>
        <p className="page-subtitle">
          {t('auth.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 32, padding: 28 }}>
          <label className="info-label" htmlFor="email">{t('auth.emailLabel')}</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="text-input"
            style={{ marginTop: 6, marginBottom: 20 }}
          />

          <label className="info-label" htmlFor="password">{t('auth.passwordLabel')}</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="text-input"
            style={{ marginTop: 6, marginBottom: 24 }}
          />

          {error && (
            <div className="alert-card" style={{ marginBottom: 20 }}>
              <div className="alert-title">{t('auth.signInFailed')}</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {submitting ? t('auth.signingIn') : t('auth.signInButton')}
          </button>
        </form>
      </div>
    </div>
  )
}
