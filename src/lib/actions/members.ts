'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { translatePostgresError } from '@/lib/errors'
import { str, isEmail, MAX_LEN } from '@/lib/validation'
import type { ActionResult, Role } from '@/lib/types'

export async function createMember(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const guard = await requireRole(['admin'])
  if ('error' in guard) return guard
  const { user: caller } = guard

  const name     = str(formData.get('name'))
  const email    = str(formData.get('email')).toLowerCase()
  const role     = formData.get('role')      as Role
  const password = str(formData.get('password'))
  if (!name || !email || !role || !password) return { error: 'All fields are required.' }
  if (name.length > MAX_LEN.name) return { error: `Name must be ${MAX_LEN.name} characters or fewer.` }
  if (!isEmail(email)) return { error: 'Please enter a valid email address.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })
  if (error) return { error: error.message }

  // The handle_new_user trigger inserts the profile row from user_metadata.
  // Update afterwards to make absolutely sure name + role match the form,
  // regardless of which side wrote first.
  const supabase = await createClient()
  await supabase.from('profiles').update({ name, role }).eq('id', data.user.id)

  await audit(caller.id, 'member.create', 'member', data.user.id, `Created member: ${name} (${role})`)
  revalidatePath('/admin/members')
  redirect('/admin/members')
}

export async function updateMember(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const guard = await requireRole(['admin'])
  if ('error' in guard) return guard
  const { user } = guard

  const id     = formData.get('id')   as string
  const name   = str(formData.get('name'))
  const role   = formData.get('role')  as Role
  const active = formData.get('active') === 'true'
  if (!id || !name || !role) return { error: 'Name and role are required.' }
  if (name.length > MAX_LEN.name) return { error: `Name must be ${MAX_LEN.name} characters or fewer.` }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ name, role, active }).eq('id', id)
  if (error) return { error: translatePostgresError(error, { action: 'updateMember', userId: user.id }) }

  const password = str(formData.get('password'))
  if (password) {
    if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
    const admin = createAdminClient()
    const { error: pwErr } = await admin.auth.admin.updateUserById(id, { password })
    if (pwErr) return { error: pwErr.message }
  }

  await audit(user.id, 'member.update', 'member', id, `Updated member: ${name} → role=${role}, active=${active}`)
  revalidatePath('/admin/members')
  redirect('/admin/members')
}

export async function toggleMemberActive(memberId: string, active: boolean): Promise<ActionResult> {
  const guard = await requireRole(['admin'])
  if ('error' in guard) return guard
  const { user } = guard

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ active: !active }).eq('id', memberId)
  if (error) return { error: translatePostgresError(error, { action: 'toggleMemberActive', userId: user.id }) }

  await audit(user.id, active ? 'member.deactivate' : 'member.activate', 'member', memberId, `${active ? 'Deactivated' : 'Activated'} member`)
  revalidatePath('/admin/members')
  return { success: true }
}

export async function deleteMember(memberId: string): Promise<ActionResult> {
  const guard = await requireRole(['admin'])
  if ('error' in guard) return guard
  const { user } = guard

  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', memberId).single()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(memberId)
  if (error) return { error: error.message }

  await audit(user.id, 'member.delete', 'member', memberId, `Deleted member: ${profile?.name ?? memberId}`)
  revalidatePath('/admin/members')
  return { success: true }
}
