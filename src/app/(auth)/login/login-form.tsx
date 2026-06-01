'use client'

import { useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login } from '@/lib/actions'
import type { ActionResult } from '@/lib/types'

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(login, null)
  const emailRef    = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const justReset = searchParams.get('reset') === '1'

  // Demo fill buttons: set email and trigger focus
  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.demo-fill')
    const handler = (e: Event) => {
      const btn = e.currentTarget as HTMLButtonElement
      if (emailRef.current)    emailRef.current.value    = btn.dataset.email ?? ''
      if (passwordRef.current) passwordRef.current.value = 'Demo1234!'
      emailRef.current?.focus()
    }
    buttons.forEach(b => b.addEventListener('click', handler))
    return () => buttons.forEach(b => b.removeEventListener('click', handler))
  }, [])

  const error = state && 'error' in state ? state.error : null

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {justReset && (
        <div className="bg-sage-50 border border-sage-200 text-sage-800 text-sm rounded-lg px-4 py-3">
          Password updated — please sign in with your new password.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink/80">Email address</label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/40">
            <MailIcon />
          </span>
          <input
            ref={emailRef}
            id="email" name="email" type="email" required autoComplete="email"
            placeholder="you@bodhigrove.demo"
            className="w-full border border-sand rounded-lg pl-10 pr-3 py-2.5 text-sm bg-white text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-mist focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-ink/80">Password</label>
          <Link href="/forgot-password" className="text-xs text-gold-600 hover:text-gold-700 font-medium">Forgot password?</Link>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink/40">
            <LockIcon />
          </span>
          <input
            ref={passwordRef}
            id="password" name="password" type="password" required autoComplete="current-password"
            placeholder="••••••••"
            className="w-full border border-sand rounded-lg pl-10 pr-3 py-2.5 text-sm bg-white text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-mist focus:border-transparent transition"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="group w-full inline-flex items-center justify-center gap-2.5 bg-sage-800 hover:bg-sage-900 disabled:opacity-60 text-white font-medium py-3.5 rounded-lg text-[15px] tracking-wide transition-colors shadow-md"
      >
        {pending ? 'Entering…' : (
          <>
            Enter portal
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </>
        )}
      </button>
    </form>
  )
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
