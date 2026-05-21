import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getProfileForUser } from '@/lib/supabase/server'
import { fmtDate, fmtTime } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, { data: allSlots }, { data: allSignups }, { data: allProfiles }, { count: pendingSwapCount }] =
    await Promise.all([
      getProfileForUser(user.id),
      supabase.from('slots').select('*').order('date').order('start_time'),
      supabase.from('signups').select('*'),
      supabase.from('profiles').select('id, role, active'),
      supabase.from('shift_swaps').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

  if (!profile) redirect('/auth-error?reason=missing_profile')

  const today = new Date().toISOString().slice(0, 10)

  const isViewer  = profile.role === 'viewer'
  const isManager = profile.role === 'admin' || profile.role === 'coordinator'

  // My upcoming duties (not applicable to viewers)
  const mySignupSlotIds = new Set(
    (allSignups ?? []).filter(s => s.user_id === user.id).map(s => s.slot_id),
  )
  const myUpcoming = (allSlots ?? [])
    .filter(s => mySignupSlotIds.has(s.id) && s.date >= today)
    .slice(0, 5)

  // Open slots in next 7 days
  const sevenDays = new Date()
  sevenDays.setDate(sevenDays.getDate() + 7)
  const sevenDaysStr = sevenDays.toISOString().slice(0, 10)

  const openSlots = (allSlots ?? [])
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
    unassignedSlots: (allSlots ?? []).filter(s =>
      s.date >= today &&
      (allSignups ?? []).filter(sig => sig.slot_id === s.id).length === 0,
    ).length,
  } : null

  return (
    <div>
      {/* Page header */}
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-6xl mx-auto px-5">
          <h1 className="font-serif text-3xl font-medium">
            Good day, {profile.name.split(' ')[0]}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Your overview for Bodhi Grove Meditation Centre
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 mt-7 space-y-8">

        {/* Viewer: read-only rota summary */}
        {isViewer && (
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6 text-center space-y-3">
            <p className="text-stone-500 text-sm">
              You have viewer access. You can browse the rota but cannot sign up for slots.
            </p>
            <Link
              href="/rota"
              className="inline-block bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-5 py-2 rounded-md transition-colors"
            >
              View this week&apos;s rota →
            </Link>
          </div>
        )}

        {/* Stats row — managers only */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Members',          value: stats.members,         icon: '👤', href: '/admin/members',  alert: false },
              { label: 'Active Volunteers',value: stats.volunteers,      icon: '🤝', href: '/admin/members',  alert: false },
              { label: 'Pending Swaps',    value: stats.pendingSwaps,    icon: '🔄', href: '/admin/swaps',    alert: stats.pendingSwaps > 0 },
              { label: 'Unassigned Slots', value: stats.unassignedSlots, icon: '📋', href: '/admin/schedule', alert: stats.unassignedSlots > 0 },
            ].map(s => (
              <Link
                key={s.label}
                href={s.href}
                className={`bg-white border rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow transition-shadow ${
                  s.alert ? 'border-amber-300' : 'border-stone-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                  s.alert ? 'bg-amber-50' : 'bg-stone-100'
                }`}>
                  {s.icon}
                </div>
                <div>
                  <div className={`text-2xl font-serif font-semibold leading-none ${s.alert ? 'text-amber-700' : ''}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">{s.label}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Two-column section — not shown to viewers */}
        {!isViewer && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* My upcoming duties */}
            <section className="bg-white border border-stone-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <h2 className="font-serif text-lg">My Upcoming Duties</h2>
                <Link href="/rota" className="text-xs text-teal-700 hover:underline">View rota →</Link>
              </div>
              {myUpcoming.length === 0 ? (
                <div className="px-5 py-8 text-center text-stone-400 text-sm space-y-3">
                  <p>No upcoming duties.</p>
                  <Link href="/rota" className="inline-block text-xs border border-stone-300 rounded-md px-3 py-1.5 hover:bg-stone-50">
                    Browse open slots
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {myUpcoming.map(s => (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide w-16 flex-shrink-0">
                        {fmtDate(s.date)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.duty}</p>
                        <p className="text-xs text-stone-400">{fmtTime(s.start_time)}–{fmtTime(s.end_time)} · {s.location}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Open slots */}
            <section className="bg-white border border-stone-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <h2 className="font-serif text-lg">Open Slots This Week</h2>
                <Link href="/rota" className="text-xs text-teal-700 hover:underline">Sign up →</Link>
              </div>
              {openSlots.length === 0 ? (
                <div className="px-5 py-8 text-center text-stone-400 text-sm">
                  All upcoming slots are filled.
                </div>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {openSlots.map(s => (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide w-16 flex-shrink-0">
                        {fmtDate(s.date)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.duty}</p>
                        <p className="text-xs text-stone-400">{fmtTime(s.start_time)}–{fmtTime(s.end_time)} · {s.location}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        s.spotsLeft === 1 ? 'bg-amber-100 text-amber-700' : 'bg-sage-100 text-sage-700'
                      }`}>
                        {s.spotsLeft} left
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {/* Quick actions — managers only */}
        {isManager && (
          <section>
            <h2 className="font-serif text-xl mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { href: '/admin/schedule/new', icon: '＋', label: 'Add Rota Slot'     },
                { href: '/admin/schedule',     icon: '📅', label: 'Manage Schedule'   },
                ...(profile.role === 'admin' ? [
                  { href: '/admin/members/new', icon: '👤', label: 'Add Member'        },
                  { href: '/admin/members',     icon: '👥', label: 'Manage Members'    },
                ] : []),
              ].map(a => (
                <Link
                  key={a.href} href={a.href}
                  className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center shadow-sm hover:shadow hover:border-stone-400 transition-all group"
                >
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs font-medium text-stone-600 group-hover:text-stone-900">{a.label}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
