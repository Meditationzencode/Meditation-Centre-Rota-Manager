import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const today = new Date().toISOString().slice(0, 10)

const [{ data: profiles }, { data: slots }, { data: signups }] = await Promise.all([
  supabase.from('profiles').select('id, name, role, active'),
  supabase.from('slots').select('id, date, duty').gte('date', today).order('date').limit(10),
  supabase.from('signups').select('id').limit(1),
])

console.log('\n── Profiles ─────────────────────────────')
profiles?.forEach(p => console.log(`  ${p.active ? '✓' : '✗'} ${p.name.padEnd(20)} role=${p.role} active=${p.active}`))

console.log('\n── Upcoming slots (next 10 from today) ──')
if (!slots?.length) {
  console.log('  ✗ NO UPCOMING SLOTS — setup needs re-running!')
} else {
  slots.forEach(s => console.log(`  ${s.date}  ${s.duty}`))
}

console.log('\n── Signups ───────────────────────────────')
console.log(`  ${signups?.length ?? 0} total signups found`)
console.log()
