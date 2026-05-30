'use client'

import { useActionState, useTransition } from 'react'
import { addUnavailability, removeUnavailability } from '@/lib/actions'
import type { Unavailability } from '@/lib/types'
import Card from '@/components/ui/card'

const initial = null

export default function UnavailabilityForm({ entries }: { entries: Unavailability[] }) {
  const [result, formAction, pending] = useActionState(addUnavailability, initial)
  const [removing, startRemove] = useTransition()

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = entries.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))

  function handleRemove(id: string) {
    startRemove(async () => { await removeUnavailability(id) })
  }

  return (
    <Card clip>
      <div className="px-5 py-4 border-b border-sand/50">
        <h2 className="font-serif text-lg font-medium text-ink">Unavailability</h2>
        <p className="text-sm text-ink/55 mt-0.5">Mark dates you cannot volunteer — coordinators will see this when scheduling.</p>
      </div>

      {/* Add form */}
      <form action={formAction} className="px-5 py-4 border-b border-sand/50 flex flex-col sm:flex-row gap-3">
        <input type="hidden" name="user_id" />
        <div className="flex-1 flex gap-3">
          <div className="flex-shrink-0">
            <label className="text-xs text-ink/55 block mb-1">Date</label>
            <input
              type="date"
              name="date"
              min={today}
              required
              className="block border border-sand rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mist"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs text-ink/55 block mb-1">Note (optional)</label>
            <input
              type="text"
              name="note"
              placeholder="e.g. Holiday"
              maxLength={100}
              className="block w-full border border-sand rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mist"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            {pending ? 'Adding…' : 'Add date'}
          </button>
        </div>
        {'error' in (result ?? {}) && (
          <p className="text-sm text-red-600 sm:col-span-2">{(result as { error: string }).error}</p>
        )}
      </form>

      {/* List */}
      {upcoming.length === 0 ? (
        <div className="px-5 py-6 text-center text-ink/40 text-sm">No upcoming unavailability marked.</div>
      ) : (
        <ul className="divide-y divide-sand/40">
          {upcoming.map(entry => (
            <li key={entry.id} className="flex items-center gap-3 px-5 py-3">
              <span className="text-xs font-semibold text-gold-700 uppercase tracking-wide w-20 flex-shrink-0">
                {new Date(`${entry.date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
              </span>
              <span className="flex-1 text-sm text-ink/70">{entry.note || '—'}</span>
              <button
                onClick={() => handleRemove(entry.id)}
                disabled={removing}
                className="text-xs text-ink/45 hover:text-red-600 transition-colors disabled:opacity-50"
                aria-label="Remove"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
