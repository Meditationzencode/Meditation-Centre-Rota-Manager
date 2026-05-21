'use client'

import { useActionState } from 'react'
import { reviewSwap } from '@/lib/actions'
import type { ActionResult } from '@/lib/types'

export default function SwapActions({ swapId }: { swapId: string }) {
  const [approveState, approveAction, approvePending] = useActionState<ActionResult | null, FormData>(reviewSwap, null)
  const [rejectState,  rejectAction,  rejectPending]  = useActionState<ActionResult | null, FormData>(reviewSwap, null)

  if (approveState && 'success' in approveState) {
    return <span className="text-xs text-sage-700 font-medium">Approved</span>
  }
  if (rejectState && 'success' in rejectState) {
    return <span className="text-xs text-red-600 font-medium">Rejected</span>
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      {(approveState && 'error' in approveState) && (
        <p className="text-red-600 text-xs">{approveState.error}</p>
      )}
      {(rejectState && 'error' in rejectState) && (
        <p className="text-red-600 text-xs">{rejectState.error}</p>
      )}
      <form action={approveAction}>
        <input type="hidden" name="swapId"   value={swapId} />
        <input type="hidden" name="decision" value="approved" />
        <button
          type="submit"
          disabled={approvePending || rejectPending}
          className="text-xs font-medium px-3 py-1.5 bg-sage-600 hover:bg-sage-700 text-white rounded-md disabled:opacity-50 transition-colors"
        >
          {approvePending ? '…' : 'Approve'}
        </button>
      </form>
      <form action={rejectAction}>
        <input type="hidden" name="swapId"   value={swapId} />
        <input type="hidden" name="decision" value="rejected" />
        <button
          type="submit"
          disabled={approvePending || rejectPending}
          className="text-xs font-medium px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-md hover:bg-stone-50 disabled:opacity-50 transition-colors"
        >
          {rejectPending ? '…' : 'Reject'}
        </button>
      </form>
    </div>
  )
}
