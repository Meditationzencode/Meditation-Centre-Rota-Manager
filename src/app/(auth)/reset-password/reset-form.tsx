'use client'

import { useActionState } from 'react'
import { resetPassword } from '@/lib/actions'
import type { ActionResult } from '@/lib/types'

export default function ResetForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(resetPassword, null)
  const error = state && 'error' in state ? state.error : null

  const fieldCls = 'w-full border border-stone-300 rounded-md px-3 py-2 text-sm bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent'

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-stone-700">New password</label>
        <input
          id="password" name="password" type="password" required minLength={8}
          autoComplete="new-password" placeholder="••••••••"
          className={fieldCls}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-stone-700">Confirm password</label>
        <input
          id="confirmPassword" name="confirmPassword" type="password" required
          autoComplete="new-password" placeholder="••••••••"
          className={fieldCls}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-sage-600 hover:bg-sage-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-md text-sm transition-colors"
      >
        {pending ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  )
}
