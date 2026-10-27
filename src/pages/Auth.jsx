import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BTN, CARD, FIELD, INPUT } from '../lib/ui'

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <form onSubmit={submit} noValidate className={`${CARD} w-full max-w-md flex flex-col gap-4`}>
        <h1 className="text-2xl font-bold">{isSignup ? 'Create account' : 'Log in'}</h1>
        <div className={FIELD}>
          <label htmlFor="email" className="text-sm text-slate-300">Email</label>
          <input id="email" type="text" inputMode="email" autoComplete="email" className={INPUT}
            placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className={FIELD}>
          <label htmlFor="password" className="text-sm text-slate-300">Password</label>
          <input id="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'}
            className={INPUT} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className={BTN}>{isSignup ? 'Sign up' : 'Log in'}</button>
        <p className="text-sm text-slate-400">
          {isSignup ? 'Already registered? ' : 'No account? '}
          <Link className="text-blue-400 hover:underline" to={isSignup ? '/login' : '/signup'}>
            {isSignup ? 'Log in' : 'Sign up'}
          </Link>
        </p>
      </form>
    </div>
  )
}
