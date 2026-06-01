'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { login, sendMagicLink } from '@/lib/actions'
import {
  Lotus, IconMail, IconLock, IconEye, IconEyeOff, IconAlert,
  IconCheck, IconArrowR, IconChevR, IconCrown, IconUsers, IconDrop,
} from './icons'

type Demo = {
  role: string
  name: string
  email: string
  Icon: typeof IconCrown
  featured?: boolean
}

// Real Supabase accounts seeded by scripts/setup.mjs — these actually authenticate.
const DEMO_ACCOUNTS: Demo[] = [
  { role: 'Admin',       name: 'Ananda Sharma',   email: 'admin@bodhigrove.demo',  Icon: IconCrown, featured: true },
  { role: 'Coordinator', name: 'Maya Patel',      email: 'coord1@bodhigrove.demo', Icon: IconUsers },
  { role: 'Volunteer',   name: 'James Whitfield', email: 'vol1@bodhigrove.demo',   Icon: IconDrop  },
]
const DEMO_PASS = 'Demo1234!'
const MAX_TRIES = 3       // wrong-password attempts before lockout
const LOCK_SECS = 30      // client-side cosmetic lockout — Supabase also rate-limits server-side

type Mode = 'password' | 'magic'
type Phase = 'idle' | 'signing' | 'entering'
type Banner = { type: 'ok' | 'err'; msg: string } | null

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justReset = searchParams.get('reset') === '1'

  const [mode, setMode]               = useState<Mode>('password')
  const [email, setEmail]             = useState('')
  const [pass, setPass]               = useState('')
  const [remember, setRemember]       = useState(true)
  const [showPass, setShowPass]       = useState(false)
  const [caps, setCaps]               = useState(false)
  const [errors, setErrors]           = useState<{ email?: string | null; pass?: string | null }>({})
  const [banner, setBanner]           = useState<Banner>(
    justReset ? { type: 'ok', msg: 'Password updated — please sign in with your new password.' } : null,
  )
  const [phase, setPhase]             = useState<Phase>('idle')
  const [active, setActive]           = useState<number | null>(null)
  const [welcomeName, setWelcomeName] = useState('')
  const [tries, setTries]             = useState(0)
  const [lockLeft, setLockLeft]       = useState(0)

  const timers     = useRef<ReturnType<typeof setTimeout>[]>([])
  const lockTimer  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    if (lockTimer.current) clearInterval(lockTimer.current)
  }, [])

  const locked = lockLeft > 0
  const busy = phase !== 'idle'
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const startLock = () => {
    let left = LOCK_SECS
    setLockLeft(left)
    setBanner({ type: 'err', msg: `Too many attempts. Try again in ${left}s.` })
    if (lockTimer.current) clearInterval(lockTimer.current)
    lockTimer.current = setInterval(() => {
      left -= 1
      if (left <= 0) {
        if (lockTimer.current) clearInterval(lockTimer.current)
        setLockLeft(0); setTries(0); setBanner(null)
      } else {
        setLockLeft(left)
        setBanner({ type: 'err', msg: `Too many attempts. Try again in ${left}s.` })
      }
    }, 1000)
  }

  const validate = (needPass: boolean) => {
    const e: typeof errors = {}
    if (!email.trim()) e.email = 'Please enter your email.'
    else if (!emailValid) e.email = "That doesn't look like an email."
    if (needPass) {
      if (!pass) e.pass = 'Please enter your password.'
      else if (pass.length < 6) e.pass = 'Password is at least 6 characters.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const switchMode = () => {
    setMode(m => (m === 'password' ? 'magic' : 'password'))
    setErrors({})
    setBanner(null)
  }

  const onPassKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) setCaps(e.getModifierState('CapsLock'))
  }

  const submitLabel = () => {
    if (locked) return <>Locked · {lockLeft}s</>
    if (phase === 'signing') {
      return <><span className="spinner" /> {mode === 'magic' ? 'Sending…' : 'Entering…'}</>
    }
    if (mode === 'magic') return <>Send sign-in link <span className="chev"><IconArrowR size={18} /></span></>
    return <>Enter portal <span className="chev"><IconArrowR size={18} /></span></>
  }

  const enterSuccess = (name: string) => {
    setWelcomeName(name)
    setPhase('entering')
    timers.current.push(setTimeout(() => router.push('/dashboard'), 1400))
  }

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (busy || locked) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setBanner({ type: 'err', msg: 'You appear to be offline. Check your connection and try again.' })
      return
    }

    // ── Magic-link branch ─────────────────────────────────────────
    if (mode === 'magic') {
      if (!validate(false)) return
      setBanner(null)
      setPhase('signing')
      const fd = new FormData()
      fd.set('email', email.trim())
      const result = await sendMagicLink(null, fd)
      setPhase('idle')
      if (result && 'error' in result) {
        setBanner({ type: 'err', msg: result.error })
      } else {
        setBanner({ type: 'ok', msg: `Sign-in link sent to ${email.trim()}. Check your inbox.` })
      }
      return
    }

    // ── Password branch ──────────────────────────────────────────
    if (!validate(true)) return
    setBanner(null)
    setPhase('signing')

    const fd = new FormData()
    fd.set('email', email.trim())
    fd.set('password', pass)
    const result = await login(null, fd)

    // `login` redirects on success — we only get here on error
    if (result && 'error' in result) {
      const n = tries + 1
      setTries(n)
      setPhase('idle')
      setActive(null)
      if (n >= MAX_TRIES) startLock()
      else setBanner({ type: 'err', msg: `That didn't sign you in. ${MAX_TRIES - n} attempt${MAX_TRIES - n === 1 ? '' : 's'} left.` })
      return
    }

    // On success the server action redirects; we shouldn't reach here, but
    // if we do (race), nudge the router and show the overlay.
    enterSuccess('friend')
  }

  const pickDemo = async (i: number) => {
    if (busy || locked) return
    const d = DEMO_ACCOUNTS[i]
    setMode('password')
    setActive(i)
    setEmail(d.email)
    setPass(DEMO_PASS)
    setErrors({})
    setBanner(null)

    // Give the UI a moment to reflect the active row, then submit.
    timers.current.push(setTimeout(async () => {
      setPhase('signing')
      const fd = new FormData()
      fd.set('email', d.email)
      fd.set('password', DEMO_PASS)
      const result = await login(null, fd)
      if (result && 'error' in result) {
        setPhase('idle')
        setActive(null)
        setBanner({ type: 'err', msg: result.error })
        return
      }
      // success — the action issued a redirect; surface the overlay briefly.
      enterSuccess(`${d.name} · ${d.role}`)
    }, 380))
  }

  return (
    <div className="card">
      <div className="card__head">
        <span className="card__lotus"><Lotus size={34} /></span>
        <h1 className="card__title">Welcome back</h1>
        <p className="card__sub">
          {mode === 'magic'
            ? "We'll email you a one-tap sign-in link."
            : 'Sign in to manage volunteer service.'}
        </p>
      </div>

      <div className="banner-live" role="status" aria-live="polite">
        {banner && (
          <div className={'banner banner--' + (banner.type === 'ok' ? 'ok' : 'err')}>
            {banner.type === 'ok' ? <IconCheck /> : <IconAlert />} {banner.msg}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="email">Email address</label>
          <div className="input-wrap">
            <span className="input__lead"><IconMail size={18} /></span>
            <input
              id="email" type="email"
              className={'input input--lead' + (errors.email ? ' input--error' : '')}
              placeholder="you@bodhigrove.demo"
              value={email}
              disabled={locked}
              onChange={e => {
                setEmail(e.target.value)
                if (errors.email) setErrors({ ...errors, email: null })
              }}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-err' : undefined}
            />
            {emailValid && !errors.email && (
              <span className="input__ok" title="Looks good"><IconCheck size={17} /></span>
            )}
          </div>
          {errors.email && (
            <div className="field__error" id="email-err"><IconAlert /> {errors.email}</div>
          )}
        </div>

        {mode === 'password' && (
          <div className="field">
            <div className="field__labelrow">
              <label className="field__label" htmlFor="pass">Password</label>
              <button type="button" className="field__forgot" onClick={switchMode}>Forgot password?</button>
            </div>
            <div className="input-wrap">
              <span className="input__lead"><IconLock size={17} /></span>
              <input
                id="pass"
                type={showPass ? 'text' : 'password'}
                className={'input input--lead input--trail-btn' + (errors.pass ? ' input--error' : '')}
                placeholder="••••••••"
                value={pass}
                disabled={locked}
                onChange={e => {
                  setPass(e.target.value)
                  if (errors.pass) setErrors({ ...errors, pass: null })
                }}
                onKeyDown={onPassKey}
                onKeyUp={onPassKey}
                autoComplete="current-password"
                aria-invalid={!!errors.pass}
                aria-describedby={errors.pass ? 'pass-err' : (caps ? 'caps-hint' : undefined)}
              />
              <button
                type="button" className="input__toggle"
                onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                aria-pressed={showPass}
                tabIndex={locked ? -1 : 0}
              >
                {showPass ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
            {errors.pass && (
              <div className="field__error" id="pass-err"><IconAlert /> {errors.pass}</div>
            )}
            {caps && !errors.pass && (
              <div className="caps-hint" id="caps-hint"><IconAlert /> Caps Lock is on.</div>
            )}
          </div>
        )}

        {mode === 'password' && (
          <label className="remember">
            <input
              type="checkbox" checked={remember} disabled={locked}
              onChange={e => setRemember(e.target.checked)}
            />
            <span className="remember__box"><IconCheck size={13} /></span>
            <span className="remember__label">Keep me signed in</span>
          </label>
        )}

        <button type="submit" className="card__submit" disabled={busy || locked}>
          {submitLabel()}
        </button>
      </form>

      <div className="altauth">
        <button type="button" onClick={switchMode} disabled={busy || locked}>
          {mode === 'password' ? 'Email me a sign-in link instead' : 'Use your password instead'}
        </button>
      </div>

      <div className="divider"><span className="divider__lotus"><Lotus size={18} /></span></div>

      <p className="demos__label">Try a demo account</p>
      <div className="demos">
        {DEMO_ACCOUNTS.map((d, i) => (
          <button
            key={d.role}
            className={
              'demo'
              + (d.featured ? ' demo--featured' : '')
              + (active === i ? ' demo--active' : '')
            }
            onClick={() => pickDemo(i)}
            disabled={busy || locked}
          >
            <span className="demo__ico"><d.Icon size={20} /></span>
            <span className="demo__role">{d.role}</span>
            <span className="demo__name">{d.name}</span>
            <span className="demo__chev">
              {active === i && phase === 'signing'
                ? <span className="demo__spin" />
                : <IconChevR size={16} />}
            </span>
          </button>
        ))}
      </div>

      <div className="card__foot">
        <span className="card__foot-lotus"><Lotus size={16} /></span>
        <p className="card__credit">
          Designed &amp; built by{' '}
          <a
            href="https://github.com/Meditationzencode"
            target="_blank"
            rel="noopener noreferrer"
          >
            <strong>MeditationzenCode</strong>
          </a>
        </p>
        <p className="card__stack">Next.js 15 · TypeScript · Supabase · PostgreSQL · Playwright E2E tests</p>
      </div>

      <div className={'enter' + (phase === 'entering' ? ' enter--show' : '')}>
        <span className="enter__lotus"><Lotus size={60} /></span>
        <div>
          <div className="enter__title">Welcome, {welcomeName.split(' ')[0] || 'friend'}.</div>
          <p className="enter__sub">Opening the rota…</p>
        </div>
      </div>
    </div>
  )
}
