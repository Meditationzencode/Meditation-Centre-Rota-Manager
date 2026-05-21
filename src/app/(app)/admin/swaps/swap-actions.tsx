'use client'

import { useActionState } from 'react'
import { reviewSwap } from '@/lib/actions'
import type { ActionResult } from '@/lib/types'

export default function SwapActions({ swapId }: { swapId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(reviewSwap, null)

  if (state && 'success' in state) {
    return <span className="text-xs text-stone-400 italic">Done</span>
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 flex-shrink-0 min-w-[160px]">
      <input type="hidden" name="swapId" value={swapId} />
      <textarea
        name="adminNotes"
        rows={2}
        placeholder="Notes (optional)"
        className="text-xs border border-stone-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-sage-500 w-full"
      />
      {state && 'error' in state && (
        <p className="text-red-600 text-xs">{state.error}</p>
      )}
      <div className="flex gap-1.5">
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          className="flex-1 text-xs font-medium px-2 py-1.5 bg-sage-600 hover:bg-sage-700 text-white rounded-md disabled:opacity-50 transition-colors"
        >
          {pending ? '…' : 'Approve'}
        </button>
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={pending}
          className="flex-1 text-xs font-medium px-2 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-50 disabled:opacity-50 transition-colors"
        >
          {pending ? '…' : 'Reject'}
        </button>
      </div>
    </form>
  )
}
