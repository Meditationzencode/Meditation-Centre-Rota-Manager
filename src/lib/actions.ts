'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getWeekStart } from '@/lib/utils'
import type { ActionResult, Role } from '@/lib/types'

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email:    formData.get('email')    as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: 'Invalid email or password.' }
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function updateProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Name cannot be empty.' }

  const { error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', user.id)

  if (error) return { error: error.message }

  const newPassword = (formData.get('password') as string).trim()
  if (newPassword) {
    const confirm = (formData.get('confirmPassword') as string).trim()
    if (newPassword !== confirm) return { error: 'Passwords do not match.' }
    const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
    if (pwErr) return { error: pwErr.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

// ── Rota sign-up / cancel ─────────────────────────────────────────────────────

export async function signUpForSlot(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slotId = formData.get('slotId') as string

  // Verify capacity (RLS won't catch this; we want a friendly message)
  const { data: slot } = await supabase
    .from('slots')
    .select('max_volunteers, duty, date')
    .eq('id', slotId)
    .single()

  const { count } = await supabase
    .from('signups')
    .select('*', { count: 'exact', head: true })
    .eq('slot_id', slotId)

  if (!slot) return { error: 'Slot not found.' }
  if ((count ?? 0) >= slot.max_volunteers) return { error: 'This slot is already full.' }

  const { error } = await supabase
    .from('signups')
    .insert({ slot_id: slotId, user_id: user.id })

  if (error) {
    if (error.code === '23505') return { error: 'You are already signed up for this slot.' }
    return { error: error.message }
  }

  revalidatePath('/rota')
  return { success: true }
}

export async function cancelSignup(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slotId = formData.get('slotId') as string

  const { error } = await supabase
    .from('signups')
    .delete()
    .eq('slot_id', slotId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/rota')
  return { success: true }
}

// ── Slots (admin / coordinator) ───────────────────────────────────────────────

function parseSlotForm(formData: FormData) {
  const date      = formData.get('date')          as string
  const startTime = formData.get('startTime')     as string
  const endTime   = formData.get('endTime')       as string
  const duty      = formData.get('duty')          as string
  const location  = formData.get('location')      as string
  const maxVols   = parseInt(formData.get('maxVolunteers') as string, 10) || 1
  const notes     = (formData.get('notes') as string).trim()

  if (!date || !startTime || !endTime || !duty || !location) return null

  return {
    date,
    week_start:     getWeekStart(date),
    start_time:     startTime,
    end_time:       endTime,
    duty,
    location,
    max_volunteers: maxVols,
    notes,
  }
}

export async function createSlot(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const payload  = parseSlotForm(formData)
  if (!payload) return { error: 'All fields except notes are required.' }

  const { error } = await supabase.from('slots').insert(payload)
  if (error) return { error: error.message }

  revalidatePath('/rota')
  revalidatePath('/admin/schedule')
  redirect('/admin/schedule')
}

export async function updateSlot(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const id       = formData.get('id') as string
  const payload  = parseSlotForm(formData)
  if (!payload) return { error: 'All fields except notes are required.' }

  const { error } = await supabase.from('slots').update(payload).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/rota')
  revalidatePath('/admin/schedule')
  redirect('/admin/schedule')
}

export async function deleteSlot(slotId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('slots').delete().eq('id', slotId)
  if (error) return { error: error.message }
  revalidatePath('/rota')
  revalidatePath('/admin/schedule')
  return { success: true }
}

// ── Members (admin only) ──────────────────────────────────────────────────────

export async function createMember(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const name     = (formData.get('name')     as string).trim()
  const email    = (formData.get('email')    as string).trim()
  const role     = formData.get('role')      as Role
  const password = (formData.get('password') as string).trim()

  if (!name || !email || !role || !password) return { error: 'All fields are required.' }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) return { error: error.message }

  // Profile row is created by the trigger, but set the role explicitly
  const supabase = await createClient()
  await supabase.from('profiles').update({ name, role }).eq('id', data.user.id)

  revalidatePath('/admin/members')
  redirect('/admin/members')
}

export async function updateMember(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id     = formData.get('id')   as string
  const name   = (formData.get('name')  as string).trim()
  const role   = formData.get('role')  as Role
  const active = formData.get('active') === 'true'

  if (!name || !role) return { error: 'Name and role are required.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ name, role, active })
    .eq('id', id)

  if (error) return { error: error.message }

  const password = (formData.get('password') as string | null)?.trim()
  if (password) {
    const admin = createAdminClient()
    const { error: pwErr } = await admin.auth.admin.updateUserById(id, { password })
    if (pwErr) return { error: pwErr.message }
  }

  revalidatePath('/admin/members')
  redirect('/admin/members')
}

export async function toggleMemberActive(memberId: string, active: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ active: !active })
    .eq('id', memberId)
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return { success: true }
}

export async function deleteMember(memberId: string): Promise<ActionResult> {
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(memberId)
  if (error) return { error: error.message }
  revalidatePath('/admin/members')
  return { success: true }
}
