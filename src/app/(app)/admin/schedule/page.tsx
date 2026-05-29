import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fmtDate, fmtTime } from '@/lib/utils'
import DeleteSlotButton from './delete-slot-button'
import PageHeader from '@/components/ui/page-header'
import { COUNT_PILL } from '@/lib/badge-styles'

export const metadata: Metadata = { title: 'Manage Schedule' }

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!profile || !['admin', 'coordinator'].includes(profile.role)) redirect('/dashboard')

  const [{ data: slots }, { data: signups }, { data: profiles }] = await Promise.all([
    supabase.from('slots').select('*').order('date').order('start_time'),
    supabase.from('signups').select('slot_id, user_id'),
    supabase.from('profiles').select('id, name'),
  ])

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.name]))

  const enriched = (slots ?? []).map(slot => {
    const slotSignups = (signups ?? []).filter(s => s.slot_id === slot.id)
    return {
      ...slot,
      signupCount:     slotSignups.length,
      volunteerNames:  slotSignups.map(s => profileMap.get(s.user_id) ?? 'Unknown'),
    }
  })

  return (
    <div>
      <PageHeader
        title="Manage Schedule"
        subtitle="All rota slots across all weeks"
        actions={
          <div className="flex gap-2">
            <Link
              href="/admin/schedule/recurring"
              className="border border-sand text-ink/75 hover:bg-paper-100 text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              Recurring
            </Link>
            <Link
              href="/admin/schedule/new"
              className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              + Add Slot
            </Link>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto px-5">
        <div className="bg-white border border-sand/70 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100 border-b border-sand/60">
                <tr>
                  {['Date', 'Time', 'Duty', 'Location', 'Sign-ups', 'Volunteers', ''].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-ink/50 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40">
                {enriched.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-ink/40">
                      No slots yet.{' '}
                      <Link href="/admin/schedule/new" className="text-sage-700 hover:underline">Add one →</Link>
                    </td>
                  </tr>
                ) : enriched.map(slot => {
                  const pillTone = slot.signupCount === 0
                    ? COUNT_PILL.empty
                    : slot.signupCount >= slot.max_volunteers
                    ? COUNT_PILL.full
                    : COUNT_PILL.partial
                  return (
                    <tr
                      key={slot.id}
                      data-row-index={enriched.indexOf(slot)}
                      className={`group relative transition-colors ${
                        enriched.indexOf(slot) % 2 === 1 ? 'bg-paper-50/60' : ''
                      } hover:bg-paper-100/80`}
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-ink relative">
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {fmtDate(slot.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink/55">
                        {fmtTime(slot.start_time)}–{fmtTime(slot.end_time)}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">{slot.duty}</td>
                      <td className="px-4 py-3 text-ink/55">{slot.location}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pillTone}`}>
                          {slot.signupCount}/{slot.max_volunteers}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {slot.volunteerNames.length === 0 ? (
                          <span className="text-ink/40 text-xs">None</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {slot.volunteerNames.map((name: string, i: number) => (
                              <span key={i} className="text-xs bg-paper-100 border border-sand/60 rounded-full px-2 py-0.5 text-ink/70">
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/schedule/${slot.id}/edit`}
                            title="Edit"
                            aria-label={`Edit ${slot.duty}`}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink/55 hover:text-sage-700 hover:bg-sage-100/60 transition-colors"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                            </svg>
                          </Link>
                          <DeleteSlotButton slotId={slot.id} duty={slot.duty} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
