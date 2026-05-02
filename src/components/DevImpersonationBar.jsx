import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext.jsx'
import { DEV_TEST_ACCOUNTS } from '../lib/devAccounts.js'
import {
  hasImpersonationBackup,
  getImpersonationTarget,
  exitImpersonation,
} from '../lib/impersonation.js'

const TEST_EMAILS = new Set(DEV_TEST_ACCOUNTS.map(a => a.email))

// Sticky bar at the top of the page when the active session is either
// (a) a dev test account or (b) the result of an admin "View as graduate"
// impersonation. Dev test mode requires the user to log themselves out and
// back in; prod impersonation has a one-click restore via lib/impersonation.
export default function DevImpersonationBar() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const nav = useNavigate()

  // The backup-session presence isn't reactive on its own — track it in
  // state and keep it in sync with the impersonation start/exit flows.
  const [hasBackup, setHasBackup] = useState(() => hasImpersonationBackup())
  useEffect(() => {
    const sync = () => setHasBackup(hasImpersonationBackup())
    sync()
    // Re-check whenever localStorage changes (other tab) or the user changes
    // (start/exit fires onAuthStateChange via verifyOtp / setSession).
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [user?.id])

  if (!user) return null

  const isImpersonating = hasBackup
  const isDevTestSession = TEST_EMAILS.has(user.email)
  if (!isImpersonating && !isDevTestSession) return null

  const handleBack = async () => {
    if (isImpersonating) {
      const result = await exitImpersonation()
      setHasBackup(false)
      if (result.ok) nav('/admin', { replace: true })
      else nav('/login', { replace: true })
      return
    }
    await signOut()
    nav('/login', { replace: true })
  }

  let label
  let backLabel
  let roleLabel = null
  if (isImpersonating) {
    const target = getImpersonationTarget()
    label = t('admin.impersonation.label', { name: target?.full_name || user.email })
    backLabel = t('admin.impersonation.back')
  } else {
    label = t('admin.testImpersonation.label', { name: profile?.full_name || user.email })
    backLabel = t('admin.testImpersonation.back')
    if (profile?.role) {
      roleLabel = t(`admin.testImpersonation.role_${profile.role}`, { defaultValue: profile.role })
    }
  }

  return (
    <div className="dev-impersonation-bar">
      <span>
        🧪 {label}
        {roleLabel && <span> ({roleLabel})</span>}
      </span>
      <button type="button" onClick={handleBack} className="dev-impersonation-back">
        {backLabel}
      </button>
    </div>
  )
}
