import { useState, FormEvent } from 'react'
import { login, signup, saveUser } from '../utils/auth'
import type { User } from '../types'

interface Props {
  onAuth: (user: User) => void
}

const FEATURES = [
  { icon: '🧱', title: 'Complete Tech Stack', desc: 'What to use at every layer — with priced alternatives' },
  { icon: '🗺️', title: 'Step-by-Step Build Plan', desc: 'A clear path from day one, not a blank repo' },
  { icon: '💰', title: 'Real Cost Estimates', desc: 'Budget tiers and monthly cost, decided up front' },
  { icon: '🛡️', title: 'Risks & Security Covered', desc: 'Hidden scope, pitfalls, and security flagged early' },
]

export default function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  // Password policy: 8+ chars, one uppercase, one lowercase, one number, one special char
  const passwordRules = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'One number', ok: /[0-9]/.test(password) },
    { label: 'One special character (!@#$…)', ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const passwordValid = passwordRules.every(r => r.ok)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')

    if (mode === 'signup' && !passwordValid) {
      setError('Password does not meet the requirements below.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await login(email, password)
        saveUser(user)
        onAuth(user)
      } else {
        // Sign up, then require an explicit login — do NOT auto-enter the app.
        await signup(name, email, password)
        setMode('login')
        setName('')
        setPassword('')
        setNotice('Account created! Please sign in to continue.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#050a14' }}>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
          <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full opacity-15 blur-3xl animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)', animationDelay: '1s' }} />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent)', animationDelay: '2s' }} />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>S</div>
          <span className="text-white font-semibold text-lg">Sentinel AI</span>
        </div>

        {/* Hero text */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-medium text-cyan-300"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI-Powered Project Analysis
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            From brief to<br />
            <span style={{ background: 'linear-gradient(135deg, #22d3ee, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              build guide
            </span><br />
            in 90 seconds
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Share a project brief and Sentinel turns it into a clear, costed build guide — the right tech stack, a step-by-step plan, budget, risks, and security — so any engineer can start building right away.
          </p>
        </div>

        {/* Features */}
        <div className="relative space-y-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{f.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8"
        style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="w-full max-w-sm">

          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)' }}>S</div>
            <span className="text-white font-semibold">Sentinel AI</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Get started'}
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="John Smith" required
                  className="w-full px-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => e.currentTarget.style.border = '1px solid rgba(6,182,212,0.6)'}
                  onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'} />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => e.currentTarget.style.border = '1px solid rgba(6,182,212,0.6)'}
                onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => e.currentTarget.style.border = '1px solid rgba(6,182,212,0.6)'}
                onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'} />
              {/* Password requirements — only during signup, only while typing */}
              {mode === 'signup' && password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {passwordRules.map((r, i) => (
                    <li key={i} className={`flex items-center gap-2 text-xs ${r.ok ? 'text-cyan-400' : 'text-slate-500'}`}>
                      <span>{r.ok ? '✓' : '○'}</span> {r.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {notice && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-cyan-300"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <span>✓</span> {notice}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-red-300"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span>⚠</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading || (mode === 'signup' && !passwordValid)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)', boxShadow: '0 0 24px rgba(6,182,212,0.3)' }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setNotice('') }}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
