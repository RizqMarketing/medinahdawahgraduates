import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../ThemeContext.jsx'

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

export default function Header() {
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/sponsor" className="brand" onClick={() => setOpen(false)}>
          <img src="/logo.jpg" alt="Madinah Dawah Graduates" className="brand-logo" />
          <div className="brand-name">Madinah Dawah Graduates</div>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <nav className={`nav nav-links ${open ? 'open' : ''}`}>
            <NavLink to="/sponsor" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>Dashboard</NavLink>
            <NavLink to="/graduates" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>Graduates</NavLink>
            <NavLink to="/admin" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>Admin</NavLink>
          </nav>
          <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme" title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}>
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button className="menu-toggle" onClick={() => setOpen(o => !o)} aria-label="Menu">
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  )
}
