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
    <form action={formAction} className="flex flex-col gap-4">
      {justReset && (
        <div className="bg-sage-50 border border-sage-200 text-sage-800 text-sm rounded-md px-4 py-3">
          Password updated — please sign in with your new password.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-ink/80">Email address</label>
        <input
          ref={emailRef}
          id="email" name="email" type="email" required autoComplete="email"
          placeholder="you@bodhigrove.demo"
          className="w-full border border-sand rounded-md px-3 py-2 text-sm bg-white text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-mist focus:border-transparent"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="text-sm font-medium text-ink/80">Password</label>
          <Link href="/forgot-password" className="text-xs text-gold-600 hover:text-gold-700 font-medium">Forgot password?</Link>
        </div>
        <input
          ref={passwordRef}
          id="password" name="password" type="password" required autoComplete="current-password"
          placeholder="••••••••"
          className="w-full border border-sand rounded-md px-3 py-2 text-sm bg-white text-ink placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-mist focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-sage-600 hover:bg-sage-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-md text-sm transition-colors shadow-sm"
      >
        {pending ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}
