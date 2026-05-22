'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signUpForSlot, cancelSignup, requestSwap } from '@/lib/actions'
import { fmtTime } from '@/lib/utils'
import { dutyBorder } from '@/lib/duty-colors'
import type { ActionResult } from '@/lib/types'

interface SlotData {
  id: string
  duty: string
  location: string
  start_time: string
  end_time: string
  max_volunteers: number
  notes: string
  status: string
  signups: unknown[]
  mySignup: boolean
  spotsLeft: number
  swapPending: boolean
  volunteers: string[]
}

interface DayData {
  date: string
  label: string
  slots: SlotData[]
}

interface Props {
  days:      DayData[]
  weekStart: string
  isManager: boolean
  canSignUp: boolean
  userId:    string
  today:     string
}

export default function RotaGrid({ days, weekStart, isManager, canSignUp, today }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
      {days.map(day => {
        const isToday = day.date === today
        return (
          <div key={day.date} className="flex flex-col">
            <div className={`text-center text-[11px] font-semibold uppercase tracking-wider border rounded-t-lg px-2 py-1.5 ${
              isToday
                ? 'bg-sage-600 text-white border-sage-500'
                : 'text-stone-500 bg-stone-100 border-stone-200'
            }`}>
              {day.label.split(' ').slice(0, 1)}{' '}
              <span className={isToday ? 'text-sage-100 font-normal' : 'text-stone-400 font-normal'}>
                {day.label.split(' ').slice(1).join(' ')}
              </span>
            </div>
            <div className={`flex-1 border border-t-0 rounded-b-lg p-1.5 space-y-1.5 min-h-[80px] ${
              isToday ? 'border-sage-300 bg-sage-50/30' : 'border-stone-200 bg-white'
            }`}>
              {day.slots.length === 0 ? (
                <p className="text-[11px] text-stone-300 text-center py-3">—</p>
              ) : day.slots.map(slot => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  weekStart={weekStart}
                  isManager={isManager}
                  canSignUp={canSignUp}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SlotCard({
  slot,
  weekStart,
  isManager,
  canSignUp,
}: {
  slot: SlotData
  weekStart: string
  isManager: boolean
  canSignUp: boolean
}) {
  const [showSwapForm, setShowSwapForm] = useState(false)

  const [signupState, signupAction, signupPending] = useActionState<ActionResult | null, FormData>(signUpForSlot, null)
  const [cancelState, cancelAction, cancelPending] = useActionState<ActionResult | null, FormData>(cancelSignup,  null)
  const [swapState,   swapAction,   swapPending]   = useActionState<ActionResult | null, FormData>(requestSwap,   null)

  const isCancelled = slot.status === 'cancelled'

  const statusBg = isCancelled
    ? 'border-stone-200 bg-stone-100 opacity-60'
    : slot.mySignup
    ? 'border-sage-400 bg-sage-50'
    : slot.spotsLeft <= 0
    ? 'border-red-200 bg-red-50/50'
    : slot.spotsLeft === 1
    ? 'border-amber-200 bg-amber-50/50'
    : 'border-stone-200 bg-stone-50'

  const leftAccent = isCancelled ? 'border-l-stone-300' : dutyBorder(slot.duty)
  const swapSubmitted = swapState && 'success' in swapState

  return (
    <div className={`border-l-[3px] ${leftAccent} border rounded-md p-1.5 text-[11px] transition-colors ${statusBg}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-stone-400 font-medium">{fmtTime(slot.start_time)}–{fmtTime(slot.end_time)}</span>
        <span className={`font-semibold px-1 py-0.5 rounded text-[10px] ${
          slot.spotsLeft <= 0
            ? 'bg-red-100 text-red-600'
            : slot.spotsLeft === 1
            ? 'bg-amber-100 text-amber-600'
            : 'bg-sage-100 text-sage-600'
        }`}>
          {slot.signups.length}/{slot.max_volunteers}
        </span>
      </div>

      <Link href={`/rota/${slot.id}`} className="font-semibold text-stone-800 leading-tight hover:text-teal-700 transition-colors block">
        {slot.duty}
      </Link>
      {isCancelled && (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">
          Cancelled
        </span>
      )}
      <p className="text-stone-400 flex items-center gap-0.5">
        <span>📍</span> {slot.location}
      </p>

      {slot.volunteers.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-1">
          {slot.volunteers.map((v, i) => (
            <span key={i} className="bg-white border border-stone-200 rounded-full px-1.5 py-0.5 text-[10px] text-stone-600">
              {v.split(' ')[0]}
            </span>
          ))}
        </div>
      )}

      {slot.notes && (
        <p className="text-stone-400 italic mt-1 text-[10px]">{slot.notes}</p>
      )}

      {/* Actions */}
      <div className="flex gap-1 mt-1.5 flex-wrap">
        {canSignUp && (
          slot.mySignup ? (
            <>
              <form action={cancelAction}>
                <input type="hidden" name="slotId" value={slot.id} />
                <input type="hidden" name="weekStart" value={weekStart} />
                <button
                  type="submit"
                  disabled={cancelPending}
                  className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 rounded hover:bg-amber-200 disabled:opacity-50 transition-colors"
                >
                  {cancelPending ? '…' : 'Cancel'}
                </button>
              </form>

              {!slot.swapPending && !swapSubmitted && !showSwapForm && (
                <button
                  onClick={() => setShowSwapForm(true)}
                  className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                >
                  Swap?
                </button>
              )}
              {(slot.swapPending || swapSubmitted) && (
                <span className="text-[10px] text-stone-400 italic">Swap pending</span>
              )}
            </>
          ) : slot.spotsLeft > 0 ? (
            <form action={signupAction}>
              <input type="hidden" name="slotId" value={slot.id} />
              <input type="hidden" name="weekStart" value={weekStart} />
              <button
                type="submit"
                disabled={signupPending}
                className="text-[10px] font-medium px-1.5 py-0.5 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {signupPending ? '…' : 'Sign up'}
              </button>
            </form>
          ) : (
            <span className="text-[10px] text-stone-400 italic">Full</span>
          )
        )}

        {!canSignUp && slot.spotsLeft <= 0 && (
          <span className="text-[10px] text-stone-400 italic">Full</span>
        )}

        {isManager && (
          <Link
            href={`/admin/schedule/${slot.id}/edit`}
            className="text-[10px] font-medium px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded hover:bg-teal-100 transition-colors"
          >
            Edit
          </Link>
        )}
      </div>

      {/* Inline swap form */}
      {showSwapForm && !swapSubmitted && (
        <form
          action={swapAction}
          className="mt-1.5 space-y-1"
          onSubmit={() => setShowSwapForm(false)}
        >
          <input type="hidden" name="slotId" value={slot.id} />
          <textarea
            name="reason"
            placeholder="Reason (optional)"
            rows={2}
            className="w-full text-[10px] border border-stone-300 rounded px-1.5 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <div className="flex gap-1">
            <button
              type="submit"
              disabled={swapPending}
              className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {swapPending ? '…' : 'Request'}
            </button>
            <button
              type="button"
              onClick={() => setShowSwapForm(false)}
              className="text-[10px] font-medium px-1.5 py-0.5 bg-stone-100 text-stone-600 border border-stone-300 rounded hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {signupState && 'error' in signupState && (
        <p className="text-red-600 text-[10px] mt-1">{signupState.error}</p>
      )}
      {cancelState && 'error' in cancelState && (
        <p className="text-red-600 text-[10px] mt-1">{cancelState.error}</p>
      )}
      {swapState && 'error' in swapState && (
        <p className="text-red-600 text-[10px] mt-1">{swapState.error}</p>
      )}
    </div>
  )
}
