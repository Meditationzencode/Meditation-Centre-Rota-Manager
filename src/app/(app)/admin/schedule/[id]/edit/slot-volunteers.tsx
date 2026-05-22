'use client'

import { useActionState } from 'react'
import { adminAssignVolunteer, adminRemoveVolunteer } from '@/lib/actions'
import type { ActionResult } from '@/lib/types'

interface Vol { id: string; name: string }

interface Props {
  slotId: string
  signed: Vol[]
  available: Vol[]
  maxVolunteers: number
}

export default function SlotVolunteers({ slotId, signed, available, maxVolunteers }: Props) {
  const [assignState, assignAction, assignPending] = useActionState<ActionResult | null, FormData>(adminAssignVolunteer, null)
  const [removeState, removeAction, removePending] = useActionState<ActionResult | null, FormData>(adminRemoveVolunteer, null)

  const isFull = signed.length >= maxVolunteers
  const error =
    (assignState && 'error' in assignState ? assignState.error : null) ??
    (removeState && 'error' in removeState ? removeState.error : null)

  const fieldCls = 'border border-stone-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent'

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-800">Volunteers</h2>
        <span className="text-xs text-stone-500">{signed.length} / {maxVolunteers} filled</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}

      {signed.length === 0 ? (
        <p className="text-sm text-stone-400">No volunteers assigned yet.</p>
      ) : (
        <ul className="space-y-2">
          {signed.map(vol => (
            <li key={vol.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {vol.name.charAt(0)}
                </div>
                <span className="text-sm text-stone-700">{vol.name}</span>
              </div>
              <form action={removeAction}>
                <input type="hidden" name="slotId" value={slotId} />
                <input type="hidden" name="userId" value={vol.id} />
                <button
                  type="submit"
                  disabled={removePending}
                  className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-2 border-t border-stone-100">
        {isFull ? (
          <p className="text-xs text-stone-400">Slot is full — remove a volunteer to assign another.</p>
        ) : available.length === 0 ? (
          <p className="text-xs text-stone-400">All active volunteers are already signed up.</p>
        ) : (
          <form action={assignAction} className="flex gap-2">
            <input type="hidden" name="slotId" value={slotId} />
            <select name="userId" className={`${fieldCls} flex-1`} defaultValue="">
              <option value="" disabled>Select volunteer…</option>
              {available.map(vol => (
                <option key={vol.id} value={vol.id}>{vol.name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={assignPending}
              className="text-sm px-4 py-2 bg-sage-600 hover:bg-sage-700 disabled:opacity-60 text-white rounded-md transition-colors whitespace-nowrap"
            >
              {assignPending ? 'Adding…' : 'Assign'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
