'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUpForSlot, cancelSignup, requestSwap } from '@/lib/actions'
import { createClient } from '@/lib/supabase/client'
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
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    // Subscribe to any change in slots or signups — when another user signs up,
    // cancels, or an admin edits a slot, this fires and re-fetches server data.
    const channel = supabase
      .channel('rota-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' },   () => router.refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signups' }, () => router.refresh())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [router])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
      {days.map(day => {
        const isToday = day.date === today
        return (
          <div key={day.date} className="flex flex-col">
            <div className={`text-center text-[11px] font-semibold uppercase tracking-[0.12em] border rounded-t-lg px-2 py-1.5 ${
              isToday
                ? 'bg-sage-600 text-white border-sage-500'
                : 'text-ink/55 bg-paper-100 border-sand/60'
            }`}>
              {day.label.split(' ').slice(0, 1)}{' '}
              <span className={isToday ? 'text-sage-100 font-normal' : 'text-ink/35 font-normal'}>
                {day.label.split(' ').slice(1).join(' ')}
              </span>
            </div>
            <div className={`flex-1 border border-t-0 rounded-b-lg p-1.5 space-y-1.5 min-h-[80px] ${
              isToday ? 'border-sage-300 bg-sage-50/40' : 'border-sand/60 bg-white'
            }`}>
              {day.slots.length === 0 ? (
                <p className="text-[11px] text-ink/30 text-center py-3">—</p>
              ) : day.slots.map(slot => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  weekStart={weekStart}
                  isManager={isManager}
                  canSignUp={canSignUp}
                  hasOtherSignupOnDay={day.slots.some(s => s.id !== slot.id && s.mySignup)}
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
  hasOtherSignupOnDay,
}: {
  slot: SlotData
  weekStart: string
  isManager: boolean
  canSignUp: boolean
  hasOtherSignupOnDay: boolean
}) {
  const [showSwapForm, setShowSwapForm] = useState(false)

  const [signupState, signupAction, signupPending] = useActionState<ActionResult | null, FormData>(signUpForSlot, null)
  const [cancelState, cancelAction, cancelPending] = useActionState<ActionResult | null, FormData>(cancelSignup,  null)
  const [swapState,   swapAction,   swapPending]   = useActionState<ActionResult | null, FormData>(requestSwap,   null)

  const isCancelled = slot.status === 'cancelled'

  const statusBg = isCancelled
    ? 'border-sand bg-paper-100 opacity-60'
    : slot.mySignup
    ? 'border-sage-400 bg-sage-50'
    : slot.spotsLeft <= 0
    ? 'border-red-200 bg-red-50/40'
    : slot.spotsLeft === 1
    ? 'border-gold-200 bg-gold-50/50'
    : 'border-sand/70 bg-paper-50'

  const leftAccent = isCancelled ? 'border-l-sand' : dutyBorder(slot.duty)
  const swapSubmitted = swapState && 'success' in swapState

  return (
    <div className={`border-l-[3px] ${leftAccent} border rounded-md p-1.5 text-[11px] transition-colors ${statusBg}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-ink/45 font-medium">{fmtTime(slot.start_time)}–{fmtTime(slot.end_time)}</span>
        <span className={`font-semibold px-1 py-0.5 rounded text-[10px] ${
          slot.spotsLeft <= 0
            ? 'bg-red-100 text-red-600'
            : slot.spotsLeft === 1
            ? 'bg-gold-100 text-gold-700'
            : 'bg-sage-100 text-sage-700'
        }`}>
          {slot.signups.length}/{slot.max_volunteers}
        </span>
      </div>

      <Link href={`/rota/${slot.id}`} className="font-semibold text-ink leading-tight hover:text-sage-700 transition-colors block">
        {slot.duty}
      </Link>
      {isCancelled && (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink/55 bg-sand/60 px-1.5 py-0.5 rounded">
          Cancelled
        </span>
      )}
      <p className="text-ink/45 flex items-center gap-0.5">
        <span>📍</span> {slot.location}
      </p>

      {slot.volunteers.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-1">
          {slot.volunteers.map((v, i) => (
            <span key={i} className="bg-white border border-sand/70 rounded-full px-1.5 py-0.5 text-[10px] text-ink/65">
              {v.split(' ')[0]}
            </span>
          ))}
        </div>
      )}

      {slot.notes && (
        <p className="text-ink/45 italic mt-1 text-[10px]">{slot.notes}</p>
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
                  className="text-[10px] font-medium px-1.5 py-0.5 bg-gold-100 text-gold-700 border border-gold-200 rounded hover:bg-gold-200 disabled:opacity-50 transition-colors"
                >
                  {cancelPending ? '…' : 'Cancel'}
                </button>
              </form>

              {!slot.swapPending && !swapSubmitted && !showSwapForm && (
                <button
                  onClick={() => setShowSwapForm(true)}
                  className="text-[10px] font-medium px-1.5 py-0.5 bg-mist/20 text-sage-800 border border-mist/40 rounded hover:bg-mist/30 transition-colors"
                >
                  Swap?
                </button>
              )}
              {(slot.swapPending || swapSubmitted) && (
                <span className="text-[10px] text-ink/40 italic">Swap pending</span>
              )}
            </>
          ) : slot.spotsLeft > 0 ? (
            <>
              <form action={signupAction}>
                <input type="hidden" name="slotId" value={slot.id} />
                <input type="hidden" name="weekStart" value={weekStart} />
                <button
                  type="submit"
                  disabled={signupPending}
                  className="text-[10px] font-medium px-1.5 py-0.5 bg-sage-600 text-white rounded hover:bg-sage-700 disabled:opacity-50 transition-colors"
                >
                  {signupPending ? '…' : 'Sign up'}
                </button>
              </form>
              {hasOtherSignupOnDay && (
                <p className="text-[10px] text-gold-700 mt-0.5">You have a shift on this day</p>
              )}
            </>
          ) : (
            <span className="text-[10px] text-ink/40 italic">Full</span>
          )
        )}

        {!canSignUp && slot.spotsLeft <= 0 && (
          <span className="text-[10px] text-ink/40 italic">Full</span>
        )}

        {isManager && (
          <Link
            href={`/admin/schedule/${slot.id}/edit`}
            title="Edit slot"
            aria-label={`Edit ${slot.duty}`}
            className="w-6 h-6 inline-flex items-center justify-center rounded text-ink/55 hover:text-sage-700 hover:bg-sage-100/60 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
            </svg>
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
            className="w-full text-[10px] border border-sand rounded px-1.5 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-mist"
          />
          <div className="flex gap-1">
            <button
              type="submit"
              disabled={swapPending}
              className="text-[10px] font-medium px-1.5 py-0.5 bg-sage-600 text-white rounded hover:bg-sage-700 disabled:opacity-50 transition-colors"
            >
              {swapPending ? '…' : 'Request'}
            </button>
            <button
              type="button"
              onClick={() => setShowSwapForm(false)}
              className="text-[10px] font-medium px-1.5 py-0.5 bg-paper-100 text-ink/65 border border-sand rounded hover:bg-paper-200 transition-colors"
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
