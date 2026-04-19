import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import { useAuth } from './contexts/AuthContext.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function RoleHomeRedirect() {
  const { session, role, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (role === 'admin') return <Navigate to="/admin" replace />
  if (role === 'graduate') return <Navigate to="/graduate-home" replace />
  if (role === 'sponsor') return <Navigate to="/sponsor" replace />
  return <Navigate to="/login" replace />
}
import SponsorDashboard from './pages/SponsorDashboard.jsx'
import GraduateProfile from './pages/GraduateProfile.jsx'
import ReportView from './pages/ReportView.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import BrowseGraduates from './pages/BrowseGraduates.jsx'
import Login from './pages/Login.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import AdminGraduateNew from './pages/admin/AdminGraduateNew.jsx'
import AdminGraduateDetail from './pages/admin/AdminGraduateDetail.jsx'
import AdminGraduateEdit from './pages/admin/AdminGraduateEdit.jsx'
import AdminSponsors from './pages/admin/AdminSponsors.jsx'
import AdminSponsorNew from './pages/admin/AdminSponsorNew.jsx'
import AdminSponsorDetail from './pages/admin/AdminSponsorDetail.jsx'
import AdminSponsorEdit from './pages/admin/AdminSponsorEdit.jsx'
import AdminMonthTotals from './pages/admin/AdminMonthTotals.jsx'
import GraduateHome from './pages/graduate/GraduateHome.jsx'
import ReportNew from './pages/graduate/ReportNew.jsx'
import ReportEdit from './pages/graduate/ReportEdit.jsx'
import ReportDetail from './pages/ReportDetail.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <SplashScreen />
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<RoleHomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sponsor" element={
            <RequireAuth role="sponsor"><SponsorDashboard /></RequireAuth>
          } />
          <Route path="/graduate/:slug" element={
            <RequireAuth><GraduateProfile /></RequireAuth>
          } />
          <Route path="/report/:slug" element={
            <RequireAuth><ReportView /></RequireAuth>
          } />
          <Route path="/admin" element={
            <RequireAuth role="admin"><AdminDashboard /></RequireAuth>
          } />
          <Route path="/admin/graduates/new" element={
            <RequireAuth role="admin"><AdminGraduateNew /></RequireAuth>
          } />
          <Route path="/admin/graduates/:slug" element={
            <RequireAuth role="admin"><AdminGraduateDetail /></RequireAuth>
          } />
          <Route path="/admin/graduates/:slug/edit" element={
            <RequireAuth role="admin"><AdminGraduateEdit /></RequireAuth>
          } />
          <Route path="/admin/sponsors" element={
            <RequireAuth role="admin"><AdminSponsors /></RequireAuth>
          } />
          <Route path="/admin/sponsors/new" element={
            <RequireAuth role="admin"><AdminSponsorNew /></RequireAuth>
          } />
          <Route path="/admin/sponsors/:id" element={
            <RequireAuth role="admin"><AdminSponsorDetail /></RequireAuth>
          } />
          <Route path="/admin/sponsors/:id/edit" element={
            <RequireAuth role="admin"><AdminSponsorEdit /></RequireAuth>
          } />
          <Route path="/admin/months/:monthId" element={
            <RequireAuth role="admin"><AdminMonthTotals /></RequireAuth>
          } />
          <Route path="/graduate-home" element={
            <RequireAuth role="graduate"><GraduateHome /></RequireAuth>
          } />
          <Route path="/reports/new" element={
            <RequireAuth role="graduate"><ReportNew /></RequireAuth>
          } />
          <Route path="/graduate/:slug/reports/:date/edit" element={
            <RequireAuth role="graduate"><ReportEdit /></RequireAuth>
          } />
          <Route path="/graduate/:slug/reports/:date" element={
            <RequireAuth><ReportDetail /></RequireAuth>
          } />
          <Route path="/graduates" element={
            <RequireAuth><BrowseGraduates /></RequireAuth>
          } />
          <Route path="*" element={<RoleHomeRedirect />} />
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
