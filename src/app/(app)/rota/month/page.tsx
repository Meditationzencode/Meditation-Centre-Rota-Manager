import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getProfileForUser } from '@/lib/supabase/server'
import {
  getMonthStart, addMonths, addDays,
  getWeekStart, fmtMonthYear, fmtTime,
} from '@/lib/utils'
import { dutyPill } from '@/lib/duty-colors'
import PageHeader from '@/components/ui/page-header'
import BrandMark from '@/components/ui/brand-mark'

export const metadata: Metadata = { title: 'Rota – Month' }

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default async function MonthRotaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: rawMonth } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfileForUser<{ id: string; role: string }>(user.id, 'id, role')
  if (!profile) redirect('/auth-error?reason=missing_profile')

  const monthStart = rawMonth && /^\d{4}-\d{2}-\d{2}$/.test(rawMonth)
    ? getMonthStart(rawMonth)
    : getMonthStart(new Date())

  const nextMonthStart = addMonths(monthStart, 1)
  const monthEnd       = addDays(nextMonthStart, -1)
  const prevMonth      = addMonths(monthStart, -1)

  const [{ data: slots }, { data: signups }] = await Promise.all([
    supabase.from('slots').select('*').gte('date', monthStart).lte('date', monthEnd).order('start_time'),
    supabase.from('signups').select('slot_id, user_id'),
  ])

  // Map date → slots
  const slotsByDate = new Map<string, typeof slots>()
  for (const slot of (slots ?? [])) {
    if (!slotsByDate.has(slot.date)) slotsByDate.set(slot.date, [])
    slotsByDate.get(slot.date)!.push(slot)
  }

  const mySignupSlotIds = new Set(
    (signups ?? []).filter(s => s.user_id === user.id).map(s => s.slot_id as string),
  )

  // Build calendar grid: rows of 7 days starting from Monday on/before the 1st
  const gridStart = getWeekStart(monthStart)
  const weeks: string[][] = []
  let cursor = gridStart
  while (true) {
    const week: string[] = []
    for (let i = 0; i < 7; i++) {
      week.push(cursor)
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
    if (cursor > monthEnd) break
  }

  const today      = new Date().toISOString().slice(0, 10)
  const isManager  = profile.role === 'admin' || profile.role === 'coordinator'
  const currentWeekStart = getWeekStart(today)

  return (
    <div>
      <PageHeader
        title="Rota"
        subtitle={fmtMonthYear(monthStart)}
        maxWidth="max-w-7xl"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border border-sand overflow-hidden text-sm">
              <Link href="/rota" className="px-3 py-1.5 text-ink/65 hover:bg-paper-100 border-r border-sand transition-colors">
                Week
              </Link>
              <span className="px-3 py-1.5 bg-sage-600 text-white font-medium">Month</span>
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
        }
      />

      <div className="max-w-7xl mx-auto px-5 space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between bg-white border border-sand/70 rounded-xl px-5 py-3 shadow-sm">
          <Link
            href={`/rota/month?month=${prevMonth}`}
            className="text-sm font-medium text-ink/65 hover:text-ink flex items-center gap-1"
          >
            ← Prev
          </Link>
          <span className="font-serif text-base text-ink/80">{fmtMonthYear(monthStart)}</span>
          <Link
            href={`/rota/month?month=${nextMonthStart}`}
            className="text-sm font-medium text-ink/65 hover:text-ink flex items-center gap-1"
          >
            Next →
          </Link>
        </div>

        {/* Calendar — scrollable on mobile */}
        <div className="overflow-x-auto rounded-xl border border-sand/70 shadow-sm">
          <div className="min-w-[560px] bg-white overflow-hidden relative">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-sand/60 bg-paper-100">
              {DAY_HEADERS.map(d => (
                <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/45 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => {
              const weekStart = week[0]
              const isCurrentWeek = weekStart === currentWeekStart
              const weekHasSlots = week.some(d => (slotsByDate.get(d) ?? []).length > 0)
              return (
                <div
                  key={wi}
                  className={`grid grid-cols-7 relative ${
                    wi < weeks.length - 1 ? 'border-b border-sand/30' : ''
                  } ${isCurrentWeek ? 'bg-gold-50/40' : ''}`}
                >
                  {/* Decorative lotus for entirely empty weeks (within month) */}
                  {!weekHasSlots && week.some(d => d >= monthStart && d <= monthEnd) && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
                      <BrandMark size={64} withRing={false} />
                    </div>
                  )}
                  {week.map(date => {
                    const inMonth  = date >= monthStart && date <= monthEnd
                    const isToday  = date === today
                    const daySlots = slotsByDate.get(date) ?? []
                    const weekLink = `/rota?week=${getWeekStart(date)}`

                    return (
                      <div
                        key={date}
                        className={`min-h-[90px] p-1.5 border-r border-sand/30 last:border-r-0 relative ${
                          !inMonth ? 'bg-paper-100/40' : ''
                        }`}
                      >
                        <Link href={weekLink}>
                          <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full mb-1 transition-colors ${
                            isToday
                              ? 'bg-sage-600 text-white shadow-sm'
                              : inMonth
                              ? 'text-ink/75 hover:bg-paper-200/60'
                              : 'text-ink/25'
                          }`}>
                            {parseInt(date.slice(8), 10)}
                          </span>
                        </Link>

                        <div className="space-y-0.5">
                          {daySlots.slice(0, 3).map(slot => {
                            const filled = (signups ?? []).filter(s => s.slot_id === slot.id).length >= slot.max_volunteers
                            const mine   = mySignupSlotIds.has(slot.id)
                            return (
                              <Link
                                key={slot.id}
                                href={weekLink}
                                className={`block text-[10px] px-1.5 py-0.5 rounded truncate leading-tight hover:opacity-80 transition-opacity ${
                                  mine   ? 'bg-sage-100 text-sage-800' :
                                  filled ? 'bg-red-50 text-red-600' :
                                           dutyPill(slot.duty)
                                }`}
                              >
                                {fmtTime(slot.start_time)} {slot.duty}
                              </Link>
                            )
                          })}
                          {daySlots.length > 3 && (
                            <Link
                              href={weekLink}
                              className="inline-block text-[10px] text-ink/50 bg-paper-100 hover:bg-paper-200/70 px-1.5 py-px rounded-full"
                            >
                              +{daySlots.length - 3} more
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink/45 pb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-500 inline-block" /> My slot
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Full
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 inline-block" /> Morning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-300 inline-block" /> Evening
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gold-50 border border-gold-200 inline-block" /> Current week
          </span>
        </div>
      </div>
    </div>
  )
}
