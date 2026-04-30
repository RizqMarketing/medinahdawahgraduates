import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { bulkInviteGraduates } from '../../lib/api.js'

// Parse the textarea: one graduate per line, comma-separated:
//   "Mohammed Ali, +9665..., Indonesia"
//   "Yusuf Khan, , Pakistan"            <- empty phone allowed
//   "Ibrahim Bin Hassan, Sudan"         <- 2 cols: name + country, no phone
function parseRows(raw) {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const rows = []
  const errors = []
  lines.forEach((line, idx) => {
    const parts = line.split(',').map(p => p.trim())
    let full_name = '', phone = '', country = ''
    if (parts.length === 2) {
      full_name = parts[0]; country = parts[1]
    } else if (parts.length >= 3) {
      full_name = parts[0]; phone = parts[1]; country = parts[2]
    } else {
      errors.push({ line: idx + 1, raw: line, error: 'Need at least name + country' })
      return
    }
    if (!full_name) {
      errors.push({ line: idx + 1, raw: line, error: 'Missing name' }); return
    }
    if (!country) {
      errors.push({ line: idx + 1, raw: line, error: 'Missing country' }); return
    }
    rows.push({ full_name, phone: phone || null, country })
  })
  return { rows, errors }
}

export default function AdminBulkInvite() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [raw, setRaw] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [copiedIdx, setCopiedIdx] = useState(null)

  const parsed = useMemo(() => parseRows(raw), [raw])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (parsed.rows.length === 0) {
      setError(t('bulkInvite.noValidRows'))
      return
    }
    setSubmitting(true)
    try {
      const res = await bulkInviteGraduates(parsed.rows)
      setResult(res)
    } catch (err) {
      setError(err.message || t('bulkInvite.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const buildWaMessage = (row) => t('bulkInvite.waMsg', {
    name: row.full_name,
    signupUrl: row.signup_url,
  })

  const handleCopy = async (idx, row) => {
    try {
      await navigator.clipboard.writeText(buildWaMessage(row))
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(prev => prev === idx ? null : prev), 2000)
    } catch {
      setError(t('bulkInvite.copyFailed'))
    }
  }

  const handleWhatsAppOpen = (row) => {
    const message = buildWaMessage(row)
    const phoneClean = (row.phone || '').replace(/[^\d]/g, '')
    const url = phoneClean
      ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <button onClick={() => nav(-1)} className="back-link">{t('bulkInvite.backLink')}</button>
        <p className="eyebrow">{t('bulkInvite.eyebrow')}</p>
        <h1 className="page-title">{t('bulkInvite.title')}</h1>
        <p className="page-subtitle" style={{ marginBottom: 24 }}>
          {t('bulkInvite.subtitle')}
        </p>

        {!result && (
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <label className="info-label" htmlFor="bulk_paste">
                {t('bulkInvite.pasteLabel')}
              </label>
              <p className="form-hint" style={{ margin: '6px 0 12px', fontSize: 13 }}>
                {t('bulkInvite.pasteHint')}
              </p>
              <pre className="form-hint" style={{
                margin: '0 0 12px', fontSize: 12, opacity: 0.75,
                background: 'rgba(255,255,255,0.04)', padding: 10, borderRadius: 6,
              }}>{t('bulkInvite.pasteExample')}</pre>
              <textarea
                id="bulk_paste"
                rows={10}
                value={raw}
                onChange={e => setRaw(e.target.value)}
                className="text-input"
                style={{ width: '100%', fontFamily: 'monospace', fontSize: 14 }}
                placeholder={t('bulkInvite.pastePlaceholder')}
                dir="ltr"
                autoFocus
              />

              <div style={{ marginTop: 16, fontSize: 13, opacity: 0.85 }}>
                {t('bulkInvite.preview', { valid: parsed.rows.length, invalid: parsed.errors.length })}
              </div>

              {parsed.errors.length > 0 && (
                <ul style={{ marginTop: 12, fontSize: 12, color: '#ffb4a8', paddingLeft: 18 }}>
                  {parsed.errors.map((e, i) => (
                    <li key={i}>
                      {t('bulkInvite.lineError', { line: e.line, error: e.error })}: <code>{e.raw}</code>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <div className="alert-card" style={{ marginBottom: 16 }}>
                <div className="alert-title">{error}</div>
              </div>
            )}

            <div className="action-row">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || parsed.rows.length === 0}
              >
                {submitting
                  ? t('bulkInvite.creating')
                  : t('bulkInvite.createN', { count: parsed.rows.length })}
              </button>
              <Link to="/admin" className="btn btn-secondary">{t('bulkInvite.cancel')}</Link>
            </div>
          </form>
        )}

        {result && (
          <>
            <div className="card" style={{ padding: 20, marginBottom: 24 }}>
              <h2 style={{ margin: 0, marginBottom: 8 }}>
                {t('bulkInvite.successTitle', { count: result.created.length })}
              </h2>
              <p style={{ margin: 0, opacity: 0.85, lineHeight: 1.6 }}>
                {t('bulkInvite.successBody')}
              </p>
              {result.errors?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ffb4a8' }}>
                    {t('bulkInvite.errorsHeader', { count: result.errors.length })}
                  </div>
                  <ul style={{ marginTop: 6, fontSize: 12, color: '#ffb4a8', paddingLeft: 18 }}>
                    {result.errors.map((e, i) => (
                      <li key={i}>{e.full_name || `row ${e.index}`}: {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {result.created.map((row, idx) => (
              <div key={row.signup_url} className="card" style={{ padding: 20, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{row.full_name}</div>
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                      {row.country}{row.phone ? ` · ${row.phone}` : ''}
                    </div>
                  </div>
                  <div className="action-row" style={{ margin: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleCopy(idx, row)}
                    >
                      {copiedIdx === idx ? t('bulkInvite.copied') : t('bulkInvite.copyMessage')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleWhatsAppOpen(row)}
                    >
                      {t('bulkInvite.openWhatsApp')}
                    </button>
                  </div>
                </div>
                <pre className="whatsapp-preview" style={{ marginTop: 8 }}>{buildWaMessage(row)}</pre>
              </div>
            ))}

            <div className="action-row" style={{ marginTop: 24 }}>
              <Link to="/admin" className="btn btn-secondary">{t('bulkInvite.doneBackToAdmin')}</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
