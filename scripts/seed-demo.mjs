/**
 * Sangha Rota — believable demo state (for the v1.0.0 portfolio release)
 *
 * Tops up a curated, current/upcoming week of slots + signups + a few pending
 * swaps so the admin dashboard reads as a live system:
 *   Services Today: ~2   Pending Swaps: 4   Unfilled Slots: ~5
 * Past (history) slots are left untouched. Safe to re-run — it first clears
 * any existing future slots and all swaps, then reseeds deterministically.
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

const ALL = '00000000-0000-0000-0000-000000000000'
const iso = d => d.toISOString().slice(0, 10)
const today = new Date(); today.setUTCHours(0, 0, 0, 0)
const addDays = (base, n) => { const d = new Date(base); d.setUTCDate(d.getUTCDate() + n); return d }
const isoMonday = d => { const x = new Date(d); const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() - day + 1); return iso(x) }

// Curated slots relative to today (offset in days). `who` lists volunteer
// first-names to sign up; an empty list = an unfilled slot.
const PLAN = [
  // past-but-this-week (history flavour)
  { off: -2, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2, who: ['James', 'Priya'] },
  { off: -1, start: '09:00', end: '13:00', duty: 'Reception Desk',     location: 'Reception',     max: 1, who: ['Tom'] },
  // today
  { off: 0,  start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2, who: ['James', 'Priya'] },
  { off: 0,  start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3, who: ['Tom'] },
  // upcoming — a believable mix of covered and open
  { off: 1,  start: '09:00', end: '13:00', duty: 'Reception Desk',     location: 'Reception',     max: 1, who: ['James'], swap: 'Family commitment' },
  { off: 1,  start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3, who: [] },
  { off: 2,  start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2, who: ['Suki'], swap: 'Work schedule conflict' },
  { off: 2,  start: '10:00', end: '12:00', duty: 'Garden Maintenance', location: 'Gardens',       max: 3, who: [] },
  { off: 3,  start: '18:30', end: '21:00', duty: 'Welcome Greeter',    location: 'Main Entrance', max: 1, who: [] },
  { off: 3,  start: '10:00', end: '12:00', duty: 'Garden Maintenance', location: 'Gardens',       max: 3, who: ['Priya'], swap: 'Can cover a different shift instead' },
  { off: 4,  start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3, who: [] },
  { off: 5,  start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2, who: ['Tom'], swap: 'Unable to attend this morning' },
  { off: 5,  start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3, who: [] },
  { off: 6,  start: '09:00', end: '13:00', duty: 'Reception Desk',     location: 'Reception',     max: 1, who: ['Suki'] },
]

async function main() {
  console.log('Sangha Rota — believable demo seed\n')

  const { data: profiles } = await supabase.from('profiles').select('id, name, role')
  const byFirst = new Map((profiles ?? []).map(p => [p.name.split(' ')[0], p.id]))
  const adminId = (profiles ?? []).find(p => p.role === 'admin')?.id

  // 1. Clear all swaps + any existing future slots (cascades their signups/swaps)
  await supabase.from('shift_swaps').delete().neq('id', ALL)
  await supabase.from('slots').delete().gte('date', iso(today))
  console.log('✓ cleared swaps + existing future slots')

  // 2. Insert the curated slots
  const rows = PLAN.map(p => {
    const date = iso(addDays(today, p.off))
    return {
      date, week_start: isoMonday(addDays(today, p.off)),
      start_time: p.start, end_time: p.end, duty: p.duty, location: p.location,
      max_volunteers: p.max, notes: '',
    }
  })
  const { data: inserted, error: slotErr } = await supabase.from('slots').insert(rows).select('id, date, start_time, duty')
  if (slotErr) throw slotErr
  console.log(`✓ inserted ${inserted.length} curated slots`)

  // match inserted rows back to the plan (date + start_time + duty are unique enough here)
  const key = r => `${r.date}|${r.start_time.slice(0, 5)}|${r.duty}`
  const slotByKey = new Map(inserted.map(r => [key({ date: r.date, start_time: r.start_time, duty: r.duty }), r.id]))

  // 3. Signups + 4. pending swaps
  const signups = []
  const swaps = []
  let swapReasonsUsed = 0
  for (const p of PLAN) {
    const date = iso(addDays(today, p.off))
    const slotId = slotByKey.get(`${date}|${p.start}|${p.duty}`)
    if (!slotId) continue
    for (const first of p.who) {
      const uid = byFirst.get(first)
      if (uid) signups.push({ slot_id: slotId, user_id: uid })
    }
    if (p.swap && p.who[0]) {
      const uid = byFirst.get(p.who[0])
      if (uid) { swaps.push({ requester_id: uid, slot_id: slotId, reason: p.swap, status: 'pending' }); swapReasonsUsed++ }
    }
  }
  if (signups.length) {
    const { error } = await supabase.from('signups').upsert(signups, { onConflict: 'slot_id,user_id', ignoreDuplicates: true })
    if (error) console.log('  ⚠ signups:', error.message)
  }
  if (swaps.length) {
    const { error } = await supabase.from('shift_swaps').insert(swaps)
    if (error) console.log('  ⚠ swaps:', error.message)
  }
  console.log(`✓ ${signups.length} signups, ${swaps.length} pending swaps`)

  // 5. Report the resulting dashboard-relevant numbers
  const c = async (b = q => q) => (await b(supabase.from('slots').select('*', { count: 'exact', head: true }))).count ?? 0
  const t = iso(today)
  const servicesToday = await c(q => q.eq('date', t))
  const futureSlots = (await supabase.from('slots').select('id').gte('date', t)).data ?? []
  const su = (await supabase.from('signups').select('slot_id')).data ?? []
  const filled = new Set(su.map(s => s.slot_id))
  const unfilledFuture = futureSlots.filter(s => !filled.has(s.id)).length
  const pending = (await supabase.from('shift_swaps').select('*', { count: 'exact', head: true }).eq('status', 'pending')).count ?? 0
  console.log(`\nDashboard preview → Services Today: ${servicesToday} · Pending Swaps: ${pending} · Unfilled (future): ${unfilledFuture}`)
  console.log(`(admin: ${adminId ? 'ok' : 'missing'})`)
  console.log('\n✓ done')
}

main().catch(e => { console.error('✗', e); process.exit(1) })
