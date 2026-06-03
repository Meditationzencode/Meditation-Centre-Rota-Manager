/**
 * Sangha Rota — demo data cleanup
 *
 * The Playwright E2E suite runs against the live demo database and leaves
 * behind test pollution: far-future (2099) slots/signups/unavailability and
 * many "Automated test swap request" swaps. This script removes that junk and
 * leaves a small, realistic set of pending swap requests so the admin
 * dashboard and Swaps page look like a real rota rather than a test fixture.
 *
 * Safe to re-run. Usage:  node --env-file=.env.local scripts/clean-demo.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing env vars. Run with: node --env-file=.env.local scripts/clean-demo.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Anything dated on/after this is test data (the suite uses 2099-xx-xx).
const FUTURE_CUTOFF = '2027-01-01'
const ALL = '00000000-0000-0000-0000-000000000000' // sentinel for "delete all rows"

// Realistic pending swaps to leave behind (reason per requester).
const SWAP_REASONS = [
  'Family commitment',
  'Work schedule conflict',
  'Unable to attend this morning',
  'Can cover a different shift instead',
]

async function count(table, build = q => q) {
  const { count } = await build(supabase.from(table).select('*', { count: 'exact', head: true }))
  return count ?? 0
}

async function main() {
  console.log('═══════════════════════════════════════')
  console.log(' Sangha Rota — demo cleanup')
  console.log('═══════════════════════════════════════')

  // ── Before ──────────────────────────────────────────────────────────────
  const before = {
    swaps:     await count('shift_swaps'),
    junkSlots: await count('slots', q => q.gte('date', FUTURE_CUTOFF)),
    junkUnav:  await count('unavailability', q => q.gte('date', FUTURE_CUTOFF)),
    audit2099: await count('audit_log', q => q.ilike('detail', '%2099%')),
  }
  console.log('\nBefore:', before)

  // ── 1. Remove all swap requests (test pollution; we reseed a few below) ──
  let { error } = await supabase.from('shift_swaps').delete().neq('id', ALL)
  if (error) throw error
  console.log('\n✓ cleared shift_swaps')

  // ── 2. Remove far-future test slots (cascades signups + swaps) ──────────
  ;({ error } = await supabase.from('slots').delete().gte('date', FUTURE_CUTOFF))
  if (error) throw error
  console.log('✓ removed far-future slots (+ cascaded signups)')

  // ── 3. Remove far-future unavailability ─────────────────────────────────
  ;({ error } = await supabase.from('unavailability').delete().gte('date', FUTURE_CUTOFF))
  if (error) throw error
  console.log('✓ removed far-future unavailability')

  // ── 4. Scrub audit entries that reference 2099 / automated tests ────────
  for (const pat of ['%2099%', '%Automated test%', '%test swap%']) {
    ;({ error } = await supabase.from('audit_log').delete().ilike('detail', pat))
    if (error) throw error
  }
  console.log('✓ scrubbed test audit entries')

  // ── 5. Seed a few realistic pending swaps on recent real slots ──────────
  const { data: profiles } = await supabase.from('profiles').select('id, name, role')
  const volunteers = (profiles ?? []).filter(p => p.role === 'volunteer')

  const { data: realSlots } = await supabase
    .from('slots')
    .select('id, date, duty, location, max_volunteers')
    .lt('date', FUTURE_CUTOFF)
    .order('date', { ascending: false })
    .limit(60)

  const { data: signups } = await supabase.from('signups').select('slot_id, user_id')
  const countBySlot = new Map()
  const usersBySlot = new Map()
  for (const s of signups ?? []) {
    countBySlot.set(s.slot_id, (countBySlot.get(s.slot_id) ?? 0) + 1)
    if (!usersBySlot.has(s.slot_id)) usersBySlot.set(s.slot_id, new Set())
    usersBySlot.get(s.slot_id).add(s.user_id)
  }

  let made = 0
  const usedSlots = new Set()
  const madeSwaps = []
  for (const vol of volunteers) {
    if (made >= SWAP_REASONS.length) break
    // find a distinct, recent slot with spare capacity this volunteer isn't on
    const slot = (realSlots ?? []).find(s =>
      !usedSlots.has(s.id) &&
      (countBySlot.get(s.id) ?? 0) < s.max_volunteers &&
      !(usersBySlot.get(s.id)?.has(vol.id)))
    if (!slot) continue

    // ensure the requester is actually signed up for the slot
    const { error: suErr } = await supabase
      .from('signups')
      .upsert({ slot_id: slot.id, user_id: vol.id }, { onConflict: 'slot_id,user_id', ignoreDuplicates: true })
    if (suErr) { console.log('  ⚠ signup skip:', suErr.message); continue }

    const { error: swErr } = await supabase
      .from('shift_swaps')
      .insert({ requester_id: vol.id, slot_id: slot.id, reason: SWAP_REASONS[made], status: 'pending' })
    if (swErr) { console.log('  ⚠ swap skip:', swErr.message); continue }

    usedSlots.add(slot.id)
    madeSwaps.push({ vol, slot })
    console.log(`  ✓ swap: ${vol.name} — "${SWAP_REASONS[made]}" (${slot.duty}, ${slot.date})`)
    made++
  }

  // ── 6. Remove stale swap audit rows that point at deleted slots ─────────
  const slotIds = new Set((realSlots ?? []).map(s => s.id))
  const { data: swapAudit } = await supabase.from('audit_log').select('id, entity_id').like('action', 'swap%')
  const staleAudit = (swapAudit ?? []).filter(a => !a.entity_id || !slotIds.has(a.entity_id)).map(a => a.id)
  for (let i = 0; i < staleAudit.length; i += 100) {
    await supabase.from('audit_log').delete().in('id', staleAudit.slice(i, i + 100))
  }
  if (staleAudit.length) console.log(`✓ removed ${staleAudit.length} stale swap audit rows`)

  // ── 7. Seed a realistic, varied activity log (only when sparse) ─────────
  const auditNow = await count('audit_log')
  if (auditNow < 15) {
    const admin = (profiles ?? []).find(p => p.role === 'admin')
    const coord = (profiles ?? []).find(p => p.role === 'coordinator')
    const recent = (realSlots ?? []).slice(0, 12)
    const at = mins => new Date(Date.now() - mins * 60_000).toISOString()
    const rows = []
    // swap requests matching the pending swaps we just created
    madeSwaps.forEach((m, i) => rows.push({
      user_id: m.vol.id, action: 'swap.request', entity_type: 'shift_swap', entity_id: m.slot.id,
      detail: `Requested swap for slot ${m.slot.id}`, created_at: at(60 + i * 35),
    }))
    // a spread of signups across volunteers + recent slots
    volunteers.slice(0, 4).forEach((v, i) => {
      const s = recent[i]
      if (s) rows.push({
        user_id: v.id, action: 'signup.add', entity_type: 'signup', entity_id: s.id,
        detail: `Signed up for ${s.duty} on ${s.date}`, created_at: at(240 + i * 90),
      })
    })
    // a couple of admin/coordinator scheduling actions
    if (coord && recent[0]) rows.push({
      user_id: coord.id, action: 'slot.create', entity_type: 'slot', entity_id: recent[0].id,
      detail: `Created slot: ${recent[0].duty} on ${recent[0].date} at ${recent[0].location}`, created_at: at(900),
    })
    if (admin) rows.push({
      user_id: admin.id, action: 'member.update', entity_type: 'member', entity_id: admin.id,
      detail: 'Updated member: Tom Eriksson → role=volunteer, active=true', created_at: at(1500),
    })
    if (admin && recent[0]) rows.push({
      user_id: admin.id, action: 'slots.generate', entity_type: 'slot', entity_id: null,
      detail: `Generated 16 slots from ${recent[recent.length - 1]?.date ?? recent[0].date} to ${recent[0].date}`,
      created_at: at(2600),
    })
    const { error: auditErr } = await supabase.from('audit_log').insert(rows)
    if (auditErr) console.log('  ⚠ activity seed:', auditErr.message)
    else console.log(`✓ seeded ${rows.length} realistic activity entries`)
  } else {
    console.log(`• activity log already populated (${auditNow} rows) — skipping seed`)
  }

  // ── After ───────────────────────────────────────────────────────────────
  const after = {
    swaps:     await count('shift_swaps'),
    junkSlots: await count('slots', q => q.gte('date', FUTURE_CUTOFF)),
    junkUnav:  await count('unavailability', q => q.gte('date', FUTURE_CUTOFF)),
    audit2099: await count('audit_log', q => q.ilike('detail', '%2099%')),
    realSlots: await count('slots', q => q.lt('date', FUTURE_CUTOFF)),
  }
  console.log('\nAfter:', after)
  console.log('\n✓ cleanup complete')
}

main().catch(e => { console.error('\n✗ cleanup failed:', e); process.exit(1) })
