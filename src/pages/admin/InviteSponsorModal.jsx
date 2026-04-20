import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { inviteUser } from '../../lib/api.js'
import { useModalBackButton } from '../../lib/useModalBackButton.js'

export default function InviteSponsorModal({ sponsor, onClose, onInvited }) {
  const { t } = useTranslation()
  useModalBackButton(onClose)
  const [stage, setStage] = useState('form')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState(sponsor.phone || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const loginUrl = `${window.location.origin}/login`

  const handleInvite = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await inviteUser({
        email: email.trim().toLowerCase(),
        full_name: sponsor.full_name,
        role: 'sponsor',
        phone: phone.trim() || null,
        country: sponsor.country || null,
        sponsor_id: sponsor.id,
      })
      setResult(res)
      setStage('result')
      onInvited?.(res)
    } catch (err) {
      setError(err?.message || t('invite.couldNotCreate'))
    } finally {
      setSubmitting(false)
    }
  }

  const whatsappMessage = result
    ? t('invite.waMsgSponsor', {
        name: sponsor.full_name,
        loginUrl,
        email: result.email,
        password: result.temp_password,
      })
    : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t('invite.copyFailed'))
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>×</button>

        {stage === 'form' && (
          <>
            <h2 className="modal-title">{t('invite.createLoginFor', { name: sponsor.full_name })}</h2>
            <p className="modal-subtitle">{t('invite.formHint')}</p>

            <form onSubmit={handleInvite}>
              <div className="form-row">
                <label className="info-label" htmlFor="invite_email">{t('invite.emailLabel')}</label>
                <input id="invite_email" type="email" required
                  className="text-input" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('invite.emailPlaceholder')} autoFocus dir="ltr" />
              </div>

              <div className="form-row">
                <label className="info-label" htmlFor="invite_phone">{t('invite.phoneOptional')}</label>
                <input id="invite_phone" type="tel"
                  className="text-input" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={t('invite.phonePlaceholder')} dir="ltr" />
              </div>

              {error && (
                <div className="alert-card" style={{ marginBottom: 16 }}>
                  <div className="alert-title">{error}</div>
                </div>
              )}

              <div className="action-row" style={{ marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? t('invite.creating') : t('invite.createAccount')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                  {t('invite.cancel')}
                </button>
              </div>
            </form>
          </>
        )}

        {stage === 'result' && result && (
          <>
            <h2 className="modal-title">{t('invite.accountCreated')}</h2>
            <p className="modal-subtitle">{t('invite.copyMessageHint', { name: sponsor.full_name })}</p>

            <pre className="whatsapp-preview">{whatsappMessage}</pre>

            <div className="action-row" style={{ marginTop: 4 }}>
              <button className="btn btn-primary" onClick={handleCopy}>
                {copied ? t('invite.copied') : t('invite.copyMessage')}
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                {t('invite.done')}
              </button>
            </div>

            <div className="form-hint" style={{ marginTop: 16 }}>
              {t('invite.tempPasswordHint', { password: result.temp_password })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
