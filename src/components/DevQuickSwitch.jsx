import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  DEV_TEST_ACCOUNTS, DEV_TEST_PASSWORD, homePathForRole,
} from '../lib/devAccounts.js'

// Admin-only "Test as graduate / sponsor" panel: signs the current user out,
// signs back in as the chosen test account, and navigates to that role's
// home page. The test accounts are created by `scripts/seed-test-data.mjs`.
// Dev-only: tree-shaken from production builds via `import.meta.env.DEV`.
export default function DevQuickSwitch() {
  const { t } = useTranslation()
  const { signIn, signOut } = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  if (!import.meta.env.DEV) return null

  const switchTo = async (account) => {
    setError(null)
    setBusy(account.email)
    try {
      await signOut()
      await signIn(account.email, DEV_TEST_PASSWORD)
      nav(homePathForRole(account.role), { replace: true })
    } catch (err) {
      setError(t('admin.testSwitch.error', { message: err.message || String(err) }))
      setBusy(null)
    }
  }

  return (
    <section className="dev-panel">
      <div className="dev-panel-eyebrow">{t('admin.testSwitch.eyebrow')}</div>
      <div className="dev-panel-hint">{t('admin.testSwitch.hint')}</div>
      {error && (
        <div className="dev-panel-error">
          {error}
          <div style={{ marginTop: 4, opacity: 0.85 }}>{t('admin.testSwitch.errorSeedHint')}</div>
        </div>
      )}
      <div className="dev-panel-grid">
        {DEV_TEST_ACCOUNTS.map(a => (
          <button
            key={a.email}
            type="button"
            className="dev-panel-btn"
            disabled={!!busy}
            onClick={() => switchTo(a)}
          >
            <div className="dev-panel-btn-name">{a.name}</div>
            <div className="dev-panel-btn-blurb">{a.blurb}</div>
            {busy === a.email && <div className="dev-panel-btn-busy">{t('admin.testSwitch.busy')}</div>}
          </button>
        ))}
      </div>
    </section>
  )
}
