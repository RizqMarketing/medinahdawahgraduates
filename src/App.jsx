import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header.jsx'
import SplashScreen from './components/SplashScreen.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
import SponsorDashboard from './pages/SponsorDashboard.jsx'
import GraduateProfile from './pages/GraduateProfile.jsx'
import ReportView from './pages/ReportView.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import BrowseGraduates from './pages/BrowseGraduates.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <SplashScreen />
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/sponsor" replace />} />
          <Route path="/sponsor" element={<SponsorDashboard />} />
          <Route path="/graduate/:slug" element={<GraduateProfile />} />
          <Route path="/report/:slug" element={<ReportView />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/graduates" element={<BrowseGraduates />} />
          <Route path="*" element={<Navigate to="/sponsor" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">
          <span className="arabic">وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ</span>
          <div>Built in service of the ummah · {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  )
}
