/**
 * Sangha Rota — rich demo state (for the portfolio demo)
 *
 * Resets the rota domain and seeds a believable, BUSY centre anchored to the
 * current week, so the app always looks live regardless of the date:
 *   • a full weekly pattern of duties across last / this / next week
 *   • realistic sign-ups (history covered; near-term mostly covered; some
 *     upcoming gaps) spread across all volunteers
 *   • a few pending shift swaps with human reasons
 *   • some volunteer unavailability
 *   • a matching recent activity log
 *
 * Deterministic (seeded RNG) so every run produces the same state.
 * Requires the demo accounts to exist first — run `npm run setup`.
 *
 * Usage:  node --env-file=.env.local scripts/seed-demo.mjs
 */

import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error('Missing env. Run: node --env-file=.env.local scripts/seed-demo.mjs')
  process.exit(1)
}
const supabase = createClient(URL, KEY, { auth: { persistSession: false } })

// ── Tunables ────────────────────────────────────────────────────────────────
const WEEKS_BACK = 1          // weeks of history kept
const HORIZON_DAYS = 42       // always keep this many days of upcoming shifts
                              // (≥31 days remain even between weekly refreshes)
const ALL = '00000000-0000-0000-0000-000000000000'

// Weekly duty pattern (day: 0=Mon … 6=Sun)
// Evening meditation is intentionally omitted — those evening slots are left
// free for the special events and classes below.
const TEMPLATE = [
  { day: 0, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 0, start: '08:00', end: '09:00', duty: 'Shrine Room Clean',  location: 'Shrine Room',   max: 2 },
  { day: 1, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 1, start: '09:00', end: '13:00', duty: 'Reception Desk',     location: 'Reception',     max: 1 },
  { day: 1, start: '12:00', end: '14:00', duty: 'Kitchen Duty',       location: 'Kitchen',       max: 2 },
  { day: 2, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 2, start: '08:00', end: '09:00', duty: 'Shrine Room Clean',  location: 'Shrine Room',   max: 2 },
  { day: 3, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 3, start: '09:00', end: '13:00', duty: 'Reception Desk',     location: 'Reception',     max: 1 },
  { day: 3, start: '12:00', end: '14:00', duty: 'Kitchen Duty',       location: 'Kitchen',       max: 2 },
  { day: 4, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 4, start: '10:00', end: '12:00', duty: 'Garden Maintenance', location: 'Gardens',       max: 3 },
  { day: 5, start: '10:00', end: '12:00', duty: 'Garden Maintenance', location: 'Gardens',       max: 3 },
  { day: 5, start: '12:00', end: '14:00', duty: 'Kitchen Duty',       location: 'Kitchen',       max: 2 },
  { day: 5, start: '18:30', end: '21:00', duty: 'Welcome Greeter',    location: 'Main Entrance', max: 1 },
  { day: 6, start: '08:00', end: '09:00', duty: 'Shrine Room Clean',  location: 'Shrine Room',   max: 2 },
  { day: 6, start: '18:30', end: '21:00', duty: 'Welcome Greeter',    location: 'Main Entrance', max: 1 },
  // Fixed weekly special events & classes
  { day: 1, start: '17:00', end: '20:00', duty: 'Sangha Film Club',   location: 'Community Room', max: 2 },
  { day: 4, start: '18:00', end: '20:00', duty: 'Puja Evening',       location: 'Shrine Room',    max: 2 },
  { day: 6, start: '10:00', end: '11:00', duty: 'Yoga',               location: 'Studio',         max: 1 },
]

// Fixed weekly events that also exist as recurring templates (so the admin
// "Recurring schedule" screen shows realistic definitions). days_of_week is
// 0 = Monday … 6 = Sunday, matching the TEMPLATE day index above.
const RECURRING_TEMPLATES = [
  { duty: 'Sangha Film Club', location: 'Community Room', days_of_week: [1], start_time: '17:00', end_time: '20:00', max_volunteers: 2, notes: 'Weekly film and discussion', active: true },
  { duty: 'Puja Evening',     location: 'Shrine Room',    days_of_week: [4], start_time: '18:00', end_time: '20:00', max_volunteers: 2, notes: 'Chanting and ritual',        active: true },
  { duty: 'Yoga',             location: 'Studio',         days_of_week: [6], start_time: '10:00', end_time: '11:00', max_volunteers: 1, notes: 'All-levels class',           active: true },
]

const SWAP_REASONS = [
  'Family commitment', 'Work schedule conflict', 'Unable to attend this morning',
  'Can cover a different shift instead', 'Away on holiday',
]

// ── Helpers ─────────────────────────────────────────────────────────────────
const iso = d => d.toISOString().slice(0, 10)
const addDays = (base, n) => { const d = new Date(base); d.setUTCDate(d.getUTCDate() + n); return d }
const isoMonday = d => { const x = new Date(d); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() - day + 1); return x }
function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = mulberry32(20260604)
const pick = arr => arr[Math.floor(rng() * arr.length)]

async function main() {
  console.log('Sangha Rota — rich demo seed\n')

  const today = new Date(); today.setUTCHours(0, 0, 0, 0)
  const todayIso = iso(today)
  const startMonday = isoMonday(addDays(today, -7 * WEEKS_BACK))
  const endDate = addDays(today, HORIZON_DAYS)

  // 1. Who do we have?
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, name, role')
  if (profErr) throw new Error(`Could not read profiles — check the service-role key / URL. ${profErr.message}`)
  const volunteers = (profiles ?? []).filter(p => p.role === 'volunteer')
  const coordinators = (profiles ?? []).filter(p => p.role === 'coordinator')
  const admin = (profiles ?? []).find(p => p.role === 'admin')
  if (volunteers.length < 4) {
    console.error('Not enough volunteers — run `npm run setup` first.'); process.exit(1)
  }
  console.log(`Members: ${(profiles ?? []).length} (${volunteers.length} volunteers)`)

  // 2. Reset rota domain + audit
  await supabase.from('shift_swaps').delete().neq('id', ALL)
  await supabase.from('slots').delete().neq('id', ALL)         // cascades signups + swaps
  await supabase.from('unavailability').delete().neq('id', ALL)
  await supabase.from('audit_log').delete().neq('id', ALL)
  await supabase.from('recurring_templates').delete().neq('id', ALL)
  console.log('✓ reset slots / signups / swaps / unavailability / audit / templates')

  // 3. Build + insert slots for every day from the history start through the
  //    rolling horizon, applying the weekly TEMPLATE by weekday.
  const slotRows = []
  for (let d = new Date(startMonday); d <= endDate; d = addDays(d, 1)) {
    const weekday = (d.getUTCDay() + 6) % 7   // Mon=0 … Sun=6
    for (const t of TEMPLATE) {
      if (t.day !== weekday) continue
      slotRows.push({
        date: iso(d), week_start: iso(isoMonday(d)), start_time: t.start, end_time: t.end,
        duty: t.duty, location: t.location, max_volunteers: t.max, notes: '', status: 'open',
      })
    }
  }
  // 3b. Varying-day and monthly special events (the fixed weekly ones are in
  //     TEMPLATE above). Placed deterministically within the seeded range.
  const pushSlot = (d, start, end, duty, location, max) => slotRows.push({
    date: iso(d), week_start: iso(isoMonday(d)), start_time: start, end_time: end,
    duty, location, max_volunteers: max, notes: '', status: 'open',
  })

  // Extended Practice Morning — weekly, but a different weekday (Mon–Fri) each week.
  for (let wk = new Date(startMonday); wk <= endDate; wk = addDays(wk, 7)) {
    const d = addDays(wk, Math.floor(rng() * 5))
    if (d >= startMonday && d <= endDate) pushSlot(d, '11:00', '15:00', 'Extended Practice Morning', 'Meditation Hall', 2)
  }

  // Monthly evening circles + Buddha Day — one upcoming occurrence each.
  pushSlot(addDays(today, 9),  '19:00', '21:00', "Women's Circle",     'Community Room', 2)
  pushSlot(addDays(today, 16), '19:00', '21:00', "Men's Evening",      'Community Room', 2)
  pushSlot(addDays(today, 23), '09:00', '17:00', 'Buddha Day (Wesak)', 'Shrine Room',    4)

  // Silence Day — monthly, on the next Saturday at least 5 days out.
  let sat = addDays(today, 5)
  while (((sat.getUTCDay() + 6) % 7) !== 5) sat = addDays(sat, 1)
  if (sat <= endDate) pushSlot(sat, '09:00', '17:00', 'Silence Day', 'Shrine Room', 3)

  // 3a-i. Centre policy: when a special event overlaps a daily meditation
  //       class, that meditation class is cancelled for the day. Mark any
  //       Morning/Evening Sitting that overlaps a same-day event as cancelled.
  const MEDITATION_DUTIES = new Set(['Morning Sitting', 'Evening Sitting'])
  const EVENT_DUTIES = new Set([
    'Sangha Film Club', 'Puja Evening', 'Yoga', 'Extended Practice Morning',
    "Women's Circle", "Men's Evening", 'Buddha Day (Wesak)', 'Silence Day',
  ])
  const overlaps = (a, b) => a.start_time < b.end_time && b.start_time < a.end_time
  const eventsByDate = new Map()
  for (const s of slotRows) {
    if (!EVENT_DUTIES.has(s.duty)) continue
    if (!eventsByDate.has(s.date)) eventsByDate.set(s.date, [])
    eventsByDate.get(s.date).push(s)
  }
  let cancelledCount = 0
  for (const s of slotRows) {
    if (!MEDITATION_DUTIES.has(s.duty)) continue
    const sameDay = eventsByDate.get(s.date)
    if (sameDay && sameDay.some(e => overlaps(s, e))) { s.status = 'cancelled'; cancelledCount++ }
  }

  const { data: slots, error: slotErr } = await supabase.from('slots').insert(slotRows)
    .select('id, date, start_time, duty, max_volunteers, status')
  if (slotErr) throw slotErr
  console.log(`✓ ${slots.length} slots (history + ${HORIZON_DAYS} days ahead); ${cancelledCount} meditation classes cancelled for overlapping events`)

  // 3c. Recurring templates for the fixed weekly events.
  await supabase.from('recurring_templates').insert(RECURRING_TEMPLATES)
  console.log(`✓ ${RECURRING_TEMPLATES.length} recurring templates`)

  // 4. Unavailability for a few volunteers (future dates) — seed BEFORE signups
  const unavailByUser = new Map()  // userId -> Set(date)
  const unavailRows = []
  for (const v of volunteers.slice(0, 5)) {
    const n = 1 + Math.floor(rng() * 2)
    const set = new Set()
    for (let i = 0; i < n; i++) {
      const date = iso(addDays(today, 2 + Math.floor(rng() * 18)))
      if (set.has(date)) continue
      set.add(date)
      unavailRows.push({ user_id: v.id, date, note: pick(['Holiday', 'Work trip', 'Family visit', 'Appointment', '']) })
    }
    unavailByUser.set(v.id, set)
  }
  if (unavailRows.length) await supabase.from('unavailability').upsert(unavailRows, { onConflict: 'user_id,date', ignoreDuplicates: true })
  console.log(`✓ ${unavailRows.length} unavailability entries`)

  // 5. Assign sign-ups — history covered, near-term mostly covered, some gaps ahead
  const signupRows = []
  const onDate = new Map()    // `${userId}|${date}` flag to avoid double-booking a day
  let rot = 0
  const order = [...volunteers].sort(() => rng() - 0.5)
  for (const s of slots) {
    if (s.status === 'cancelled') continue                        // no sign-ups for cancelled classes
    const daysAhead = Math.round((new Date(s.date) - today) / 86_400_000)
    let target
    if (daysAhead <= 0) {
      target = s.max_volunteers                                  // history + today: fully covered
    } else {
      const emptyProb = Math.min(0.12, 0.015 + 0.008 * daysAhead)
      if (rng() < emptyProb) { continue }                        // leave a few open slots
      target = Math.max(1, Math.round(s.max_volunteers * (0.7 + rng() * 0.3)))  // well-staffed
    }
    target = Math.min(target, s.max_volunteers)
    let assigned = 0, tries = 0
    while (assigned < target && tries < order.length) {
      const v = order[rot % order.length]; rot++; tries++
      const key = `${v.id}|${s.date}`
      if (onDate.has(key)) continue
      if (unavailByUser.get(v.id)?.has(s.date)) continue
      onDate.set(key, true)
      signupRows.push({ slot_id: s.id, user_id: v.id })
      assigned++
    }
  }
  for (let i = 0; i < signupRows.length; i += 200) {
    const { error } = await supabase.from('signups').upsert(signupRows.slice(i, i + 200), { onConflict: 'slot_id,user_id', ignoreDuplicates: true })
    if (error) console.log('  ⚠ signups:', error.message)
  }
  console.log(`✓ ${signupRows.length} sign-ups`)

  // 6. Pending swaps on a few upcoming, covered slots (distinct requesters)
  const signedBySlot = new Map()
  for (const su of signupRows) {
    if (!signedBySlot.has(su.slot_id)) signedBySlot.set(su.slot_id, [])
    signedBySlot.get(su.slot_id).push(su.user_id)
  }
  const upcoming = slots
    .filter(s => new Date(s.date) > today && signedBySlot.has(s.id))
    .sort((a, b) => a.date.localeCompare(b.date))
  const swapRows = []
  const usedReq = new Set()
  for (const s of upcoming) {
    if (swapRows.length >= SWAP_REASONS.length) break
    const requester = signedBySlot.get(s.id).find(u => !usedReq.has(u))
    if (!requester) continue
    usedReq.add(requester)
    swapRows.push({ requester_id: requester, slot_id: s.id, reason: SWAP_REASONS[swapRows.length], status: 'pending' })
  }
  if (swapRows.length) await supabase.from('shift_swaps').insert(swapRows)
  console.log(`✓ ${swapRows.length} pending swaps`)

  // 7. Recent activity log matching the data
  const nameById = new Map((profiles ?? []).map(p => [p.id, p.name]))
  const at = mins => new Date(Date.now() - mins * 60_000).toISOString()
  const auditRows = []
  // swap requests for the pending swaps
  swapRows.forEach((sw, i) => auditRows.push({
    user_id: sw.requester_id, action: 'swap.request', entity_type: 'shift_swap', entity_id: sw.slot_id,
    detail: `Requested swap for slot ${sw.slot_id}`, created_at: at(45 + i * 30),
  }))
  // a spread of recent sign-ups
  const recentSignups = signupRows.slice(0, 8)
  recentSignups.forEach((su, i) => {
    const s = slots.find(x => x.id === su.slot_id)
    if (s) auditRows.push({
      user_id: su.user_id, action: 'signup.add', entity_type: 'signup', entity_id: s.id,
      detail: `Signed up for ${s.duty} on ${s.date}`, created_at: at(180 + i * 55),
    })
  })
  // scheduling actions by coordinators / admin
  const someSlot = slots[Math.floor(slots.length / 2)]
  if (coordinators[0] && someSlot) auditRows.push({
    user_id: coordinators[0].id, action: 'slot.create', entity_type: 'slot', entity_id: someSlot.id,
    detail: `Created slot: ${someSlot.duty} on ${someSlot.date} at Shrine Room`, created_at: at(700),
  })
  if (admin) auditRows.push({
    user_id: admin.id, action: 'member.update', entity_type: 'member', entity_id: admin.id,
    detail: `Updated member: ${nameById.get(volunteers[volunteers.length - 1].id)} → role=volunteer, active=true`, created_at: at(1400),
  })
  if (admin) auditRows.push({
    user_id: admin.id, action: 'slots.generate', entity_type: 'slot', entity_id: null,
    detail: `Generated ${TEMPLATE.length} slots from ${iso(startMonday)} to ${slots[slots.length - 1].date}`, created_at: at(2600),
  })
  await supabase.from('audit_log').insert(auditRows)
  console.log(`✓ ${auditRows.length} activity entries`)

  // 8. Dashboard preview
  const filled = new Set(signupRows.map(s => s.slot_id))
  const active = slots.filter(s => s.status !== 'cancelled')
  const servicesToday = active.filter(s => s.date === todayIso).length
  const unfilledFuture = active.filter(s => s.date >= todayIso && !filled.has(s.id)).length
  console.log(`\nDashboard → Services Today: ${servicesToday} · Pending Swaps: ${swapRows.length} · Unfilled (future): ${unfilledFuture} · Volunteers: ${volunteers.length}`)
  console.log('\n✓ done')
}

main().catch(e => { console.error('✗', e); process.exit(1) })
