/**
 * Reset all demo account passwords to Demo1234!
 * Run: node scripts/reset-demo-passwords.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE   = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing env vars. Run with env vars set or use: node --env-file=.env.local scripts/reset-demo-passwords.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DEMO_EMAILS = [
  'admin@bodhigrove.demo',
  'coord1@bodhigrove.demo',
  'coord2@bodhigrove.demo',
  'vol1@bodhigrove.demo',
  'vol2@bodhigrove.demo',
  'vol3@bodhigrove.demo',
  'vol4@bodhigrove.demo',
]

async function main() {
  console.log('Fetching all users…')
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) { console.error('listUsers failed:', listErr.message); process.exit(1) }

  const allUsers = list?.users ?? []
  console.log(`Found ${allUsers.length} total users in auth.users\n`)

  for (const email of DEMO_EMAILS) {
    const user = allUsers.find(u => u.email === email)
    if (!user) {
      console.log(`  ✗ ${email} — NOT FOUND in auth.users`)
      continue
    }
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'Demo1234!',
      email_confirm: true,
    })
    if (error) {
      console.log(`  ✗ ${email}: ${error.message}`)
    } else {
      console.log(`  ✓ ${email} — password reset to Demo1234!`)
    }
  }

  console.log('\nDone. Try logging in now.')
}

main().catch(e => { console.error(e); process.exit(1) })
