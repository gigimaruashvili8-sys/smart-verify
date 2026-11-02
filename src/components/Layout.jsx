import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, CalendarDays, LayoutDashboard, LogOut } from 'lucide-react'
import { DEMO, supabase } from '../lib/supabase'
import Logo from './Logo.jsx'

const link = ({ isActive }) =>
  `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
    isActive ? 'bg-blue-600/20 text-blue-200 ring-1 ring-blue-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800/70'}`

export default function Layout() {
  const navigate = useNavigate()
  const logout = async () => {
    localStorage.removeItem('isAuthenticated')
    try { await supabase.auth.signOut() } catch {}
    navigate('/login', { replace: true })
  }
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Logo />
          <nav className="flex items-center gap-1 order-3 sm:order-none w-full sm:w-auto overflow-x-auto">
            <NavLink to="/dashboard" end className={link}><LayoutDashboard className="h-4 w-4" />Dashboard</NavLink>
            <NavLink to="/dashboard/calendar" className={link}><CalendarDays className="h-4 w-4" />Calendar</NavLink>
            <NavLink to="/dashboard/analytics" className={link}><BarChart3 className="h-4 w-4" />Analytics</NavLink>
          </nav>
          <button onClick={logout} className="ml-auto inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all">
            <LogOut className="h-4 w-4" />Log out
          </button>
        </div>
      </header>
      {DEMO && <p className="bg-blue-600/15 text-blue-200 text-sm text-center py-2">Demo mode: sample data, nothing is saved or emailed.</p>}
      <main className="max-w-7xl mx-auto px-4 py-8"><Outlet /></main>
    </div>
  )
}
