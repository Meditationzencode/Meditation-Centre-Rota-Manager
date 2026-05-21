'use client'

import { useActionState } from 'react'
import { requestPasswordReset } from '@/lib/actions'
import type { ActionResult } from '@/lib/types'

export default function ForgotForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(requestPasswordReset, null)
  const sent = state && 'success' in state

  const fieldCls = 'w-full border border-stone-300 rounded-md px-3 py-2 text-sm bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent'

  if (sent) {
    return (
      <div className="bg-sage-50 border border-sage-200 text-sage-800 rounded-md px-4 py-4 text-sm space-y-1">
        <p className="font-medium">Check your inbox</p>
        <p className="text-sage-700">If that email address is registered, a reset link has been sent. It expires in one hour.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state && 'error' in state && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{state.error}</div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-stone-700">Email address</label>
        <input
          id="email" name="email" type="email" required autoComplete="email"
          placeholder="you@bodhigrove.demo"
          className={fieldCls}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-sage-600 hover:bg-sage-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-md text-sm transition-colors"
      >
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
