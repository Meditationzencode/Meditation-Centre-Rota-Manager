import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getMyProfile } from '@/lib/supabase/server'
import { fmtDate, fmtTime } from '@/lib/utils'
import PageHeader from '@/components/ui/page-header'
import Card from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'
import {
  UsersIcon, HandshakeIcon, SwapIcon, ClipboardIcon,
  PlusIcon, CalendarIcon, UserPlusIcon,
} from '@/components/ui/icons'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)

  const [profile, { data: futureSlots }, { data: allProfiles }, { count: pendingSwapCount }] =
    await Promise.all([
      getMyProfile(user.id),
      supabase.from('slots').select('*').gte('date', today).order('date').order('start_time'),
      supabase.from('profiles').select('id, role, active'),
      supabase.from('shift_swaps').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

  if (!profile) redirect('/auth-error?reason=missing_profile')

  const slotIds = (futureSlots ?? []).map(s => s.id)
  const { data: allSignups } = slotIds.length > 0
    ? await supabase.from('signups').select('*').in('slot_id', slotIds)
    : { data: [] }

  const isViewer  = profile.role === 'viewer'
  const isManager = profile.role === 'admin' || profile.role === 'coordinator'

  // My upcoming duties (not applicable to viewers)
  const mySignupSlotIds = new Set(
    (allSignups ?? []).filter(s => s.user_id === user.id).map(s => s.slot_id),
  )
  const myUpcomingAll = (futureSlots ?? []).filter(s => mySignupSlotIds.has(s.id))
  const myUpcoming    = myUpcomingAll.slice(0, 5)
  const myUpcomingMore = myUpcomingAll.length - myUpcoming.length

  // Open slots in next 7 days
  const sevenDays = new Date()
  sevenDays.setDate(sevenDays.getDate() + 7)
  const sevenDaysStr = sevenDays.toISOString().slice(0, 10)

  const openSlots = (futureSlots ?? [])
    .filter(s => s.date >= today && s.date <= sevenDaysStr)
    .map(s => {
      const count = (allSignups ?? []).filter(sig => sig.slot_id === s.id).length
      return { ...s, spotsLeft: s.max_volunteers - count }
    })
    .filter(s => s.spotsLeft > 0)
    .slice(0, 6)

  const stats = isManager ? {
    members:         (allProfiles ?? []).length,
    volunteers:      (allProfiles ?? []).filter(p => p.role === 'volunteer' && p.active).length,
    pendingSwaps:    pendingSwapCount ?? 0,
    unassignedSlots: (futureSlots ?? []).filter(s =>
      s.date >= today &&
      (allSignups ?? []).filter(sig => sig.slot_id === s.id).length === 0,
    ).length,
  } : null

  return (
    <div>
      <PageHeader
        title={`Good day, ${profile.name.split(' ')[0]}`}
        subtitle="Your overview for Bodhi Grove Meditation Centre"
      />

      <div className="max-w-6xl mx-auto px-5 space-y-8">

        {/* Viewer: read-only rota summary */}
        {isViewer && (
          <Card className="p-6 text-center space-y-3">
            <p className="text-ink/60 text-sm">
              You have viewer access. You can browse the rota but cannot sign up for slots.
            </p>
            <Link
              href="/rota"
              className="inline-block bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-5 py-2 rounded-md transition-colors"
            >
              View this week&apos;s rota →
            </Link>
          </Card>
        )}

        {/* Stats row — managers only */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Members',          value: stats.members,         Icon: UsersIcon,     href: '/admin/members',  alert: false },
              { label: 'Active Volunteers',value: stats.volunteers,      Icon: HandshakeIcon, href: '/admin/members',  alert: false },
              { label: 'Pending Swaps',    value: stats.pendingSwaps,    Icon: SwapIcon,      href: '/admin/swaps',    alert: stats.pendingSwaps > 0 },
              { label: 'Unassigned Slots', value: stats.unassignedSlots, Icon: ClipboardIcon, href: '/admin/schedule', alert: stats.unassignedSlots > 0 },
            ].map(s => (
              <Link
                key={s.label}
                href={s.href}
                className={`bg-white border rounded-xl px-4 py-4 flex items-center gap-3.5 shadow-sm hover:shadow transition-shadow ${
                  s.alert ? 'border-gold-200' : 'border-sand/70'
                }`}
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  s.alert
                    ? 'bg-gold-100 text-gold-700'
                    : 'bg-sage-50 text-sage-700'
                }`}>
                  <s.Icon size={22} />
                </div>
                <div className="min-w-0">
                  <div className={`font-serif font-medium text-[26px] leading-none ${s.alert ? 'text-gold-700' : 'text-ink'}`}>
                    {s.value}
                  </div>
                  <div className="text-[13px] text-ink/75 mt-1.5 leading-tight">{s.label}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Two-column section — not shown to viewers. items-start so an empty
            card on either side doesn't stretch to match its sibling's height. */}
        {!isViewer && (
          <div className="grid lg:grid-cols-2 gap-6 lg:items-start">
            {/* My upcoming duties */}
            {myUpcoming.length === 0 ? (
              <EmptyState
                title="You're all caught up"
                body="No duties on your schedule yet. Browse open slots if you'd like to pick one up."
                cta={
                  <Link
                    href="/rota"
                    className="inline-block text-sm font-medium border border-sage-300 text-sage-800 bg-sage-50 hover:bg-sage-600 hover:text-white hover:border-sage-600 rounded-md px-4 py-2 transition-colors"
                  >
                    Browse open slots
                  </Link>
                }
              />
            ) : (
              <Card clip>
                <div className="flex items-center justify-between px-5 py-4 border-b border-sand/60">
                  <h2 className="font-serif text-lg font-medium text-ink">My Upcoming Duties</h2>
                  <Link href="/rota" className="text-xs text-sage-700 hover:underline">View rota →</Link>
                </div>
                <ul className="divide-y divide-sand/40">
                  {myUpcoming.map(s => (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-xs font-semibold text-sage-700 uppercase tracking-wide w-16 flex-shrink-0">
                        {fmtDate(s.date)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-ink">{s.duty}</p>
                        <p className="text-xs text-ink/45">{fmtTime(s.start_time)}–{fmtTime(s.end_time)} · {s.location}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                {myUpcomingMore > 0 && (
                  <div className="px-5 py-3 border-t border-sand/40">
                    <Link href="/rota" className="text-xs text-sage-700 hover:underline">
                      and {myUpcomingMore} more → View rota
                    </Link>
                  </div>
                )}
              </Card>
            )}

            {/* Open slots */}
            <Card clip>
              <div className="flex items-center justify-between px-5 py-4 border-b border-sand/60">
                <h2 className="font-serif text-lg font-medium text-ink">Open Slots — Next 7 Days</h2>
                <Link href="/rota" className="text-xs text-sage-700 hover:underline">Sign up →</Link>
              </div>
              {openSlots.length === 0 ? (
                <div className="px-5 py-8 text-center text-ink/45 text-sm">
                  All upcoming slots are filled.
                </div>
              ) : (
                <ul className="divide-y divide-sand/40">
                  {openSlots.map(s => (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-xs font-semibold text-sage-700 uppercase tracking-wide w-16 flex-shrink-0">
                        {fmtDate(s.date)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-ink">{s.duty}</p>
                        <p className="text-xs text-ink/45">{fmtTime(s.start_time)}–{fmtTime(s.end_time)} · {s.location}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        s.spotsLeft === 1 ? 'bg-gold-100 text-gold-700' : 'bg-sage-100 text-sage-700'
                      }`}>
                        {s.spotsLeft} left
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {/* Quick actions — managers only */}
        {isManager && (
          <section>
            <h2 className="font-serif text-xl font-medium mb-4 text-ink">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { href: '/admin/schedule/new', Icon: PlusIcon,     label: 'Add Rota Slot'     },
                { href: '/admin/schedule',     Icon: CalendarIcon, label: 'Manage Schedule'   },
                ...(profile.role === 'admin' ? [
                  { href: '/admin/members/new', Icon: UserPlusIcon, label: 'Add Member'        },
                  { href: '/admin/members',     Icon: UsersIcon,    label: 'Manage Members'    },
                ] : []),
              ].map(a => (
                <Link
                  key={a.href} href={a.href}
                  className="relative bg-white border border-sand/70 rounded-xl px-5 py-4 flex items-center gap-3.5 shadow-sm hover:shadow hover:border-mist/70 transition-all group"
                >
                  <span className="w-10 h-10 rounded-lg bg-sage-50 text-sage-700 flex items-center justify-center flex-shrink-0 group-hover:bg-sage-100 transition-colors">
                    <a.Icon size={22} />
                  </span>
                  <span className="text-sm font-medium text-ink/85 group-hover:text-ink leading-tight flex-1">{a.label}</span>
                  <span className="text-ink/30 group-hover:text-sage-700 group-hover:translate-x-0.5 transition-all">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
