import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient, getProfileForUser } from '@/lib/supabase/server'
import { fmtDate, fmtDateLong, fmtTime } from '@/lib/utils'
import SlotActions from './slot-actions'

export const metadata: Metadata = { title: 'Shift Detail' }

export default async function SlotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfileForUser<{ id: string; role: string }>(user.id, 'id, role')
  if (!profile) redirect('/auth-error?reason=missing_profile')

  const [{ data: slot }, { data: signups }, { data: swaps }] = await Promise.all([
    supabase.from('slots').select('*').eq('id', id).single(),
    supabase.from('signups').select('*, profile:profiles(id, name)').eq('slot_id', id),
    supabase.from('shift_swaps')
      .select('slot_id')
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .eq('slot_id', id),
  ])

  if (!slot) notFound()

  const mySignup    = (signups ?? []).some(s => s.user_id === user.id)
  const swapPending = (swaps ?? []).length > 0
  const spotsLeft   = slot.max_volunteers - (signups ?? []).length
  const isManager   = profile.role === 'admin' || profile.role === 'coordinator'
  const canSignUp   = profile.role !== 'viewer'
  const volunteers  = (signups ?? []).map(
    s => (s.profile as { name: string } | null)?.name ?? 'Unknown'
  )

  return (
    <div>
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-2xl mx-auto px-5">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-2 flex-wrap">
            <Link href="/rota" className="hover:text-stone-700 transition-colors">Rota</Link>
            <span>/</span>
            <Link href={`/rota?week=${slot.week_start}`} className="hover:text-stone-700 transition-colors">
              Week of {fmtDate(slot.week_start)}
            </Link>
            <span>/</span>
            <span className="text-stone-700">{slot.duty}</span>
          </div>
          <h1 className="font-serif text-3xl font-medium">{slot.duty}</h1>
          <p className="text-stone-500 text-sm mt-1">{fmtDateLong(slot.date)}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-4">
        {/* Slot info */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Date</dt>
              <dd className="text-stone-800">{fmtDateLong(slot.date)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Time</dt>
              <dd className="text-stone-800">{fmtTime(slot.start_time)}–{fmtTime(slot.end_time)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Location</dt>
              <dd className="text-stone-800">{slot.location}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Capacity</dt>
              <dd className="text-stone-800">
                <span className={`font-medium ${spotsLeft <= 0 ? 'text-red-600' : spotsLeft === 1 ? 'text-amber-600' : 'text-sage-700'}`}>
                  {signups?.length ?? 0}
                </span>
                {' '}/ {slot.max_volunteers} filled
              </dd>
            </div>
            {slot.notes && (
              <div className="col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Notes</dt>
                <dd className="text-stone-600 italic">{slot.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Signed-up volunteers */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-serif text-base font-medium">Signed up</h2>
            <span className="text-xs text-stone-400">{signups?.length ?? 0} of {slot.max_volunteers}</span>
          </div>
          {volunteers.length === 0 ? (
            <p className="px-5 py-8 text-sm text-stone-400 text-center">No one signed up yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {volunteers.map((name, i) => (
                <li key={i} className="px-5 py-3 text-sm text-stone-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                    {name.charAt(0)}
                  </span>
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <SlotActions
          slotId={slot.id}
          weekStart={slot.week_start}
          mySignup={mySignup}
          swapPending={swapPending}
          spotsLeft={spotsLeft}
          canSignUp={canSignUp}
          isManager={isManager}
        />
      </div>
    </div>
  )
}
