import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Role } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

export type AuthOk = { user: User; profile: { id: string; name: string; role: Role } }
export type AuthErr = { error: string }

/**
 * Confirms the request has an authenticated session, or redirects to /login.
 * Use at the top of every server action that mutates data on behalf of a user.
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Confirms the caller has at least one of the allowed roles.
 * Returns either the user+profile pair or a structured error suitable for
 * returning straight from an action. Use everywhere mutations should be
 * restricted by role — even when RLS would also block, for defence in depth.
 */
export async function requireRole(allowed: Role[]): Promise<AuthOk | AuthErr> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowed.includes(profile.role as Role)) {
    return { error: 'Not authorised.' }
  }
  return { user, profile: profile as AuthOk['profile'] }
}
