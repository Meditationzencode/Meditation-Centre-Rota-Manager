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
    supabase.from('slots').select('*, creator:profiles!created_by(name)').eq('id', id).single(),
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
      <div className="max-w-2xl mx-auto px-5 pt-8 pb-5">
        <div className="flex items-center gap-2 text-sm text-ink/55 mb-2 flex-wrap">
          <Link href="/rota" className="hover:text-ink transition-colors">Rota</Link>
          <span>/</span>
          <Link href={`/rota?week=${slot.week_start}`} className="hover:text-ink transition-colors">
            Week of {fmtDate(slot.week_start)}
          </Link>
          <span>/</span>
          <span className="text-ink/80">{slot.duty}</span>
        </div>
        <h1 className="font-serif text-3xl font-medium text-ink">{slot.duty}</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-ink/55 text-sm">{fmtDateLong(slot.date)}</p>
          {slot.status === 'cancelled' && (
            <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              Cancelled
            </span>
          )}
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-gold-400/60 via-sand to-transparent" />
      </div>

      <div className="max-w-2xl mx-auto px-5 space-y-4">
        {/* Slot info */}
        <div className="bg-white border border-sand/70 rounded-xl shadow-sm p-5">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-1">Date</dt>
              <dd className="text-ink">{fmtDateLong(slot.date)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-1">Time</dt>
              <dd className="text-ink">{fmtTime(slot.start_time)}–{fmtTime(slot.end_time)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-1">Location</dt>
              <dd className="text-ink">{slot.location}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-1">Capacity</dt>
              <dd className="text-ink">
                <span className={`font-medium ${spotsLeft <= 0 ? 'text-red-600' : spotsLeft === 1 ? 'text-gold-700' : 'text-sage-700'}`}>
                  {signups?.length ?? 0}
                </span>
                {' '}/ {slot.max_volunteers} filled
              </dd>
            </div>
            {slot.notes && (
              <div className="col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-1">Notes</dt>
                <dd className="text-ink/65 italic">{slot.notes}</dd>
              </div>
            )}
            {(slot.creator as { name: string } | null)?.name && (
              <div className="col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink/45 mb-1">Added by</dt>
                <dd className="text-ink/65">{(slot.creator as { name: string }).name}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Signed-up volunteers */}
        <div className="bg-white border border-sand/70 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-sand/60 flex items-center justify-between">
            <h2 className="font-serif text-base font-medium text-ink">Signed up</h2>
            <span className="text-xs text-ink/45">{signups?.length ?? 0} of {slot.max_volunteers}</span>
          </div>
          {volunteers.length === 0 ? (
            <p className="px-5 py-8 text-sm text-ink/40 text-center">No one signed up yet.</p>
          ) : (
            <ul className="divide-y divide-sand/40">
              {volunteers.map((name, i) => (
                <li key={i} className="px-5 py-3 text-sm text-ink/80 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-800 text-xs font-semibold flex items-center justify-center flex-shrink-0">
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
