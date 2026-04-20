import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../ThemeContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import UserMenu from './UserMenu.jsx'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  )
}

function LangToggle() {
  const { i18n, t } = useTranslation()
  const current = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const pick = (lng) => {
    if (lng !== current) i18n.changeLanguage(lng)
  }
  return (
    <div className="lang-toggle" role="group" aria-label={t('nav.switchLanguage')}>
      <button
        type="button"
        className={`lang-toggle-option ${current === 'en' ? 'active' : ''}`}
        onClick={() => pick('en')}
        aria-pressed={current === 'en'}
      >EN</button>
      <button
        type="button"
        className={`lang-toggle-option ${current === 'ar' ? 'active' : ''}`}
        onClick={() => pick('ar')}
        aria-pressed={current === 'ar'}
      >عربي</button>
    </div>
  )
}

export default function Header() {
  const { theme, toggle } = useTheme()
  const { role, session } = useAuth()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setOpen(false) }, [location.pathname, role, session?.user?.id])

  const homeFor = role === 'admin' ? '/admin'
                : role === 'graduate' ? '/graduate-home'
                : '/sponsor'

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to={homeFor} className="brand" onClick={() => setOpen(false)}>
          <img src="/logo.jpg" alt={t('common.appName')} className="brand-logo" />
          <div className="brand-name">{t('common.appName')}</div>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          {session && (
            <nav className={`nav nav-links ${open ? 'open' : ''}`}>
              {role === 'sponsor' && (
                <NavLink to="/sponsor" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>{t('nav.dashboard')}</NavLink>
              )}
              {role === 'admin' && (
                <>
                  <NavLink to="/admin" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>{t('nav.dashboard')}</NavLink>
                  <NavLink to="/admin/sponsors" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>{t('nav.sponsors')}</NavLink>
                </>
              )}
              {role === 'graduate' && (
                <>
                  <NavLink to="/graduate-home" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>{t('nav.home')}</NavLink>
                  <NavLink to="/reports/new" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>{t('nav.submitReport')}</NavLink>
                </>
              )}
            </nav>
          )}
          <LangToggle />
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={t('nav.toggleTheme')}
            title={theme === 'light' ? t('nav.switchToDark') : t('nav.switchToLight')}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <UserMenu />
          {session && (
            <button className="menu-toggle" onClick={() => setOpen(o => !o)} aria-label={t('nav.menu')}>
              <MenuIcon />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
