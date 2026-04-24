import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase.js'

export default function ResetPassword() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError(t('auth.reset.tooShort'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.reset.mismatch'))
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      // Sign out so the user re-enters with the new password — avoids
      // lingering recovery session state on the main app.
      await supabase.auth.signOut()
      setTimeout(() => nav('/login', { replace: true }), 1800)
    } catch (err) {
      setError(err.message || t('auth.reset.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 440 }}>
        <p className="eyebrow">{t('auth.reset.eyebrow')}</p>
        <h1 className="page-title">{t('auth.reset.title')}</h1>
        <p className="page-subtitle">{t('auth.reset.subtitle')}</p>

        {!done && (
          <form onSubmit={handleSubmit} className="card" style={{ marginTop: 32, padding: 28 }}>
            <label className="info-label" htmlFor="password">{t('auth.reset.newPasswordLabel')}</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="text-input"
              style={{ marginTop: 6, marginBottom: 20 }}
            />

            <label className="info-label" htmlFor="confirm">{t('auth.reset.confirmLabel')}</label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="text-input"
              style={{ marginTop: 6, marginBottom: 24 }}
            />

            {error && (
              <div className="alert-card" style={{ marginBottom: 20 }}>
                <div className="alert-title">{t('auth.reset.failed')}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {submitting ? t('auth.reset.saving') : t('auth.reset.saveButton')}
            </button>

            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <Link to="/login" style={{ fontSize: 13, opacity: 0.75 }}>
                {t('auth.forgot.backToLogin')}
              </Link>
            </div>
          </form>
        )}

        {done && (
          <div className="card" style={{ marginTop: 32, padding: 28 }}>
            <h2 style={{ margin: 0, marginBottom: 12 }}>{t('auth.reset.successTitle')}</h2>
            <p style={{ margin: 0, opacity: 0.85, lineHeight: 1.6 }}>
              {t('auth.reset.successBody')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
