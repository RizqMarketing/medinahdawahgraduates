import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [phase, setPhase] = useState('visible')

  useEffect(() => {
    const fade = setTimeout(() => setPhase('fading'), 1100)
    const hide = setTimeout(() => setPhase('hidden'), 1700)
    return () => { clearTimeout(fade); clearTimeout(hide) }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div className={`splash ${phase === 'fading' ? 'splash-fading' : ''}`}>
      <div className="splash-glow" aria-hidden="true" />
      <div className="splash-inner">
        <img src="/logo.jpg" alt="Madinah Dawah Graduates" className="splash-logo" />
        <div className="splash-arabic">بِسْمِ اللَّهِ</div>
        <div className="splash-ring" aria-hidden="true" />
      </div>
    </div>
  )
}
