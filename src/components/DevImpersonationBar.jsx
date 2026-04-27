import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext.jsx'
import { DEV_TEST_ACCOUNTS } from '../lib/devAccounts.js'

const TEST_EMAILS = new Set(DEV_TEST_ACCOUNTS.map(a => a.email))

// Sticky bar at the top of the page when the active session is a known test
// account. Makes it obvious you're impersonating, and offers a one-click
// sign-out to get back to the admin login.
export default function DevImpersonationBar() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const nav = useNavigate()
  if (!user || !TEST_EMAILS.has(user.email)) return null

  const backToAdmin = async () => {
    await signOut()
    nav('/login', { replace: true })
  }

  const name = profile?.full_name || user.email
  const role = profile?.role
  const roleLabel = role
    ? t(`admin.testImpersonation.role_${role}`, { defaultValue: role })
    : null

  return (
    <div className="dev-impersonation-bar">
      <span>
        🧪 {t('admin.testImpersonation.label', { name })}
        {roleLabel && <span> ({roleLabel})</span>}
      </span>
      <button type="button" onClick={backToAdmin} className="dev-impersonation-back">
        {t('admin.testImpersonation.back')}
      </button>
    </div>
  )
}
