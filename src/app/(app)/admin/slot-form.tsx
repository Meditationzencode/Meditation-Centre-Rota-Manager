'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { createSlot, updateSlot } from '@/lib/actions'
import { DUTIES, LOCATIONS, type ActionResult, type Slot } from '@/lib/types'
import { formField as fieldCls, formLabel as labelCls, formCancelBtn } from '@/lib/form-styles'

interface Props { slot: Slot | null }

export default function SlotForm({ slot }: Props) {
  const action = slot ? updateSlot : createSlot
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null)
  const [timeError, setTimeError] = useState<string | null>(null)
  const error = timeError ?? (state && 'error' in state ? state.error : null)

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const f = e.currentTarget
        const start = (f.elements.namedItem('startTime') as HTMLInputElement)?.value
        const end   = (f.elements.namedItem('endTime')   as HTMLInputElement)?.value
        if (start && end && start >= end) {
          e.preventDefault()
          setTimeError('Start time must be before end time.')
        } else {
          setTimeError(null)
        }
      }}
      className="bg-white border border-sand/70 rounded-xl shadow-sm p-6 space-y-5"
    >
      {slot && <input type="hidden" name="id" value={slot.id} />}

      {!slot && (
        <p className="text-sm text-ink/55 -mt-1">
          Create a one-off rota slot. Use{' '}
          <Link href="/admin/schedule/recurring" className="text-sage-700 hover:underline">Recurring Schedule</Link>{' '}
          for repeated weekly duties.
        </p>
      )}

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="slot-date" className={labelCls}>Date <span className="text-red-500">*</span></label>
          <input id="slot-date" type="date" name="date" required defaultValue={slot?.date ?? ''} className={fieldCls} />
        </div>
        <div>
          <label htmlFor="slot-duty" className={labelCls}>Duty <span className="text-red-500">*</span></label>
          <select id="slot-duty" name="duty" required defaultValue={slot?.duty ?? ''} className={fieldCls}>
            <option value="">Select duty…</option>
            {DUTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="slot-start" className={labelCls}>Start Time <span className="text-red-500">*</span></label>
          <input id="slot-start" type="time" name="startTime" required defaultValue={slot?.start_time.slice(0, 5) ?? ''} className={fieldCls} />
        </div>
        <div>
          <label htmlFor="slot-end" className={labelCls}>End Time <span className="text-red-500">*</span></label>
          <input id="slot-end" type="time" name="endTime" required defaultValue={slot?.end_time.slice(0, 5) ?? ''} className={fieldCls} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="slot-location" className={labelCls}>Location <span className="text-red-500">*</span></label>
          <select id="slot-location" name="location" required defaultValue={slot?.location ?? ''} className={fieldCls}>
            <option value="">Select location…</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="slot-max" className={labelCls}>Max Volunteers <span className="text-red-500">*</span></label>
          <input id="slot-max" type="number" name="maxVolunteers" min={1} max={20} required
            defaultValue={slot?.max_volunteers ?? 1} className={fieldCls} />
          <p className="text-xs text-ink/50 mt-1.5">Set this higher for group duties such as garden maintenance.</p>
        </div>
      </div>

      <div>
        <label htmlFor="slot-notes" className={labelCls}>Notes</label>
        <textarea id="slot-notes" name="notes" rows={3} defaultValue={slot?.notes ?? ''} placeholder="Any special instructions…"
          className={`${fieldCls} resize-none`} />
      </div>

      {slot && (
        <div>
          <label htmlFor="slot-status" className={labelCls}>Status</label>
          <select id="slot-status" name="status" defaultValue={slot.status ?? 'open'} className={fieldCls}>
            <option value="open">Open</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-sand/50">
        <Link href="/admin/schedule" className={formCancelBtn}>
          Cancel
        </Link>
        <button type="submit" disabled={pending}
          className="text-sm px-4 py-2 bg-sage-600 hover:bg-sage-700 disabled:opacity-60 text-white rounded-md transition-colors">
          {pending ? 'Saving…' : slot ? 'Save Changes' : 'Create Slot'}
        </button>
      </div>
    </form>
  )
}
