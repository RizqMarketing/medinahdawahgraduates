import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
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

const QUICK_LOGINS = [
  { label: 'Log in as graduate', email: 'graduate@mdg.test', password: 'Graduate123!' },
  { label: 'Log in as admin',    email: 'admin@mdg.test',    password: 'Admin123!' },
  { label: 'Log in as sponsor',  email: 'sponsor@mdg.test',  password: 'Sponsor123!' },
]

export default function Login() {
  const { signIn, session, role, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [quickRole, setQuickRole] = useState('')

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
      setError(err.message || 'Could not sign in')
      setSubmitting(false)
    }
  }

  const handleQuickLogin = async (e) => {
    const choice = QUICK_LOGINS.find(q => q.label === e.target.value)
    setQuickRole(e.target.value)
    if (!choice) return
    setError(null)
    setSubmitting(true)
    try {
      await signIn(choice.email, choice.password)
    } catch (err) {
      setError(err.message || 'Could not sign in')
      setSubmitting(false)
      setQuickRole('')
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 440 }}>
        <p className="eyebrow">Sign in</p>
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">
          Assalamu alaykum. Enter your credentials to continue.
        </p>

        <div className="card" style={{ marginTop: 32, padding: 20, background: 'var(--surface-2, rgba(255,255,255,0.03))' }}>
          <label className="info-label" htmlFor="quick-login">Preview — quick sign-in</label>
          <select
            id="quick-login"
            className="text-input"
            value={quickRole}
            onChange={handleQuickLogin}
            disabled={submitting}
            style={{ marginTop: 6 }}
          >
            <option value="">Choose a role to preview…</option>
            {QUICK_LOGINS.map(q => (
              <option key={q.label} value={q.label}>{q.label}</option>
            ))}
          </select>
          <p style={{ fontSize: 12, opacity: 0.7, marginTop: 10, marginBottom: 0 }}>
            Or use your own credentials below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16, padding: 28 }}>
          <label className="info-label" htmlFor="email">Email</label>
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

          <label className="info-label" htmlFor="password">Password</label>
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
              <div className="alert-title">Sign-in failed</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
