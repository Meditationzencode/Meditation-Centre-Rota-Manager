'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { createTemplate, updateTemplate } from '@/lib/actions'
import { DUTIES, LOCATIONS, type ActionResult, type RecurringTemplate } from '@/lib/types'
import { formField as fieldCls, formLabel as labelCls, formCancelBtn } from '@/lib/form-styles'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props { template: RecurringTemplate | null }

export default function RecurringTemplateForm({ template }: Props) {
  const action = template ? updateTemplate : createTemplate
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null)
  const [timeError, setTimeError] = useState<string | null>(null)
  const [days, setDays] = useState<number[]>(template?.days_of_week ?? [])

  const error = timeError ?? (state && 'error' in state ? state.error : null)

  function toggleDay(i: number) {
    setDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i].sort((a, b) => a - b))
  }

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
      {template && <input type="hidden" name="id" value={template.id} />}

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}

      {/* Days of week */}
      <div>
        <span className={labelCls}>Days of week <span className="text-red-500">*</span></span>
        <div className="flex flex-wrap gap-2 mt-1">
          {DAY_LABELS.map((label, i) => (
            <label key={i} className="cursor-pointer">
              <input
                type="checkbox"
                name="daysOfWeek"
                value={i}
                checked={days.includes(i)}
                onChange={() => toggleDay(i)}
                className="sr-only"
              />
              <span className={`inline-block px-3 py-1.5 rounded-md text-sm font-medium border transition-colors select-none ${
                days.includes(i)
                  ? 'bg-sage-600 text-white border-sage-600'
                  : 'bg-white text-ink/65 border-sand hover:border-mist'
              }`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tpl-duty" className={labelCls}>Duty <span className="text-red-500">*</span></label>
          <select id="tpl-duty" name="duty" required defaultValue={template?.duty ?? ''} className={fieldCls}>
            <option value="">Select duty…</option>
            {DUTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="tpl-location" className={labelCls}>Location <span className="text-red-500">*</span></label>
          <select id="tpl-location" name="location" required defaultValue={template?.location ?? ''} className={fieldCls}>
            <option value="">Select location…</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tpl-start" className={labelCls}>Start Time <span className="text-red-500">*</span></label>
          <input id="tpl-start" type="time" name="startTime" required defaultValue={template?.start_time.slice(0, 5) ?? ''} className={fieldCls} />
        </div>
        <div>
          <label htmlFor="tpl-end" className={labelCls}>End Time <span className="text-red-500">*</span></label>
          <input id="tpl-end" type="time" name="endTime" required defaultValue={template?.end_time.slice(0, 5) ?? ''} className={fieldCls} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tpl-max" className={labelCls}>Max Volunteers <span className="text-red-500">*</span></label>
          <input id="tpl-max" type="number" name="maxVolunteers" min={1} max={20} required
            defaultValue={template?.max_volunteers ?? 1} className={fieldCls} />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="hidden" name="active" value="false" />
            <input
              type="checkbox"
              name="active"
              value="true"
              defaultChecked={template?.active ?? true}
              className="w-4 h-4 accent-sage-600"
            />
            <span className="text-sm font-medium text-ink/80">Active (generates slots)</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="tpl-notes" className={labelCls}>Notes</label>
        <textarea id="tpl-notes" name="notes" rows={2} defaultValue={template?.notes ?? ''}
          placeholder="Any special instructions…"
          className={`${fieldCls} resize-none`} />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-sand/50">
        <Link href="/admin/schedule/recurring" className={formCancelBtn}>
          Cancel
        </Link>
        <button type="submit" disabled={pending}
          className="text-sm px-4 py-2 bg-sage-600 hover:bg-sage-700 disabled:opacity-60 text-white rounded-md transition-colors">
          {pending ? 'Saving…' : template ? 'Save Changes' : 'Create Template'}
        </button>
      </div>
    </form>
  )
}
