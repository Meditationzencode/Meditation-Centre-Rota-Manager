import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Role } from '@/lib/types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  )
}

/** Service-role client — server-side only, never expose to browser */
export function createAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function getProfileForUser<T = { id: string; name: string; role: Role }>(
  userId: string,
  columns = 'id, name, role',
) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select(columns)
    .eq('id', userId)
    .single()

  if (error) {
    console.error('[profile] lookup failed:', userId, error.message)
    return null
  }

  return data as T
}
