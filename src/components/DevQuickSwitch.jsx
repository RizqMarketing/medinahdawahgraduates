import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  DEV_TEST_ACCOUNTS, DEV_TEST_PASSWORD, homePathForRole,
} from '../lib/devAccounts.js'

// Admin-only dev tool: signs the current user out, signs back in as the
// chosen test account, and navigates to that role's home page. Only mounts
// when `import.meta.env.DEV` is true (stripped from production builds).
export default function DevQuickSwitch() {
  const { signIn, signOut } = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  const switchTo = async (account) => {
    setError(null)
    setBusy(account.email)
    try {
      await signOut()
      await signIn(account.email, DEV_TEST_PASSWORD)
      nav(homePathForRole(account.role), { replace: true })
    } catch (err) {
      setError(`Could not switch — ${err.message || String(err)}. Did you run scripts/seed-test-data.mjs?`)
      setBusy(null)
    }
  }

  return (
    <section className="dev-panel">
      <div className="dev-panel-eyebrow">⚙ DEV ONLY · Switch view</div>
      <div className="dev-panel-hint">
        Sign in as a test account to verify graduate / sponsor flows.
        Re-enter your admin password afterwards to come back.
      </div>
      {error && (
        <div className="dev-panel-error">{error}</div>
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
            {busy === a.email && <div className="dev-panel-btn-busy">Switching…</div>}
          </button>
        ))}
      </div>
    </section>
  )
}
