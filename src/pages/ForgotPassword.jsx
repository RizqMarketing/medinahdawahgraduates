import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase.js'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || t('auth.forgot.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 440 }}>
        <p className="eyebrow">{t('auth.forgot.eyebrow')}</p>
        <h1 className="page-title">{t('auth.forgot.title')}</h1>
        <p className="page-subtitle">{t('auth.forgot.subtitle')}</p>

        {!sent && (
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

            {error && (
              <div className="alert-card" style={{ marginBottom: 20 }}>
                <div className="alert-title">{t('auth.forgot.failed')}</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {submitting ? t('auth.forgot.sending') : t('auth.forgot.sendButton')}
            </button>

            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <Link to="/login" style={{ fontSize: 13, opacity: 0.75 }}>
                {t('auth.forgot.backToLogin')}
              </Link>
            </div>
          </form>
        )}

        {sent && (
          <div className="card" style={{ marginTop: 32, padding: 28 }}>
            <h2 style={{ margin: 0, marginBottom: 12 }}>{t('auth.forgot.sentTitle')}</h2>
            <p style={{ margin: 0, opacity: 0.85, lineHeight: 1.6 }}>
              {t('auth.forgot.sentBody', { email })}
            </p>
            <div style={{ marginTop: 24 }}>
              <Link to="/login" className="btn btn-secondary">
                {t('auth.forgot.backToLogin')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
