'use client'

import { useActionState, useState } from 'react'
import { createSlot, updateSlot } from '@/lib/actions'
import { DUTIES, LOCATIONS, type ActionResult, type Slot } from '@/lib/types'

interface Props { slot: Slot | null }

export default function SlotForm({ slot }: Props) {
  const action = slot ? updateSlot : createSlot
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null)
  const [timeError, setTimeError] = useState<string | null>(null)
  const error = timeError ?? (state && 'error' in state ? state.error : null)

  const fieldCls = 'w-full border border-stone-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent'
  const labelCls = 'block text-sm font-medium text-stone-700 mb-1'

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
      className="bg-white border border-stone-200 rounded-xl shadow-sm p-6 space-y-5"
    >
      {slot && <input type="hidden" name="id" value={slot.id} />}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Date <span className="text-red-500">*</span></label>
          <input type="date" name="date" required defaultValue={slot?.date ?? ''} className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Duty <span className="text-red-500">*</span></label>
          <select name="duty" required defaultValue={slot?.duty ?? ''} className={fieldCls}>
            <option value="">Select duty…</option>
            {DUTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Start Time <span className="text-red-500">*</span></label>
          <input type="time" name="startTime" required defaultValue={slot?.start_time.slice(0, 5) ?? ''} className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>End Time <span className="text-red-500">*</span></label>
          <input type="time" name="endTime" required defaultValue={slot?.end_time.slice(0, 5) ?? ''} className={fieldCls} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Location <span className="text-red-500">*</span></label>
          <select name="location" required defaultValue={slot?.location ?? ''} className={fieldCls}>
            <option value="">Select location…</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Max Volunteers <span className="text-red-500">*</span></label>
          <input type="number" name="maxVolunteers" min={1} max={20} required
            defaultValue={slot?.max_volunteers ?? 1} className={fieldCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea name="notes" rows={3} defaultValue={slot?.notes ?? ''} placeholder="Any special instructions…"
          className={`${fieldCls} resize-none`} />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-stone-100">
        <a href="/admin/schedule" className="text-sm px-4 py-2 border border-stone-300 rounded-md text-stone-700 hover:bg-stone-50 transition-colors">
          Cancel
        </a>
        <button type="submit" disabled={pending}
          className="text-sm px-4 py-2 bg-sage-600 hover:bg-sage-700 disabled:opacity-60 text-white rounded-md transition-colors">
          {pending ? 'Saving…' : slot ? 'Save Changes' : 'Create Slot'}
        </button>
      </div>
    </form>
  )
}
