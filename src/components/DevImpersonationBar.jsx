import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { DEV_TEST_ACCOUNTS } from '../lib/devAccounts.js'

const TEST_EMAILS = new Set(DEV_TEST_ACCOUNTS.map(a => a.email))

// Sticky bar at the top of the page when, in dev mode, the active session is
// a known test account. Makes it obvious you're impersonating, and offers a
// one-click sign-out to get back to the admin login.
export default function DevImpersonationBar() {
  const { user, profile, signOut } = useAuth()
  const nav = useNavigate()
  if (!user || !TEST_EMAILS.has(user.email)) return null

  const backToAdmin = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div className="dev-impersonation-bar">
      <span>
        🧪 DEV — viewing as <strong>{profile?.full_name || user.email}</strong>
        {profile?.role && <span> ({profile.role})</span>}
      </span>
      <button type="button" onClick={backToAdmin} className="dev-impersonation-back">
        ← Sign out · admin login
      </button>
    </div>
  )
}
