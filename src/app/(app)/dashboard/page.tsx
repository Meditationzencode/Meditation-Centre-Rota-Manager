import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient, getMyProfile } from '@/lib/supabase/server'
import { fmtDate, fmtTime } from '@/lib/utils'
import {
  Lotus, IconBell, IconCalendar, IconCalEx, IconUsers, IconSwap, IconHeart,
  IconCheck, IconRepeat, IconLeaf, IconCup, IconSunrise, IconSunset,
  IconClipCheck, IconPlus, IconArrowR, IconChevR,
  type IconComponent,
} from '@/components/portal/icons'

export const metadata: Metadata = { title: 'Dashboard' }

/* Pick a calm icon for a duty in the "centre rhythm" ribbon. */
function rhythmIcon(duty: string, start: string): { Icon: IconComponent; gold: boolean } {
  const d = duty.toLowerCase()
  if (d.includes('tea')) return { Icon: IconCup, gold: false }
  if (d.includes('garden')) return { Icon: IconLeaf, gold: false }
  const meditation = d.includes('sitting') || d.includes('meditat') || d.includes('shrine') || d.includes('chant')
  if (meditation) return start < '12:00' ? { Icon: IconSunrise, gold: true } : { Icon: IconSunset, gold: true }
  return { Icon: IconCalendar, gold: false }
}

type SlotStatus = 'covered' | 'alert' | 'progress' | 'done'
const PILL: Record<SlotStatus, { Icon: IconComponent; label: string; dot: string }> = {
  covered:  { Icon: IconCheck,  label: 'Covered',       dot: '' },
  alert:    { Icon: IconUsers,  label: 'Needs support', dot: 'alert' },
  progress: { Icon: IconRepeat, label: 'In progress',   dot: 'mist' },
  done:     { Icon: IconCheck,  label: 'Complete',      dot: 'done' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const nowHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

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
  const isAdmin   = profile.role === 'admin'
  const firstName = profile.name.split(' ')[0]

  const countFor = (slotId: string) => (allSignups ?? []).filter(s => s.slot_id === slotId).length

  // Today's services, with derived coverage/timing status.
  const todaySlots = (futureSlots ?? []).filter(s => s.date === today)
  const scheduleRows = todaySlots.slice(0, 6).map(s => {
    const signups = countFor(s.id)
    const start = fmtTime(s.start_time)
    const end = fmtTime(s.end_time)
    let status: SlotStatus
    if (end <= nowHM) status = 'done'
    else if (start <= nowHM && nowHM < end) status = 'progress'
    else if (signups === 0) status = 'alert'
    else status = 'covered'
    return { id: s.id, start, end, duty: s.duty, location: s.location, status }
  })

  // Centre rhythm ribbon — the first few of today's activities.
  const rhythm = todaySlots.slice(0, 4).map(s => {
    const start = fmtTime(s.start_time)
    return { id: s.id, name: s.duty, time: start, ...rhythmIcon(s.duty, start) }
  })

  // My upcoming duties (everyone but viewers).
  const mySignupSlotIds = new Set(
    (allSignups ?? []).filter(s => s.user_id === user.id).map(s => s.slot_id),
  )
  const myUpcomingAll = (futureSlots ?? []).filter(s => mySignupSlotIds.has(s.id))
  const myUpcoming = myUpcomingAll.slice(0, 5)
  const myUpcomingMore = myUpcomingAll.length - myUpcoming.length

  // Open slots in the next 7 days.
  const sevenDays = new Date(now)
  sevenDays.setDate(sevenDays.getDate() + 7)
  const sevenDaysStr = sevenDays.toISOString().slice(0, 10)
  const openSlots = (futureSlots ?? [])
    .filter(s => s.date <= sevenDaysStr)
    .map(s => ({ ...s, spotsLeft: s.max_volunteers - countFor(s.id) }))
    .filter(s => s.spotsLeft > 0)

  // Manager stats.
  const volunteersActive = (allProfiles ?? []).filter(p => p.role === 'volunteer' && p.active).length
  const unassignedFuture = (futureSlots ?? []).filter(s => countFor(s.id) === 0).length
  const unassignedToday = todaySlots.filter(s => countFor(s.id) === 0).length
  const nextToday = todaySlots.find(s => fmtTime(s.start_time) >= nowHM)

  const stats = [
    {
      label: 'Active Volunteers', Icon: IconUsers, value: volunteersActive,
      href: '/admin/members', alert: false, spark: true,
      foot: `${(allProfiles ?? []).length} members total`, footUp: false,
    },
    {
      label: 'Services Today', Icon: IconCalendar, value: todaySlots.length,
      href: '/admin/schedule', alert: false, spark: false,
      foot: nextToday ? `Next: ${nextToday.duty}` : 'All done for today', footUp: false,
    },
    {
      label: 'Pending Swaps', Icon: IconSwap, value: pendingSwapCount ?? 0,
      href: '/admin/swaps', alert: false, spark: false,
      foot: (pendingSwapCount ?? 0) > 0 ? 'Awaiting your review' : 'All clear', footUp: false,
    },
    {
      label: 'Needs Support', Icon: IconHeart, value: unassignedFuture,
      href: '/admin/schedule', alert: true, spark: false,
      foot: `${unassignedToday} today`, footUp: false, link: 'Review gaps',
    },
  ]

  // Notes & reminders — derived from real signals.
  type Note = { tone: 'sage' | 'gold' | 'rose'; Icon: IconComponent; title: string; sub: string; href: string }
  const notes: Note[] = []
  if (isManager) {
    if ((pendingSwapCount ?? 0) > 0) notes.push({
      tone: 'gold', Icon: IconSwap, href: '/admin/swaps',
      title: `${pendingSwapCount} swap ${pendingSwapCount === 1 ? 'request' : 'requests'} pending`,
      sub: 'Review and approve volunteer swaps.',
    })
    if (unassignedFuture > 0) notes.push({
      tone: 'rose', Icon: IconUsers, href: '/admin/schedule',
      title: `${unassignedFuture} ${unassignedFuture === 1 ? 'slot needs' : 'slots need'} a volunteer`,
      sub: 'Open slots are waiting for cover.',
    })
    notes.push({
      tone: 'sage', Icon: IconLeaf, href: '/admin/members',
      title: `${volunteersActive} active ${volunteersActive === 1 ? 'volunteer' : 'volunteers'}`,
      sub: 'Manage your team and roles.',
    })
  } else if (!isViewer) {
    if (myUpcomingAll[0]) notes.push({
      tone: 'sage', Icon: IconCalendar, href: '/rota',
      title: `Next duty: ${fmtDate(myUpcomingAll[0].date)}`,
      sub: `${myUpcomingAll[0].duty} · ${fmtTime(myUpcomingAll[0].start_time)}`,
    })
    if (openSlots.length > 0) notes.push({
      tone: 'gold', Icon: IconLeaf, href: '/rota',
      title: `${openSlots.length} open ${openSlots.length === 1 ? 'slot' : 'slots'} this week`,
      sub: 'Sign up to lend a hand.',
    })
  }
  const visibleNotes = notes.slice(0, 3)

  const scheduleHref = isManager ? '/admin/schedule' : '/rota'

  return (
    <>
      {/* ── Topbar ───────────────────────────────────────────── */}
      <header className="topbar">
        <div>
          <span className="topbar__greet">
            {greeting(now)}, {firstName} <Lotus size={18} />
          </span>
          <h1 className="topbar__title">Today at Bodhi Grove</h1>
          <p className="topbar__sub">A calm overview of volunteers, services, and centre support.</p>
        </div>
        <div className="topbar__right">
          <div className="topbar__util">
            {isManager && (
              <Link className="iconbtn" href="/admin/swaps" aria-label="Pending swap requests">
                <IconBell size={20} />
                {(pendingSwapCount ?? 0) > 0 && <span className="iconbtn__dot" />}
              </Link>
            )}
          </div>
          <div className="topbar__actions">
            {isManager ? (
              <>
                <Link className="actbtn" href="/admin/schedule/new"><IconPlus size={18} /> Add slot</Link>
                <Link className="actbtn" href="/admin/schedule"><IconCalEx size={18} /> Schedule</Link>
                {isAdmin && <Link className="actbtn" href="/admin/members"><IconUsers size={18} /> Volunteers</Link>}
              </>
            ) : (
              <Link className="actbtn" href="/rota"><IconCalendar size={18} /> Browse rota</Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Today's centre rhythm ────────────────────────────── */}
      <section className="rhythm rise" style={{ ['--d' as string]: '60ms' }}>
        <div className="rhythm__lead">
          <Image className="rhythm__leaf" src="/rhythm-leaf.png" alt="" width={88} height={66} />
          <div className="rhythm__title">
            <span className="rhythm__title-mark"><Lotus size={26} /></span>
            Today&apos;s centre rhythm
          </div>
        </div>
        <div className="rhythm__items">
          {rhythm.length === 0 ? (
            <p className="rhythm__empty">No services scheduled today — a quiet day at the centre.</p>
          ) : rhythm.map(r => (
            <div className="rhythm__item" key={r.id}>
              <span className={`rhythm__ico${r.gold ? ' rhythm__ico--gold' : ''}`}><r.Icon size={22} /></span>
              <div>
                <div className="rhythm__name">{r.name}</div>
                <div className="rhythm__time">{r.time}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stat cards (managers) ────────────────────────────── */}
      {isManager && (
        <section className="statgrid">
          {stats.map((s, i) => (
            <Link
              key={s.label}
              href={s.href}
              className={`statcard rise${s.alert ? ' statcard--alert' : ''}`}
              style={{ ['--d' as string]: `${120 + i * 70}ms` }}
            >
              <div className="statcard__top">
                <span className="statcard__ico"><s.Icon size={22} /></span>
                <div>
                  <div className="statcard__label">{s.label}</div>
                  <div className={`statcard__num${s.alert ? ' statcard__num--alert' : ''}`}>{s.value}</div>
                </div>
              </div>
              <div className="statcard__foot">
                <span className={`statcard__meta${s.alert ? ' statcard__meta--gold' : s.footUp ? ' statcard__meta--up' : ''}`}>
                  {s.foot}
                </span>
                {s.spark && (
                  <svg className="statcard__spark" viewBox="0 0 84 30" fill="none" stroke="currentColor"
                       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 24L14 20L26 22L40 13L54 16L68 7L82 4" />
                  </svg>
                )}
                {s.link && (
                  <span className="statcard__link">{s.link} <span className="chev"><IconArrowR size={14} /></span></span>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* ── Viewer banner ────────────────────────────────────── */}
      {isViewer && (
        <section className="viewer-note rise" style={{ ['--d' as string]: '120ms' }}>
          <p>You have viewer access. You can browse the rota but cannot sign up for slots.</p>
          <Link href="/rota">View this week&apos;s rota <IconArrowR size={16} /></Link>
        </section>
      )}

      {/* ── Schedule + my duties ─────────────────────────────── */}
      {isViewer ? (
        <section className="rise" style={{ ['--d' as string]: '200ms', marginTop: 'calc(20px * var(--space))' }}>
          <SchedulePanel rows={scheduleRows} href={scheduleHref} />
        </section>
      ) : (
        <section className="contentgrid">
          <div className="rise" style={{ ['--d' as string]: '420ms' }}>
            <SchedulePanel rows={scheduleRows} href={scheduleHref} />
          </div>

          <div className="panel rise" style={{ ['--d' as string]: '500ms' }}>
            <div className="panel__head">
              <div className="panel__titlewrap">
                <IconClipCheck size={22} />
                <h2 className="panel__title">My Upcoming Duties</h2>
              </div>
              <Link className="panel__action" href="/rota">View rota</Link>
            </div>
            {myUpcoming.length === 0 ? (
              <p className="timeline__empty">No duties on your schedule yet. Browse open slots to pick one up.</p>
            ) : (
              <div>
                {myUpcoming.map(s => (
                  <div className="annrow" key={s.id}>
                    <span className="annrow__ico"><IconCalendar size={20} /></span>
                    <div>
                      <div className="annrow__title">{s.duty}</div>
                      <div className="annrow__body">{fmtTime(s.start_time)}–{fmtTime(s.end_time)} · {s.location}</div>
                      <div className="annrow__date">{fmtDate(s.date)}</div>
                    </div>
                  </div>
                ))}
                {myUpcomingMore > 0 && (
                  <p className="timeline__foot">and {myUpcomingMore} more — view the full rota.</p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Notes & reminders ────────────────────────────────── */}
      {visibleNotes.length > 0 && (
        <section className="notes panel rise" style={{ ['--d' as string]: '580ms' }}>
          <div className="panel__head">
            <div className="panel__titlewrap">
              <IconClipCheck size={22} />
              <h2 className="panel__title">Notes &amp; reminders</h2>
            </div>
          </div>
          <div className="notegrid">
            {visibleNotes.map(n => (
              <Link className={`notecard notecard--${n.tone}`} key={n.title} href={n.href}>
                <span className="notecard__ico"><n.Icon size={21} /></span>
                <span className="notecard__body">
                  <span className="notecard__title">{n.title}</span>
                  <span className="notecard__sub">{n.sub}</span>
                </span>
                <span className="notecard__chev"><IconChevR size={18} /></span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function greeting(now: Date): string {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function SchedulePanel({
  rows,
  href,
}: {
  rows: { id: string; start: string; end: string; duty: string; location: string; status: SlotStatus }[]
  href: string
}) {
  return (
    <div className="panel">
      <div className="panel__head">
        <div className="panel__titlewrap">
          <IconCalendar size={22} />
          <h2 className="panel__title">Today&apos;s Schedule</h2>
        </div>
        <Link className="panel__action" href={href}>View schedule</Link>
      </div>
      {rows.length === 0 ? (
        <p className="timeline__empty">No services scheduled for today.</p>
      ) : (
        <div className="timeline">
          {rows.map(row => {
            const p = PILL[row.status]
            return (
              <div className={`tlrow${row.status === 'alert' ? ' tlrow--alert' : ''}`} key={row.id}>
                <div className="tlrow__time">{row.start}</div>
                <div className="tlrow__rail">
                  <span className={`tlrow__dot${p.dot ? ` tlrow__dot--${p.dot}` : ''}`} />
                </div>
                <div>
                  <div className="tlrow__duty">{row.duty}</div>
                  <div className="tlrow__loc">{row.location}</div>
                </div>
                <span className={`tlpill tlpill--${row.status}`}><p.Icon size={13} /> {p.label}</span>
              </div>
            )
          })}
        </div>
      )}
      <p className="timeline__foot">All times shown in your local timezone.</p>
    </div>
  )
}
