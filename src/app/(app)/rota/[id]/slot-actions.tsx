'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signUpForSlot, cancelSignup, requestSwap } from '@/lib/actions'
import type { ActionResult } from '@/lib/types'

interface Props {
  slotId:      string
  weekStart:   string
  mySignup:    boolean
  swapPending: boolean
  spotsLeft:   number
  canSignUp:   boolean
  isManager:   boolean
}

export default function SlotActions({
  slotId, weekStart, mySignup, swapPending, spotsLeft, canSignUp, isManager,
}: Props) {
  const [showSwapForm, setShowSwapForm] = useState(false)

  const [signupState, signupAction, signupPending] = useActionState<ActionResult | null, FormData>(signUpForSlot, null)
  const [cancelState, cancelAction, cancelPending] = useActionState<ActionResult | null, FormData>(cancelSignup, null)
  const [swapState,   swapAction,   swapPending2]  = useActionState<ActionResult | null, FormData>(requestSwap, null)

  const swapSubmitted = swapState && 'success' in swapState
  const hasActions = canSignUp || isManager

  if (!hasActions) return null

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 space-y-4">
      <h2 className="font-serif text-base font-medium">Actions</h2>

      <div className="flex flex-wrap gap-2">
        {canSignUp && (
          mySignup ? (
            <>
              <form action={cancelAction}>
                <input type="hidden" name="slotId"    value={slotId} />
                <input type="hidden" name="weekStart" value={weekStart} />
                <button
                  type="submit"
                  disabled={cancelPending}
                  className="text-sm font-medium px-4 py-2 bg-amber-100 text-amber-700 border border-amber-300 rounded-md hover:bg-amber-200 disabled:opacity-50 transition-colors"
                >
                  {cancelPending ? 'Cancelling…' : 'Cancel sign-up'}
                </button>
              </form>

              {!swapPending && !swapSubmitted && !showSwapForm && (
                <button
                  onClick={() => setShowSwapForm(true)}
                  className="text-sm font-medium px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Request swap
                </button>
              )}
              {(swapPending || swapSubmitted) && (
                <span className="text-sm text-stone-400 italic self-center">Swap request pending</span>
              )}
            </>
          ) : spotsLeft > 0 ? (
            <form action={signupAction}>
              <input type="hidden" name="slotId"    value={slotId} />
              <input type="hidden" name="weekStart" value={weekStart} />
              <button
                type="submit"
                disabled={signupPending}
                className="text-sm font-medium px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {signupPending ? 'Signing up…' : 'Sign up for this shift'}
              </button>
            </form>
          ) : (
            <span className="text-sm text-stone-400 italic self-center">This slot is full.</span>
          )
        )}

        {isManager && (
          <Link
            href={`/admin/schedule/${slotId}/edit`}
            className="text-sm font-medium px-4 py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-md hover:bg-teal-100 transition-colors"
          >
            Edit shift
          </Link>
        )}
      </div>

      {showSwapForm && !swapSubmitted && (
        <form action={swapAction} className="space-y-3" onSubmit={() => setShowSwapForm(false)}>
          <input type="hidden" name="slotId" value={slotId} />
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Reason for swap <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="reason"
              rows={3}
              className="w-full text-sm border border-stone-300 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="Let the coordinator know why you need a swap."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={swapPending2}
              className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {swapPending2 ? 'Submitting…' : 'Submit request'}
            </button>
            <button
              type="button"
              onClick={() => setShowSwapForm(false)}
              className="text-sm font-medium px-4 py-2 bg-stone-100 text-stone-600 border border-stone-300 rounded-md hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {signupState && 'error' in signupState && (
        <p className="text-sm text-red-600">{signupState.error}</p>
      )}
      {cancelState && 'error' in cancelState && (
        <p className="text-sm text-red-600">{cancelState.error}</p>
      )}
      {swapState && 'error' in swapState && (
        <p className="text-sm text-red-600">{swapState.error}</p>
      )}
    </div>
  )
}
