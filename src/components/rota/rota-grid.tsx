'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUpForSlot, cancelSignup } from '@/lib/actions'
import { fmtTime } from '@/lib/utils'
import type { ActionResult } from '@/lib/types'

interface SlotData {
  id: string
  duty: string
  location: string
  start_time: string
  end_time: string
  max_volunteers: number
  notes: string
  signups: unknown[]
  mySignup: boolean
  spotsLeft: number
  volunteers: string[]
}

interface DayData {
  date: string
  label: string
  slots: SlotData[]
}

interface Props {
  days:       DayData[]
  weekStart:  string
  isManager:  boolean
  userId:     string
}

export default function RotaGrid({ days, weekStart, isManager, userId }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
      {days.map(day => (
        <div key={day.date} className="flex flex-col">
          <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-stone-500 bg-stone-100 border border-stone-200 rounded-t-lg px-2 py-1.5">
            {day.label.split(' ').slice(0, 1)} <span className="text-stone-400 font-normal">{day.label.split(' ').slice(1).join(' ')}</span>
          </div>
          <div className="flex-1 border border-t-0 border-stone-200 rounded-b-lg bg-white p-1.5 space-y-1.5 min-h-[80px]">
            {day.slots.length === 0 ? (
              <p className="text-[11px] text-stone-300 text-center py-3">—</p>
            ) : day.slots.map(slot => (
              <SlotCard
                key={slot.id}
                slot={slot}
                weekStart={weekStart}
                isManager={isManager}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SlotCard({ slot, weekStart, isManager }: { slot: SlotData; weekStart: string; isManager: boolean }) {
  const [signupState,  signupAction,  signupPending]  = useActionState<ActionResult | null, FormData>(signUpForSlot,  null)
  const [cancelState,  cancelAction,  cancelPending]  = useActionState<ActionResult | null, FormData>(cancelSignup,   null)

  const borderClass = slot.mySignup
    ? 'border-sage-400 bg-sage-50'
    : slot.spotsLeft <= 0
    ? 'border-red-200 bg-red-50/50'
    : slot.spotsLeft === 1
    ? 'border-amber-200 bg-amber-50/50'
    : 'border-stone-200 bg-stone-50'

  return (
    <div className={`border rounded-md p-1.5 text-[11px] transition-colors ${borderClass}`}>
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

      <p className="font-semibold text-stone-800 leading-tight">{slot.duty}</p>
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
        {slot.mySignup ? (
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

      {/* Inline error */}
      {(signupState && 'error' in signupState) && (
        <p className="text-red-600 text-[10px] mt-1">{signupState.error}</p>
      )}
      {(cancelState && 'error' in cancelState) && (
        <p className="text-red-600 text-[10px] mt-1">{cancelState.error}</p>
      )}
    </div>
  )
}
