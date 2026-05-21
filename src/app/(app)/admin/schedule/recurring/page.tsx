import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fmtTime } from '@/lib/utils'
import { generateSlots, deleteTemplate } from '@/lib/actions'
import type { RecurringTemplate } from '@/lib/types'

export const metadata: Metadata = { title: 'Recurring Templates' }

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ERR_MESSAGES: Record<string, string> = {
  missing_range: 'Please select both a start and end date.',
  invalid_range: 'Start date must be before end date.',
  no_templates:  'No active recurring templates found. Create one first.',
  no_matches:    'No active templates match any day in the selected range.',
}

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; err?: string }>
}) {
  const { generated, err } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinator'].includes(profile.role)) redirect('/dashboard')

  const { data: templates } = await supabase
    .from('recurring_templates')
    .select('*')
    .order('created_at')

  const list = (templates ?? []) as RecurringTemplate[]

  return (
    <div>
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-5xl mx-auto px-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
              <Link href="/admin/schedule" className="hover:text-stone-700">Schedule</Link>
              <span>/</span>
              <span>Recurring</span>
            </div>
            <h1 className="font-serif text-3xl font-medium">Recurring Templates</h1>
            <p className="text-stone-500 text-sm mt-1">Define repeating shifts, then generate slots for any date range.</p>
          </div>
          <Link
            href="/admin/schedule/recurring/new"
            className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            + New Template
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 mt-6 space-y-5">

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
            {ERR_MESSAGES[err] ?? decodeURIComponent(err)}
          </div>
        )}

        {generated && (
          <div className="bg-sage-50 border border-sage-200 text-sage-800 text-sm rounded-md px-4 py-3">
            {generated === '0'
              ? 'No new slots were created (all matching slots already exist).'
              : `${generated} slot${parseInt(generated) === 1 ? '' : 's'} generated and added to the schedule.`}
          </div>
        )}

        {/* Generate slots form */}
        <section className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
          <h2 className="font-serif text-lg mb-4">Generate Slots</h2>
          <form action={generateSlots} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">From</label>
              <input type="date" name="from" required
                className="border border-stone-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">To</label>
              <input type="date" name="to" required
                className="border border-stone-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage-500" />
            </div>
            <button type="submit"
              className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              Generate
            </button>
          </form>
          <p className="text-xs text-stone-400 mt-2">Creates slots for all active templates within the date range. Existing slots are not duplicated.</p>
        </section>

        {/* Template list */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          {list.length === 0 ? (
            <div className="px-5 py-12 text-center text-stone-400 text-sm">
              No templates yet.{' '}
              <Link href="/admin/schedule/recurring/new" className="text-teal-700 hover:underline">Create one →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    {['Days', 'Duty', 'Time', 'Location', 'Max', 'Status', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {list.map(t => (
                    <tr key={t.id} className={`hover:bg-stone-50 transition-colors ${!t.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {t.days_of_week.map(d => (
                            <span key={d} className="text-[10px] font-semibold bg-sage-100 text-sage-700 px-1.5 py-0.5 rounded">
                              {DAY_LABELS[d]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{t.duty}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-stone-500">
                        {fmtTime(t.start_time)}–{fmtTime(t.end_time)}
                      </td>
                      <td className="px-4 py-3 text-stone-500">{t.location}</td>
                      <td className="px-4 py-3 text-center">{t.max_volunteers}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.active ? 'bg-sage-100 text-sage-700' : 'bg-stone-100 text-stone-500'}`}>
                          {t.active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/schedule/recurring/${t.id}/edit`}
                            className="text-xs text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition-colors"
                          >
                            Edit
                          </Link>
                          <form action={deleteTemplate.bind(null, t.id)}>
                            <button type="submit"
                              className="text-xs text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                              onClick={e => { if (!confirm(`Delete "${t.duty}" template?`)) e.preventDefault() }}>
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
