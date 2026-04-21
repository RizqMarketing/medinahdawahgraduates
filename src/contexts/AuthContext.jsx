import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    // Supabase fires onAuthStateChange for every token refresh (including
    // on tab-focus revisit). If we call setSession with a fresh object on
    // every event, the [session] useEffect below re-runs, flips loading
    // back to true, and RequireAuth unmounts the page — which kills any
    // in-progress form state (e.g. uploaded files on the report edit
    // page). Only update the session when the user or token actually
    // changes so same-user refreshes become no-ops.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(prev => {
        // Signed out
        if (!newSession) {
          setProfile(null)
          setLoading(false)
          return null
        }
        // Unchanged user + same access token → ignore (no-op keeps ref stable)
        if (
          prev &&
          prev.user?.id === newSession.user?.id &&
          prev.access_token === newSession.access_token
        ) {
          return prev
        }
        return newSession
      })
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  // Fetch profile when the user changes. Keyed on user.id (stable string)
  // rather than the session object so token refreshes don't re-trigger.
  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    // Only show loading if we don't already have a profile for this user.
    // Prevents the whole app from flashing "Loading…" on a token refresh.
    setProfile(prev => {
      if (!prev || prev.id !== userId) {
        setLoading(true)
      }
      return prev
    })
    supabase
      .from('profiles')
      .select('id, role, full_name, phone')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Failed to load profile:', error)
        setProfile(data ?? null)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [userId])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
