import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ────────────────────────────────────────────────────────────────────────────
// Row-Level Security tests — direct database access, NOT through the UI.
//
// Every other spec drives the browser against the running app. This one does
// the opposite: it talks straight to Supabase with the anon key — the exact
// key that ships in the browser bundle — exactly as a malicious user would
// from DevTools, bypassing middleware and Server Actions entirely.
//
// If the database is the ultimate authority (the claim the README makes), a
// signed-in volunteer's own token must NOT be able to read other users' data
// or escalate their own role, no matter how the request is crafted.
//
// Policies under test live in supabase/02_rls.sql and supabase/04_features.sql.
// ────────────────────────────────────────────────────────────────────────────

// Playwright doesn't load .env.local into the test process (the UI specs only
// need it on the dev server). Pull it in here; in CI the vars may be injected
// another way, so a missing file is non-fatal.
try {
  process.loadEnvFile('.env.local')
} catch {
  /* env provided by the environment instead */
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const VOL_EMAIL = process.env.TEST_VOL_EMAIL ?? 'vol1@bodhigrove.demo'
const VOL_PASSWORD = process.env.TEST_VOL_PASSWORD ?? 'Demo1234!'
const VOL2_EMAIL = process.env.TEST_VOL2_EMAIL ?? 'vol2@bodhigrove.demo'
const VOL2_PASSWORD = process.env.TEST_VOL2_PASSWORD ?? 'Demo1234!'

type Session = { client: SupabaseClient; userId: string }

/** Sign in with the anon key and return the authed client + user id. */
async function signIn(email: string, password: string): Promise<Session> {
  const client = createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  expect(error, `sign-in failed for ${email}: ${error?.message}`).toBeNull()
  expect(data.user, `no user returned for ${email}`).not.toBeNull()
  return { client, userId: data.user!.id }
}

test.describe('Row-Level Security (direct DB access with the anon key)', () => {
  // Skip the whole group rather than fail noisily when the keys aren't present
  // (e.g. a fresh clone with no .env.local).
  test.skip(
    !SUPABASE_URL || !ANON_KEY,
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g. in .env.local) to run RLS tests',
  )

  test('a volunteer cannot escalate their own role to admin', async () => {
    const vol = await signIn(VOL_EMAIL, VOL_PASSWORD)
    try {
      // Positive control: prove the session is genuinely authenticated, so the
      // "denied" assertions below can't pass simply because we're logged out.
      const { data: own } = await vol.client
        .from('profiles')
        .select('id, role')
        .eq('id', vol.userId)
        .single()
      expect(own, 'volunteer should be able to read their own profile').not.toBeNull()
      expect(own!.role, 'fixture account must start as a volunteer').toBe('volunteer')

      // The attack: rewrite my own row to make myself an admin.
      const { error } = await vol.client
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', vol.userId)
        .select()

      // The profiles_update_own WITH CHECK forbids a volunteer setting any role
      // other than 'volunteer', so Postgres rejects the write outright.
      expect(error, 'role escalation should be rejected by RLS').not.toBeNull()
      expect(error!.message).toMatch(/row-level security|violates/i)

      // Belt-and-braces: confirm the role on disk is unchanged.
      const { data: after } = await vol.client
        .from('profiles')
        .select('role')
        .eq('id', vol.userId)
        .single()
      expect(after!.role).toBe('volunteer')
    } finally {
      await vol.client.auth.signOut()
    }
  })

  test('a volunteer cannot modify another user\'s profile', async () => {
    const other = await signIn(VOL2_EMAIL, VOL2_PASSWORD)
    await other.client.auth.signOut()

    const vol = await signIn(VOL_EMAIL, VOL_PASSWORD)
    try {
      // USING (auth.uid() = id) on profiles_update_own scopes the update to my
      // own row only, so this matches zero rows — no row is returned/changed.
      const { data, error } = await vol.client
        .from('profiles')
        .update({ name: 'hacked' })
        .eq('id', other.userId)
        .select()

      expect(error).toBeNull()
      expect(data, 'no rows should be updatable for another user').toEqual([])
    } finally {
      await vol.client.auth.signOut()
    }
  })

  test('a volunteer cannot read another user\'s unavailability', async () => {
    // As vol2, plant a private unavailability row we can try to steal as vol1.
    const owner = await signIn(VOL2_EMAIL, VOL2_PASSWORD)
    const testDate = '2099-12-31'
    let plantedId: string | null = null
    try {
      // Clear any leftover from a previous run (own-row delete is permitted).
      await owner.client
        .from('unavailability')
        .delete()
        .eq('user_id', owner.userId)
        .eq('date', testDate)

      const { data: planted, error: plantErr } = await owner.client
        .from('unavailability')
        .insert({ user_id: owner.userId, date: testDate, note: 'rls-secret' })
        .select()
        .single()
      expect(plantErr, `failed to plant fixture row: ${plantErr?.message}`).toBeNull()
      plantedId = planted!.id

      await owner.client.auth.signOut()

      // As vol1, try every way to read vol2's row.
      const vol = await signIn(VOL_EMAIL, VOL_PASSWORD)
      try {
        // Direct lookup by primary key.
        const byId = await vol.client
          .from('unavailability')
          .select('*')
          .eq('id', plantedId)
        expect(byId.error).toBeNull()
        expect(byId.data, 'should not see another user\'s row by id').toEqual([])

        // Filter by the other user's id.
        const byUser = await vol.client
          .from('unavailability')
          .select('*')
          .eq('user_id', owner.userId)
        expect(byUser.error).toBeNull()
        expect(byUser.data, 'should not see another user\'s rows by user_id').toEqual([])

        // Unfiltered scan: whatever comes back must be the volunteer's own.
        const all = await vol.client.from('unavailability').select('user_id')
        expect(all.error).toBeNull()
        for (const row of all.data ?? []) {
          expect(row.user_id, 'unfiltered query leaked another user\'s row').toBe(vol.userId)
        }
      } finally {
        await vol.client.auth.signOut()
      }
    } finally {
      // Clean up the planted row regardless of assertion outcomes.
      const cleanup = await signIn(VOL2_EMAIL, VOL2_PASSWORD)
      if (plantedId) {
        await cleanup.client.from('unavailability').delete().eq('id', plantedId)
      }
      await cleanup.client.auth.signOut()
    }
  })

  test('a volunteer cannot read the audit log (admin-only)', async () => {
    const vol = await signIn(VOL_EMAIL, VOL_PASSWORD)
    try {
      // audit_log has only an admin SELECT policy, so a volunteer matches no
      // policy and sees an empty set — never another user's actions.
      const { data, error } = await vol.client.from('audit_log').select('*')
      expect(error).toBeNull()
      expect(data, 'volunteer must not read any audit_log rows').toEqual([])
    } finally {
      await vol.client.auth.signOut()
    }
  })
})
