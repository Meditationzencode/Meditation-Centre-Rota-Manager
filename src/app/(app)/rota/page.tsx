import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getProfileForUser } from '@/lib/supabase/server'
import { getWeekStart, addDays, fmtDate, fmtDateLong } from '@/lib/utils'
import RotaGrid from '@/components/rota/rota-grid'
import PrintButton from '@/components/rota/print-button'
import PageHeader from '@/components/ui/page-header'

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

  const weekEnd     = addDays(weekStart, 6)
  const prevWeek    = addDays(weekStart, -7)
  const nextWeek    = addDays(weekStart, 7)
  const weekLabel   = `${fmtDateLong(weekStart)} – ${fmtDateLong(weekEnd)}`
  const today       = new Date().toISOString().slice(0, 10)
  const isThisWeek  = weekStart === getWeekStart(new Date())

  const [{ data: slots }, { data: mySwaps }] = await Promise.all([
    supabase.from('slots').select('*').gte('date', weekStart).lte('date', weekEnd).order('start_time'),
    supabase.from('shift_swaps').select('slot_id').eq('requester_id', user.id).eq('status', 'pending'),
  ])

  const slotIds = (slots ?? []).map(s => s.id)
  const { data: signups } = slotIds.length > 0
    ? await supabase.from('signups').select('*, profile:profiles(id, name)').in('slot_id', slotIds)
    : { data: [] }

  const mySwapSlotIds = new Set((mySwaps ?? []).map(s => s.slot_id as string))
  const canSignUp     = profile.role !== 'viewer'

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
          signups:    slotSignups,
          mySignup:   !!mySignup,
          spotsLeft:  slot.max_volunteers - slotSignups.length,
          swapPending: mySwapSlotIds.has(slot.id),
          volunteers: slotSignups.map(sig => (sig.profile as { name: string } | null)?.name ?? 'Unknown'),
        }
      })
    return { date, label: `${dayName} ${fmtDate(date)}`, slots: daySlots }
  })

  const isManager = profile.role === 'admin' || profile.role === 'coordinator'

  return (
    <div>
      <PageHeader
        title="Rota"
        subtitle={weekLabel}
        maxWidth="max-w-7xl"
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <div className="flex rounded-md border border-sand overflow-hidden text-sm">
              <span className="px-3 py-1.5 bg-sage-600 text-white font-medium">Week</span>
              <Link href="/rota/month" className="px-3 py-1.5 text-ink/65 hover:bg-paper-100 border-l border-sand transition-colors">
                Month
              </Link>
            </div>
            <PrintButton />
            <Link
              href="/api/rota/export"
              className="text-sm font-medium text-ink/65 hover:text-ink border border-sand rounded-md px-3 py-1.5 hover:bg-paper-100 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="hidden sm:inline">Export .ics</span>
            </Link>
            {isManager && (
              <Link
                href="/admin/schedule/new"
                className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                + Add Slot
              </Link>
            )}
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-5 space-y-5">
        {/* Week navigation */}
        <div className="flex items-center justify-between bg-white border border-sand/70 rounded-xl px-5 py-3 shadow-sm">
          <Link
            href={`/rota?week=${prevWeek}`}
            className="text-sm font-medium text-ink/65 hover:text-ink flex items-center gap-1"
          >
            ← Prev
          </Link>
          <div className="flex flex-col items-center gap-1">
            <span className="font-serif text-base text-ink/80">{weekLabel}</span>
            {!isThisWeek && (
              <Link href="/rota" className="text-xs text-sage-700 hover:text-sage-800 font-medium">
                Today
              </Link>
            )}
          </div>
          <Link
            href={`/rota?week=${nextWeek}`}
            className="text-sm font-medium text-ink/65 hover:text-ink flex items-center gap-1"
          >
            Next →
          </Link>
        </div>

        {/* Grid */}
        <RotaGrid
          days={days}
          weekStart={weekStart}
          isManager={isManager}
          canSignUp={canSignUp}
          userId={user.id}
          today={today}
        />

        {/* Legend */}
        <div className="flex gap-5 text-xs text-ink/45 pb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-500 inline-block" /> My slot
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-500 inline-block" /> 1 spot left
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Full
          </span>
        </div>
      </div>
    </div>
  )
}
