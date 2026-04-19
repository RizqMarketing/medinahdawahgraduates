import { useState } from 'react'
import { inviteUser } from '../../lib/api.js'

export default function InviteSponsorModal({ sponsor, onClose, onInvited }) {
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
      setError(err?.message || 'Could not create account')
    } finally {
      setSubmitting(false)
    }
  }

  const whatsappMessage = result ? (
`Assalamu alaykum akhi ${sponsor.full_name},

Your sponsor account is ready, alhamdulillah. You can now follow your graduate's daily reports.

Login: ${loginUrl}
Email: ${result.email}
Password: ${result.temp_password}

Please change your password after signing in.

Jazakallahu Khairan for your support.`
  ) : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed — please select the text manually')
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {stage === 'form' && (
          <>
            <h2 className="modal-title">Create login for {sponsor.full_name}</h2>
            <p className="modal-subtitle">
              Creates an account. You'll get a temp password to send via WhatsApp.
            </p>

            <form onSubmit={handleInvite}>
              <div className="form-row">
                <label className="info-label" htmlFor="invite_email">Email</label>
                <input id="invite_email" type="email" required
                  className="text-input" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="abdullah@example.com" autoFocus />
              </div>

              <div className="form-row">
                <label className="info-label" htmlFor="invite_phone">Phone (optional)</label>
                <input id="invite_phone" type="tel"
                  className="text-input" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+31..." />
              </div>

              {error && (
                <div className="alert-card" style={{ marginBottom: 16 }}>
                  <div className="alert-title">{error}</div>
                </div>
              )}

              <div className="action-row" style={{ marginTop: 4 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create account'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {stage === 'result' && result && (
          <>
            <h2 className="modal-title">Account created ✓</h2>
            <p className="modal-subtitle">
              Copy the message below and send it to {sponsor.full_name} via WhatsApp.
            </p>

            <pre className="whatsapp-preview">{whatsappMessage}</pre>

            <div className="action-row" style={{ marginTop: 4 }}>
              <button className="btn btn-primary" onClick={handleCopy}>
                {copied ? '✓ Copied' : 'Copy message'}
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Done
              </button>
            </div>

            <div className="form-hint" style={{ marginTop: 16 }}>
              Temp password: <code>{result.temp_password}</code> · save it somewhere safe until they've signed in.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
