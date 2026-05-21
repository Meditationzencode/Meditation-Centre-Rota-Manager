'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getWeekStart } from '@/lib/utils'
import type { ActionResult, Role } from '@/lib/types'

// ── Audit helper ──────────────────────────────────────────────────────────────

async function audit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  detail: string,
) {
  try {
    const admin = createAdminClient()
    await admin.from('audit_log').insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId, detail })
  } catch {
    // Non-fatal — never let audit logging break a user action
  }
}

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

// ── Unavailability ────────────────────────────────────────────────────────────

export async function addUnavailability(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const date = (formData.get('date') as string).trim()
  const note = (formData.get('note') as string ?? '').trim()

  if (!date) return { error: 'Please select a date.' }

  const { error } = await supabase
    .from('unavailability')
    .insert({ user_id: user.id, date, note })

  if (error) {
    if (error.code === '23505') return { error: 'You have already marked that date as unavailable.' }
    return { error: error.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function removeUnavailability(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('unavailability')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}

// ── Rota sign-up / cancel ─────────────────────────────────────────────────────

export async function signUpForSlot(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slotId = formData.get('slotId') as string

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

  await audit(user.id, 'signup.add', 'signup', slotId, `Signed up for ${slot.duty} on ${slot.date}`)
  revalidatePath('/rota')
  return { success: true }
}

export async function cancelSignup(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slotId = formData.get('slotId') as string

  const { data: slot } = await supabase
    .from('slots')
    .select('duty, date')
    .eq('id', slotId)
    .single()

  const { error } = await supabase
    .from('signups')
    .delete()
    .eq('slot_id', slotId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  if (slot) await audit(user.id, 'signup.cancel', 'signup', slotId, `Cancelled signup for ${slot.duty} on ${slot.date}`)
  revalidatePath('/rota')
  return { success: true }
}

// ── Shift swaps ───────────────────────────────────────────────────────────────

export async function requestSwap(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slotId = formData.get('slotId') as string
  const reason = (formData.get('reason') as string ?? '').trim()

  const { data: signup } = await supabase
    .from('signups').select('id').eq('slot_id', slotId).eq('user_id', user.id).single()
  if (!signup) return { error: 'You are not signed up for this slot.' }

  const { error } = await supabase
    .from('shift_swaps').insert({ requester_id: user.id, slot_id: slotId, reason })

  if (error) {
    if (error.code === '23505') return { error: 'You already have a pending swap request for this slot.' }
    return { error: error.message }
  }

  await audit(user.id, 'swap.request', 'shift_swap', slotId, `Requested swap for slot ${slotId}`)
  revalidatePath('/rota')
  return { success: true }
}

export async function reviewSwap(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const swapId   = formData.get('swapId')   as string
  const decision = formData.get('decision') as 'approved' | 'rejected'

  const admin = createAdminClient()
  const { data: swap } = await admin
    .from('shift_swaps')
    .select('requester_id, slot_id, slot:slots(duty, date)')
    .eq('id', swapId)
    .single()

  if (!swap) return { error: 'Swap request not found.' }

  const { error } = await admin
    .from('shift_swaps')
    .update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', swapId)

  if (error) return { error: error.message }

  if (decision === 'approved') {
    await admin.from('signups')
      .delete().eq('slot_id', swap.slot_id).eq('user_id', swap.requester_id)
  }

  const slot = swap.slot as { duty: string; date: string } | null
  await audit(user.id, `swap.${decision}`, 'shift_swap', swapId,
    `${decision === 'approved' ? 'Approved' : 'Rejected'} swap for ${slot?.duty} on ${slot?.date}`)

  revalidatePath('/admin/swaps')
  revalidatePath('/rota')
  return { success: true }
}

// ── Slots (admin / coordinator) ───────────────────────────────────────────────

type SlotPayload = {
  date: string; week_start: string; start_time: string; end_time: string
  duty: string; location: string; max_volunteers: number; notes: string
}

function parseSlotForm(formData: FormData): { error: string } | SlotPayload {
  const date      = formData.get('date')          as string
  const startTime = formData.get('startTime')     as string
  const endTime   = formData.get('endTime')       as string
  const duty      = formData.get('duty')          as string
  const location  = formData.get('location')      as string
  const maxVols   = parseInt(formData.get('maxVolunteers') as string, 10) || 1
  const notes     = (formData.get('notes') as string).trim()

  if (!date || !startTime || !endTime || !duty || !location)
    return { error: 'All fields except notes are required.' }

  if (startTime >= endTime)
    return { error: 'Start time must be before end time.' }

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const payload = parseSlotForm(formData)
  if ('error' in payload) return payload

  const { data, error } = await supabase.from('slots').insert(payload).select('id').single()
  if (error) return { error: error.message }

  await audit(user.id, 'slot.create', 'slot', data?.id ?? null, `Created slot: ${payload.duty} on ${payload.date} at ${payload.location}`)
  revalidatePath('/rota')
  revalidatePath('/admin/schedule')
  redirect('/admin/schedule')
}

export async function updateSlot(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id      = formData.get('id') as string
  const payload = parseSlotForm(formData)
  if ('error' in payload) return payload

  const { error } = await supabase.from('slots').update(payload).eq('id', id)
  if (error) return { error: error.message }

  await audit(user.id, 'slot.update', 'slot', id, `Updated slot: ${payload.duty} on ${payload.date}`)
  revalidatePath('/rota')
  revalidatePath('/admin/schedule')
  redirect('/admin/schedule')
}

export async function deleteSlot(slotId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: slot } = await supabase.from('slots').select('duty, date').eq('id', slotId).single()
  const { error } = await supabase.from('slots').delete().eq('id', slotId)
  if (error) return { error: error.message }

  if (slot) await audit(user.id, 'slot.delete', 'slot', slotId, `Deleted slot: ${slot.duty} on ${slot.date}`)
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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('profiles').update({ name, role }).eq('id', data.user.id)

  if (user) await audit(user.id, 'member.create', 'member', data.user.id, `Created member: ${name} (${role})`)
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
  const { data: { user } } = await supabase.auth.getUser()

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

  if (user) await audit(user.id, 'member.update', 'member', id, `Updated member: ${name} → role=${role}, active=${active}`)
  revalidatePath('/admin/members')
  redirect('/admin/members')
}

export async function toggleMemberActive(memberId: string, active: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('profiles')
    .update({ active: !active })
    .eq('id', memberId)

  if (error) return { error: error.message }

  if (user) await audit(user.id, active ? 'member.deactivate' : 'member.activate', 'member', memberId, `${active ? 'Deactivated' : 'Activated'} member`)
  revalidatePath('/admin/members')
  return { success: true }
}

export async function deleteMember(memberId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('name').eq('id', memberId).single()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(memberId)
  if (error) return { error: error.message }

  if (user) await audit(user.id, 'member.delete', 'member', memberId, `Deleted member: ${profile?.name ?? memberId}`)
  revalidatePath('/admin/members')
  return { success: true }
}
