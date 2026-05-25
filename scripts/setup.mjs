/**
 * Sangha Rota — one-shot setup script
 * Run after the numbered SQL files (01_schema.sql through 06_schema_v2.sql)
 * have been applied in the Supabase SQL editor.
 * Usage:  node scripts/setup.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing env vars. Make sure .env.local is populated.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Demo users ────────────────────────────────────────────────────────────────

const USERS = [
  { email: 'admin@bodhigrove.demo',    password: 'Demo1234!', name: 'Ananda Sharma',   role: 'admin' },
  { email: 'coord1@bodhigrove.demo',   password: 'Demo1234!', name: 'Maya Patel',      role: 'coordinator' },
  { email: 'coord2@bodhigrove.demo',   password: 'Demo1234!', name: 'Rohan Desai',     role: 'coordinator' },
  { email: 'vol1@bodhigrove.demo',     password: 'Demo1234!', name: 'James Whitfield', role: 'volunteer' },
  { email: 'vol2@bodhigrove.demo',     password: 'Demo1234!', name: 'Priya Nair',      role: 'volunteer' },
  { email: 'vol3@bodhigrove.demo',     password: 'Demo1234!', name: 'Tom Eriksson',    role: 'volunteer' },
  { email: 'vol4@bodhigrove.demo',     password: 'Demo1234!', name: 'Suki Tanaka',     role: 'volunteer' },
]

// ── Slot template (relative to ISO Monday) ───────────────────────────────────

const SLOT_TEMPLATES = [
  // Mon
  { day: 0, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 0, start: '08:00', end: '09:00', duty: 'Shrine Room Clean',  location: 'Shrine Room',   max: 2 },
  { day: 0, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  // Tue
  { day: 1, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 1, start: '09:00', end: '13:00', duty: 'Reception Desk',     location: 'Reception',     max: 1 },
  { day: 1, start: '12:00', end: '14:00', duty: 'Kitchen Duty',       location: 'Kitchen',       max: 2 },
  { day: 1, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  // Wed
  { day: 2, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 2, start: '08:00', end: '09:00', duty: 'Shrine Room Clean',  location: 'Shrine Room',   max: 2 },
  { day: 2, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  // Thu
  { day: 3, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 3, start: '09:00', end: '13:00', duty: 'Reception Desk',     location: 'Reception',     max: 1 },
  { day: 3, start: '12:00', end: '14:00', duty: 'Kitchen Duty',       location: 'Kitchen',       max: 2 },
  { day: 3, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  // Fri
  { day: 4, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 4, start: '10:00', end: '12:00', duty: 'Garden Maintenance', location: 'Gardens',       max: 3 },
  { day: 4, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  // Sat
  { day: 5, start: '10:00', end: '12:00', duty: 'Garden Maintenance', location: 'Gardens',       max: 3 },
  { day: 5, start: '12:00', end: '14:00', duty: 'Kitchen Duty',       location: 'Kitchen',       max: 2 },
  { day: 5, start: '18:30', end: '21:00', duty: 'Welcome Greeter',    location: 'Main Entrance', max: 1 },
  { day: 5, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  // Sun
  { day: 6, start: '08:00', end: '09:00', duty: 'Shrine Room Clean',  location: 'Shrine Room',   max: 2 },
  { day: 6, start: '18:30', end: '21:00', duty: 'Welcome Greeter',    location: 'Main Entrance', max: 1 },
  { day: 6, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
]

const NEXT_WEEK_TEMPLATES = [
  { day: 0, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 0, start: '08:00', end: '09:00', duty: 'Shrine Room Clean',  location: 'Shrine Room',   max: 2 },
  { day: 0, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  { day: 1, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 1, start: '09:00', end: '13:00', duty: 'Reception Desk',     location: 'Reception',     max: 1 },
  { day: 1, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  { day: 2, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 2, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  { day: 3, start: '06:30', end: '07:30', duty: 'Morning Sitting',    location: 'Shrine Room',   max: 2 },
  { day: 3, start: '09:00', end: '13:00', duty: 'Reception Desk',     location: 'Reception',     max: 1 },
  { day: 3, start: '12:00', end: '14:00', duty: 'Kitchen Duty',       location: 'Kitchen',       max: 2 },
  { day: 3, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  { day: 4, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  { day: 5, start: '18:30', end: '21:00', duty: 'Welcome Greeter',    location: 'Main Entrance', max: 1 },
  { day: 5, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
  { day: 6, start: '19:30', end: '20:30', duty: 'Evening Sitting',    location: 'Shrine Room',   max: 3 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoMonday(date = new Date()) {
  const d = new Date(date)
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function buildSlots(monday, templates) {
  return templates.map(t => ({
    date:           addDays(monday, t.day),
    week_start:     monday,
    start_time:     t.start,
    end_time:       t.end,
    duty:           t.duty,
    location:       t.location,
    max_volunteers: t.max,
    notes:          '',
  }))
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════')
  console.log(' Sangha Rota — database setup')
  console.log('═══════════════════════════════════════')

  // 1. Create auth users
  console.log('\n1. Creating auth users…')
  const userIds = {}
  for (const u of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })
    if (error) {
      if (error.message.includes('already been registered')) {
        // Fetch existing user by email
        const { data: list } = await supabase.auth.admin.listUsers()
        const existing = list?.users?.find(x => x.email === u.email)
        if (existing) {
          userIds[u.email] = existing.id
          console.log(`  ✓ ${u.email} (already exists)`)
          continue
        }
      }
      console.error(`  ✗ ${u.email}: ${error.message}`)
      process.exit(1)
    }
    userIds[u.email] = data.user.id
    console.log(`  ✓ ${u.email}`)
  }

  // 2. Upsert profiles
  console.log('\n2. Upserting profiles…')
  const profileRows = USERS.map(u => ({
    id:   userIds[u.email],
    name: u.name,
    role: u.role,
  }))
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(profileRows, { onConflict: 'id' })
  if (profileErr) {
    console.error('  ✗ profiles:', profileErr.message)
    process.exit(1)
  }
  console.log(`  ✓ ${profileRows.length} profiles`)

  // 3. Insert slots (this week + next week)
  console.log('\n3. Inserting slots…')
  const monday     = isoMonday()
  const nextMonday = addDays(monday, 7)
  const allSlots   = [
    ...buildSlots(monday, SLOT_TEMPLATES),
    ...buildSlots(nextMonday, NEXT_WEEK_TEMPLATES),
  ]
  const { error: slotErr } = await supabase.from('slots').insert(allSlots)
  if (slotErr) {
    // If slots already exist just warn rather than hard-fail
    if (slotErr.message.includes('duplicate') || slotErr.code === '23505') {
      console.log('  ⚠ slots already present, skipping')
    } else {
      console.error('  ✗ slots:', slotErr.message)
      process.exit(1)
    }
  } else {
    console.log(`  ✓ ${allSlots.length} slots`)
  }

  // 4. Sample signups — sign vol1 and vol2 up for Monday morning sitting this week
  console.log('\n4. Adding sample signups…')
  const { data: mondaySlots } = await supabase
    .from('slots')
    .select('id')
    .eq('date', monday)
    .eq('duty', 'Morning Sitting')
    .limit(1)

  if (mondaySlots && mondaySlots.length > 0) {
    const slotId   = mondaySlots[0].id
    const vol1Id   = userIds['vol1@bodhigrove.demo']
    const vol2Id   = userIds['vol2@bodhigrove.demo']
    const { error: signupErr } = await supabase
      .from('signups')
      .upsert([
        { slot_id: slotId, user_id: vol1Id },
        { slot_id: slotId, user_id: vol2Id },
      ], { onConflict: 'slot_id,user_id', ignoreDuplicates: true })
    if (signupErr) {
      console.log('  ⚠ signups:', signupErr.message)
    } else {
      console.log('  ✓ 2 sample signups')
    }
  } else {
    console.log('  ⚠ no Monday morning slot found, skipping signups')
  }

  console.log('\n═══════════════════════════════════════')
  console.log(' Setup complete!')
  console.log('═══════════════════════════════════════')
  console.log('\nDemo accounts (password: Demo1234!)')
  console.log('  Admin:       admin@bodhigrove.demo')
  console.log('  Coordinator: coord1@bodhigrove.demo')
  console.log('  Volunteer:   vol1@bodhigrove.demo')
  console.log('\nRun: npm run dev')
}

main().catch(e => { console.error(e); process.exit(1) })
