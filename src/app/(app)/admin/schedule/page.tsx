import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fmtDate, fmtTime } from '@/lib/utils'
import DeleteSlotButton from './delete-slot-button'

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
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-medium">Manage Schedule</h1>
            <p className="text-stone-500 text-sm mt-1">All rota slots across all weeks</p>
          </div>
          <Link
            href="/admin/schedule/new"
            className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            + Add Slot
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 mt-6">
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  {['Date', 'Time', 'Duty', 'Location', 'Sign-ups', 'Volunteers', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {enriched.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-stone-400">
                      No slots yet.{' '}
                      <Link href="/admin/schedule/new" className="text-teal-700 hover:underline">Add one →</Link>
                    </td>
                  </tr>
                ) : enriched.map(slot => (
                  <tr key={slot.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{fmtDate(slot.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-stone-500">
                      {fmtTime(slot.start_time)}–{fmtTime(slot.end_time)}
                    </td>
                    <td className="px-4 py-3 font-medium">{slot.duty}</td>
                    <td className="px-4 py-3 text-stone-500">{slot.location}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        slot.signupCount >= slot.max_volunteers
                          ? 'bg-red-100 text-red-700'
                          : slot.signupCount === slot.max_volunteers - 1
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-sage-100 text-sage-700'
                      }`}>
                        {slot.signupCount}/{slot.max_volunteers}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      {slot.volunteerNames.length === 0 ? (
                        <span className="text-stone-400 text-xs">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {slot.volunteerNames.map((name: string, i: number) => (
                            <span key={i} className="text-xs bg-stone-100 border border-stone-200 rounded-full px-2 py-0.5">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/schedule/${slot.id}/edit`}
                          className="text-xs text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteSlotButton slotId={slot.id} duty={slot.duty} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
