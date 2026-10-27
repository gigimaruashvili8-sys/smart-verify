import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const link = ({ isActive }) =>
  `px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`

export default function Layout() {
  const navigate = useNavigate()
  const logout = async () => {
    localStorage.removeItem('isAuthenticated')
    try { await supabase.auth.signOut() } catch {}
    navigate('/login', { replace: true })
  }
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <span className="font-bold mr-4">Rental Verify</span>
          <NavLink to="/dashboard" end className={link}>Dashboard</NavLink>
          <NavLink to="/dashboard/calendar" className={link}>Calendar</NavLink>
          <NavLink to="/dashboard/analytics" className={link}>Analytics</NavLink>
          <button onClick={logout} className="ml-auto text-sm text-slate-400 hover:text-white">Log out</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8"><Outlet /></main>
    </div>
  )
}
