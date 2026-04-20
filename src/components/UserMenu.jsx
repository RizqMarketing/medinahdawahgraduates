import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function UserMenu() {
  const { session, profile, signOut } = useAuth()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!session) {
    return (
      <NavLink to="/login" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>
        {t('nav.signIn')}
      </NavLink>
    )
  }

  const name = profile?.full_name || session.user.email
  const initials = (name || '?')
    .split(/\s+/)
    .map(word => word.replace(/[^\p{L}]/gu, ''))
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?'

  const handleLogout = async () => {
    await signOut()
    setOpen(false)
    nav('/login', { replace: true })
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="user-chip"
        aria-label={t('nav.account')}
      >
        <span className="user-chip-avatar">{initials}</span>
        <span className="user-chip-name">{profile?.full_name || session.user.email}</span>
      </button>
      {open && (
        <div className="user-menu">
          <div className="user-menu-header">
            <div className="user-menu-name">{name}</div>
            <div className="user-menu-role">{profile?.role || t('common.dash')}</div>
          </div>
          <button onClick={handleLogout} className="user-menu-item">{t('nav.logOut')}</button>
        </div>
      )}
    </div>
  )
}
