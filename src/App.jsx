import { Navigate, Route, Routes } from 'react-router-dom'
import Auth from './pages/Auth.jsx'
import Verify from './pages/Verify.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Calendar from './pages/Calendar.jsx'
import Analytics from './pages/Analytics.jsx'
import Layout from './components/Layout.jsx'

// UX-only gate (Spec §1). Real data protection is Supabase RLS.
function RequireFlag({ children }) {
  return localStorage.getItem('isAuthenticated') === 'true' ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      {/* 100% public: no session, no guard */}
      <Route path="/verify/:id" element={<Verify />} />
      <Route element={<RequireFlag><Layout /></RequireFlag>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/calendar" element={<Calendar />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
