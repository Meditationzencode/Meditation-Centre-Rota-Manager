/**
 * Test login against the Supabase project configured in env vars.
 * Prints the project URL so you can confirm it matches Vercel.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing env vars.')
  process.exit(1)
}

console.log('Supabase URL:', SUPABASE_URL)
console.log()

const supabase = createClient(SUPABASE_URL, ANON_KEY)

const TEST_ACCOUNTS = [
  { email: 'admin@bodhigrove.demo',  password: 'Demo1234!' },
  { email: 'vol1@bodhigrove.demo',   password: 'Demo1234!' },
]

for (const { email, password } of TEST_ACCOUNTS) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.log(`✗ ${email}: ${error.message}`)
  } else {
    console.log(`✓ ${email}: login OK (user id: ${data.user?.id})`)
    await supabase.auth.signOut()
  }
}
