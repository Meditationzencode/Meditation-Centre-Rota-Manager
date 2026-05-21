import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getProfileForUser } from '@/lib/supabase/server'
import { getWeekStart, addDays, fmtDate, fmtDateLong, fmtTime } from '@/lib/utils'
import RotaGrid from '@/components/rota/rota-grid'

export const metadata: Metadata = { title: 'Rota' }

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default async function RotaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const { week: rawWeek } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfileForUser<{ id: string; role: string }>(user.id, 'id, role')

  if (!profile) redirect('/auth-error?reason=missing_profile')

  const weekStart = rawWeek && /^\d{4}-\d{2}-\d{2}$/.test(rawWeek)
    ? getWeekStart(rawWeek)
    : getWeekStart(new Date())

  const weekEnd   = addDays(weekStart, 6)
  const prevWeek  = addDays(weekStart, -7)
  const nextWeek  = addDays(weekStart, 7)
  const weekLabel = `${fmtDateLong(weekStart)} – ${fmtDateLong(weekEnd)}`

  const [{ data: slots }, { data: signups }, { data: profiles }] = await Promise.all([
    supabase.from('slots').select('*').gte('date', weekStart).lte('date', weekEnd).order('start_time'),
    supabase.from('signups').select('*, profile:profiles(id, name)'),
    supabase.from('profiles').select('id, name'),
  ])

  // Build 7-day grid
  const days = DAY_NAMES.map((dayName, i) => {
    const date = addDays(weekStart, i)
    const daySlots = (slots ?? [])
      .filter(s => s.date === date)
      .map(slot => {
        const slotSignups = (signups ?? []).filter(sig => sig.slot_id === slot.id)
        const mySignup    = slotSignups.find(sig => sig.user_id === user.id)
        return {
          ...slot,
          signups:   slotSignups,
          mySignup:  !!mySignup,
          spotsLeft: slot.max_volunteers - slotSignups.length,
          volunteers: slotSignups.map(sig => (sig.profile as { name: string } | null)?.name ?? 'Unknown'),
        }
      })
    return { date, label: `${dayName} ${fmtDate(date)}`, slots: daySlots }
  })

  const isManager = profile.role === 'admin' || profile.role === 'coordinator'

  return (
    <div>
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-7xl mx-auto px-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-medium">Rota</h1>
            <p className="text-stone-500 text-sm mt-1">{weekLabel}</p>
          </div>
          {isManager && (
            <Link
              href="/admin/schedule/new"
              className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              + Add Slot
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 mt-6 space-y-5">
        {/* Week navigation */}
        <div className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-3 shadow-sm">
          <Link
            href={`/rota?week=${prevWeek}`}
            className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
          >
            ← Prev
          </Link>
          <span className="font-serif text-base text-stone-700">{weekLabel}</span>
          <Link
            href={`/rota?week=${nextWeek}`}
            className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
          >
            Next →
          </Link>
        </div>

        {/* Grid */}
        <RotaGrid days={days} weekStart={weekStart} isManager={isManager} userId={user.id} />

        {/* Legend */}
        <div className="flex gap-5 text-xs text-stone-400 pb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-500 inline-block" /> My slot
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 1 spot left
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Full
          </span>
        </div>
      </div>
    </div>
  )
}
