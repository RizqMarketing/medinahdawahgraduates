// Helpers for the admin "View as graduate" flow.
//
// We back up the admin's session into localStorage before swapping to the
// graduate's session via supabase.auth.verifyOtp(magiclink). The presence of
// this backup is what flips the impersonation banner on, and clicking
// "Back to admin" calls supabase.auth.setSession with the backed-up tokens.
import { supabase } from './supabase.js'

const BACKUP_KEY = 'mdg.impersonationBackupSession'

export function readBackup() {
  try {
    const raw = localStorage.getItem(BACKUP_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeBackup(payload) {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(payload))
}

function clearBackup() {
  localStorage.removeItem(BACKUP_KEY)
}

export function hasImpersonationBackup() {
  return !!readBackup()
}

export function getImpersonationTarget() {
  return readBackup()?.target || null
}

// Swap from the admin session into the target graduate's session.
// Throws on any step. On failure, the backup is cleared so the user
// stays logged in as the admin without a stale banner.
export async function startImpersonation(graduateSlug) {
  const { data: sessionRes } = await supabase.auth.getSession()
  const adminSession = sessionRes?.session
  if (!adminSession) throw new Error('Not signed in')

  const { data, error } = await supabase.functions.invoke('admin-impersonate', {
    body: { graduate_slug: graduateSlug },
  })
  if (error) throw error
  if (!data?.token_hash) throw new Error(data?.error || 'No token returned')

  // Save admin tokens BEFORE the swap so the banner has them on next render.
  writeBackup({
    admin: {
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    },
    target: data.target,
    startedAt: Date.now(),
  })

  const { error: verifyErr } = await supabase.auth.verifyOtp({
    token_hash: data.token_hash,
    type: 'magiclink',
  })
  if (verifyErr) {
    clearBackup()
    throw verifyErr
  }
}

// Restore the admin session and clear the backup. If the admin tokens have
// expired, fall back to a clean sign-out + redirect to /login.
export async function exitImpersonation() {
  const backup = readBackup()
  if (!backup?.admin) {
    clearBackup()
    await supabase.auth.signOut()
    return { ok: false, reason: 'no_backup' }
  }
  try {
    const { error } = await supabase.auth.setSession({
      access_token: backup.admin.access_token,
      refresh_token: backup.admin.refresh_token,
    })
    if (error) throw error
    clearBackup()
    return { ok: true }
  } catch {
    clearBackup()
    await supabase.auth.signOut()
    return { ok: false, reason: 'expired' }
  }
}
