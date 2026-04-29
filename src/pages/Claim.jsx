import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSignupTokenInfo, claimSignupToken } from '../lib/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import LoadingPage from '../components/LoadingPage.jsx'

export default function Claim() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { signIn } = useAuth()

  const token = params.get('token') || ''

  const [tokenStatus, setTokenStatus] = useState('loading') // loading | valid | invalid
  const [graduateName, setGraduateName] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!token) {
      setTokenStatus('invalid')
      return
    }
    ;(async () => {
      try {
        const info = await getSignupTokenInfo(token)
        if (cancelled) return
        if (!info) {
          setTokenStatus('invalid')
        } else {
          setGraduateName(info.full_name || '')
          setTokenStatus('valid')
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Token lookup failed:', err)
          setTokenStatus('invalid')
        }
      }
    })()
    return () => { cancelled = true }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError(t('claim.passwordTooShort'))
    if (password !== confirm) return setError(t('claim.passwordMismatch'))

    setSubmitting(true)
    try {
      await claimSignupToken({ token, email: email.trim().toLowerCase(), password })
      // Token consumed and account linked. Sign in so AuthContext picks up
      // the session, then route to the existing welcome / profile-completion
      // page (gated by RequireAuth role="graduate").
      await signIn(email.trim().toLowerCase(), password)
      nav('/welcome', { replace: true })
    } catch (err) {
      setError(err.message || t('claim.failed'))
      setSubmitting(false)
    }
  }

  if (tokenStatus === 'loading') return <LoadingPage />

  if (tokenStatus === 'invalid') {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 440 }}>
          <p className="eyebrow">{t('claim.eyebrow')}</p>
          <h1 className="page-title">{t('claim.invalidTitle')}</h1>
          <p className="page-subtitle">{t('claim.invalidBody')}</p>
          <div style={{ marginTop: 24 }}>
            <Link to="/login" className="btn btn-secondary">{t('auth.forgot.backToLogin')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 440 }}>
        <p className="eyebrow">{t('claim.eyebrow')}</p>
        <h1 className="page-title">{t('claim.title', { name: graduateName })}</h1>
        <p className="page-subtitle">{t('claim.subtitle')}</p>

        <form onSubmit={handleSubmit} className="card" style={{ marginTop: 32, padding: 28 }}>
          <label className="info-label" htmlFor="email">{t('claim.emailLabel')}</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="text-input"
            style={{ marginTop: 6, marginBottom: 20 }}
            dir="ltr"
          />

          <label className="info-label" htmlFor="password">{t('claim.passwordLabel')}</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="text-input"
            style={{ marginTop: 6, marginBottom: 20 }}
            dir="ltr"
          />

          <label className="info-label" htmlFor="confirm">{t('claim.confirmLabel')}</label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="text-input"
            style={{ marginTop: 6, marginBottom: 24 }}
            dir="ltr"
          />

          <p className="form-hint" style={{ marginTop: -12, marginBottom: 20, fontSize: 12 }}>
            {t('claim.passwordHint')}
          </p>

          {error && (
            <div className="alert-card" style={{ marginBottom: 20 }}>
              <div className="alert-title">{t('claim.failed')}</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {submitting ? t('claim.creating') : t('claim.submitButton')}
          </button>
        </form>
      </div>
    </div>
  )
}
