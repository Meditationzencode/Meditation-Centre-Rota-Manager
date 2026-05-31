import { createServerClient } from '@supabase/ssr'
import { createClient as createSbClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY, getServiceRoleKey } from '@/lib/env'
import { log } from '@/lib/log'
import type { Role } from '@/lib/types'

/**
 * User-scoped Supabase client. Honours the caller's session cookies and RLS.
 * Use this for everything that should respect the signed-in user's permissions.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Server Components cannot set cookies; the middleware handles refresh.
        }
      },
    },
  })
}

/**
 * Service-role client — bypasses RLS. Server-side only; the key must never
 * reach the browser. Use sparingly: only for operations that legitimately
 * need elevated access (auth.admin.*, audit-log inserts, cross-user reads
 * inside a verified-admin code path).
 */
export function createAdminClient() {
  return createSbClient(SUPABASE_URL, getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Reads the signed-in user's own profile via the user-scoped client (RLS
 * applies). Returns null on miss. Use from server components and pages that
 * need the current user's name/role for layout chrome.
 */
export async function getMyProfile<
  T = { id: string; name: string; role: Role }
>(userId: string, columns = 'id, name, role'): Promise<T | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(columns)
    .eq('id', userId)
    .single()

  if (error) {
    log.warn({ action: 'getMyProfile', userId, message: 'profile lookup failed', err: error })
    return null
  }
  return data as T
}
