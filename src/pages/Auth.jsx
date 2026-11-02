import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CheckCircle2, FileSignature, Mail } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import { BTN, CARD, FIELD, INPUT, LABEL } from '../lib/ui'

export default function Auth({ mode }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const isSignup = mode === 'signup'

  // Spec §1: no strict email validation, no type="email", no blocking
  // messages/early returns. Any input is accepted; navigation always happens.
  const submit = async (e) => {
    e.preventDefault()
    try {
      if (email.includes('@')) {
        const auth = (async () => {
          if (isSignup) {
            await supabase.auth.signUp({ email, password })
            // If confirmations are off this already has a session; otherwise try sign-in.
            await supabase.auth.signInWithPassword({ email, password })
          } else {
            await supabase.auth.signInWithPassword({ email, password })
          }
        })()
        // Never let a slow/failed auth call block navigation.
        await Promise.race([auth, new Promise((r) => setTimeout(r, 3000))])
      }
    } catch { /* intentionally silent */ }
    localStorage.setItem('isAuthenticated', 'true')
    navigate('/dashboard', { replace: true })
  }

  const perks = [[CheckCircle2, 'სტუმრის ონლაინ ვერიფიკაცია პირადობით'], [FileSignature, 'ციფრული ხელმოწერა ტელეფონიდან'], [Mail, 'ხელშეკრულება და ინვოისი ავტომატურად მეილზე']]
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600/25 via-indigo-600/15 to-transparent border-r border-slate-800/80">
        <Logo />
        <div className="flex flex-col gap-8">
          <h2 className="text-4xl font-bold leading-tight">სტუმრების ვერიფიკაცია<br /><span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">წუთებში</span></h2>
          <ul className="flex flex-col gap-4">
            {perks.map(([Icon, t]) => (
              <li key={t} className="flex items-center gap-3 text-slate-300">
                <span className="h-9 w-9 rounded-xl bg-slate-900/80 border border-slate-700 grid place-items-center"><Icon className="h-4 w-4 text-blue-300" /></span>{t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-slate-500">უსაფრთხო შენახვა · კერძო დოკუმენტები</p>
      </div>
      <div className="flex items-center justify-center p-4">
        <form onSubmit={submit} noValidate className={`${CARD} w-full max-w-md flex flex-col gap-5`}>
          <div className="lg:hidden"><Logo /></div>
          <div>
            <h1 className="text-2xl font-bold">{isSignup ? 'Create account' : 'Welcome back'}</h1>
            <p className="text-sm text-slate-400 mt-1">{isSignup ? 'Start verifying guests in minutes.' : 'Log in to manage your verifications.'}</p>
          </div>
          <div className={FIELD}>
            <label htmlFor="email" className={LABEL}>Email</label>
            <input id="email" type="text" inputMode="email" autoComplete="email" className={INPUT}
              placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={FIELD}>
            <label htmlFor="password" className={LABEL}>Password</label>
            <input id="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'}
              className={INPUT} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className={BTN}>{isSignup ? 'Sign up' : 'Log in'}</button>
          <p className="text-sm text-slate-400 text-center">
            {isSignup ? 'Already registered? ' : 'No account? '}
            <Link className="text-blue-400 hover:text-blue-300 font-medium" to={isSignup ? '/login' : '/signup'}>
              {isSignup ? 'Log in' : 'Sign up'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
