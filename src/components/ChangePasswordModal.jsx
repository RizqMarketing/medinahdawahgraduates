import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase.js'
import { useModalBackButton } from '../lib/useModalBackButton.js'

export default function ChangePasswordModal({ onClose }) {
  const { t } = useTranslation()
  useModalBackButton(onClose)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError(t('auth.change.tooShort'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.change.mismatch'))
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
    } catch (err) {
      setError(err.message || t('auth.change.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>×</button>

        {!done && (
          <>
            <h2 className="modal-title">{t('auth.change.title')}</h2>
            <p className="modal-subtitle">{t('auth.change.subtitle')}</p>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <label className="info-label" htmlFor="cp_password">{t('auth.change.newPasswordLabel')}</label>
                <input
                  id="cp_password"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="text-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                  dir="ltr"
                />
              </div>

              <div className="form-row">
                <label className="info-label" htmlFor="cp_confirm">{t('auth.change.confirmLabel')}</label>
                <input
                  id="cp_confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  className="text-input"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  dir="ltr"
                />
              </div>

              {error && (
                <div className="alert-card" style={{ marginBottom: 16 }}>
                  <div className="alert-title">{error}</div>
                </div>
              )}

              <div className="action-row" style={{ marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? t('auth.change.saving') : t('auth.change.saveButton')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                  {t('auth.change.cancel')}
                </button>
              </div>
            </form>
          </>
        )}

        {done && (
          <>
            <h2 className="modal-title">{t('auth.change.successTitle')}</h2>
            <p className="modal-subtitle">{t('auth.change.successBody')}</p>

            <div className="action-row" style={{ marginTop: 4 }}>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                {t('common.close')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
