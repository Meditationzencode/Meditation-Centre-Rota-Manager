import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fmtTime } from '@/lib/utils'
import { generateSlots, deleteTemplate } from '@/lib/actions'
import type { RecurringTemplate } from '@/lib/types'
import PageHeader from '@/components/ui/page-header'

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
      <div className="max-w-5xl mx-auto px-5 pt-8 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-ink/55 mb-1">
              <Link href="/admin/schedule" className="hover:text-ink">Schedule</Link>
              <span>/</span>
              <span>Recurring</span>
            </div>
            <h1 className="font-serif text-3xl font-medium text-ink">Recurring Templates</h1>
            <p className="text-ink/55 text-sm mt-1">Define repeating shifts, then generate slots for any date range.</p>
          </div>
          <Link
            href="/admin/schedule/recurring/new"
            className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            + New Template
          </Link>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-gold-400/60 via-sand to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-5 space-y-5">

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
        <section className="bg-white border border-sand/70 rounded-xl shadow-sm p-5">
          <h2 className="font-serif text-lg font-medium mb-4 text-ink">Generate Slots</h2>
          <form action={generateSlots} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-ink/75 mb-1">From</label>
              <input type="date" name="from" required
                className="border border-sand rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mist" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/75 mb-1">To</label>
              <input type="date" name="to" required
                className="border border-sand rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mist" />
            </div>
            <button type="submit"
              className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors">
              Generate
            </button>
          </form>
          <p className="text-xs text-ink/45 mt-2">Creates slots for all active templates within the date range. Existing slots are not duplicated.</p>
        </section>

        {/* Template list */}
        <div className="bg-white border border-sand/70 rounded-xl shadow-sm overflow-hidden">
          {list.length === 0 ? (
            <div className="px-5 py-12 text-center text-ink/40 text-sm">
              No templates yet.{' '}
              <Link href="/admin/schedule/recurring/new" className="text-sage-700 hover:underline">Create one →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-paper-100 border-b border-sand/60">
                  <tr>
                    {['Days', 'Duty', 'Time', 'Location', 'Max', 'Status', ''].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-ink/50 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/40">
                  {list.map((t, i) => (
                    <tr
                      key={t.id}
                      className={`group relative transition-colors ${
                        i % 2 === 1 ? 'bg-paper-50/60' : ''
                      } hover:bg-paper-100/80 ${!t.active ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3.5 relative">
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex flex-wrap gap-1">
                          {t.days_of_week.map(d => (
                            <span key={d} className="text-[10px] font-semibold bg-sage-100 text-sage-800 px-1.5 py-0.5 rounded">
                              {DAY_LABELS[d]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">{t.duty}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink/55">
                        {fmtTime(t.start_time)}–{fmtTime(t.end_time)}
                      </td>
                      <td className="px-4 py-3 text-ink/55">{t.location}</td>
                      <td className="px-4 py-3 text-center text-ink/75">{t.max_volunteers}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.active ? 'bg-sage-100 text-sage-800' : 'bg-sand/50 text-ink/55'}`}>
                          {t.active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/schedule/recurring/${t.id}/edit`}
                            title="Edit"
                            aria-label={`Edit ${t.duty} template`}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink/55 hover:text-sage-700 hover:bg-sage-100/60 transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                            </svg>
                          </Link>
                          <form action={deleteTemplate.bind(null, t.id)}>
                            <button
                              type="submit"
                              title="Delete"
                              aria-label={`Delete ${t.duty} template`}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink/55 hover:text-red-600 hover:bg-red-50 transition-colors"
                              onClick={e => { if (!confirm(`Delete "${t.duty}" template?`)) e.preventDefault() }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                              </svg>
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
