'use client'

import { useActionState } from 'react'
import { adminAssignVolunteer, adminRemoveVolunteer } from '@/lib/actions'
import type { ActionResult } from '@/lib/types'
import { formField as fieldCls } from '@/lib/form-styles'

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

  return (
    <div className="bg-white border border-sand/70 rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Volunteers</h2>
        <span className="text-xs text-ink/55">{signed.length} / {maxVolunteers} filled</span>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}

      {signed.length === 0 ? (
        <p className="text-sm text-ink/45">No volunteers assigned yet.</p>
      ) : (
        <ul className="space-y-2">
          {signed.map(vol => (
            <li key={vol.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {vol.name.charAt(0)}
                </div>
                <span className="text-sm text-ink/70">{vol.name}</span>
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

      <div className="pt-2 border-t border-sand/50">
        {isFull ? (
          <p className="text-xs text-ink/45">Slot is full — remove a volunteer to assign another.</p>
        ) : available.length === 0 ? (
          <p className="text-xs text-ink/45">All active volunteers are already signed up.</p>
        ) : (
          <form action={assignAction} className="flex gap-2">
            <input type="hidden" name="slotId" value={slotId} />
            <select name="userId" aria-label="Select volunteer to assign" className={`${fieldCls} flex-1`} defaultValue="">
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
