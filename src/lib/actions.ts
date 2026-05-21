'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getWeekStart, addDays } from '@/lib/utils'
import { sendSignupConfirmation, sendSignupCancelled, sendSwapRequestedToAdmins, sendSwapDecision } from '@/lib/email'
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
    .select('max_volunteers, duty, date, start_time, end_time, location')
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
  if (user.email) {
    const time = `${slot.start_time.slice(0, 5)}–${slot.end_time.slice(0, 5)}`
    sendSignupConfirmation(user.email, slot.duty, slot.date, time, slot.location)
  }
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

  if (slot) {
    await audit(user.id, 'signup.cancel', 'signup', slotId, `Cancelled signup for ${slot.duty} on ${slot.date}`)
    if (user.email) sendSignupCancelled(user.email, slot.duty, slot.date)
  }
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

  const { data: slot } = await supabase
    .from('slots').select('duty, date').eq('id', slotId).single()

  const { error } = await supabase
    .from('shift_swaps').insert({ requester_id: user.id, slot_id: slotId, reason })

  if (error) {
    if (error.code === '23505') return { error: 'You already have a pending swap request for this slot.' }
    return { error: error.message }
  }

  await audit(user.id, 'swap.request', 'shift_swap', slotId, `Requested swap for slot ${slotId}`)

  // Email all admins
  const { data: adminProfiles } = await supabase.from('profiles').select('id').eq('role', 'admin')
  if (adminProfiles && adminProfiles.length > 0 && slot) {
    const adminClient = createAdminClient()
    const { data: adminUsers } = await adminClient.auth.admin.listUsers()
    const adminIds = new Set(adminProfiles.map(p => p.id))
    const adminEmails = (adminUsers?.users ?? [])
      .filter((u: { id: string; email?: string }) => adminIds.has(u.id) && u.email)
      .map((u: { email?: string }) => u.email!)
    const requesterName = (await supabase.from('profiles').select('name').eq('id', user.id).single()).data?.name ?? 'A volunteer'
    sendSwapRequestedToAdmins(adminEmails, requesterName, slot.duty, slot.date, reason)
  }

  revalidatePath('/rota')
  return { success: true }
}

export async function reviewSwap(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const swapId   = formData.get('swapId')   as string
  const decision = formData.get('decision') as 'approved' | 'rejected'

  const adminClient = createAdminClient()
  const { data: swap } = await adminClient
    .from('shift_swaps')
    .select('requester_id, slot_id, slot:slots(duty, date)')
    .eq('id', swapId)
    .single()

  if (!swap) return { error: 'Swap request not found.' }

  const { error } = await adminClient
    .from('shift_swaps')
    .update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', swapId)

  if (error) return { error: error.message }

  if (decision === 'approved') {
    await adminClient.from('signups')
      .delete().eq('slot_id', swap.slot_id).eq('user_id', swap.requester_id)
  }

  const slot = swap.slot as { duty: string; date: string } | null
  await audit(user.id, `swap.${decision}`, 'shift_swap', swapId,
    `${decision === 'approved' ? 'Approved' : 'Rejected'} swap for ${slot?.duty} on ${slot?.date}`)

  // Email the requester
  if (slot) {
    const { data: requesterUser } = await adminClient.auth.admin.getUserById(swap.requester_id)
    if (requesterUser.user?.email) {
      sendSwapDecision(requesterUser.user.email, decision === 'approved', slot.duty, slot.date)
    }
  }

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

// ── Password reset ─────────────────────────────────────────────────────────────

export async function requestPasswordReset(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = (formData.get('email') as string).trim().toLowerCase()
  if (!email) return { error: 'Email address is required.' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${process.env.VERCEL_URL ?? 'localhost:3000'}`
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/api/auth/callback?type=recovery&next=/reset-password`,
  })

  // Always return success to prevent email enumeration
  if (error) console.error('Password reset request error:', error.message)
  return { success: true }
}

export async function resetPassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const password = (formData.get('password') as string).trim()
  const confirm  = (formData.get('confirmPassword') as string).trim()

  if (!password) return { error: 'Password is required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm) return { error: 'Passwords do not match.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  redirect('/login?reset=1')
}

// ── Recurring shift templates ──────────────────────────────────────────────────

export async function createTemplate(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const payload = parseTemplateForm(formData)
  if ('error' in payload) return payload

  const { error } = await supabase.from('recurring_templates').insert(payload)
  if (error) return { error: error.message }

  await audit(user.id, 'template.create', 'recurring_template', null, `Created recurring template: ${payload.duty}`)
  revalidatePath('/admin/schedule/recurring')
  redirect('/admin/schedule/recurring')
}

export async function updateTemplate(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const payload = parseTemplateForm(formData)
  if ('error' in payload) return payload

  const { error } = await supabase.from('recurring_templates').update(payload).eq('id', id)
  if (error) return { error: error.message }

  await audit(user.id, 'template.update', 'recurring_template', id, `Updated recurring template: ${payload.duty}`)
  revalidatePath('/admin/schedule/recurring')
  redirect('/admin/schedule/recurring')
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('recurring_templates').delete().eq('id', templateId)
  if (error) redirect(`/admin/schedule/recurring?err=${encodeURIComponent(error.message)}`)

  await audit(user.id, 'template.delete', 'recurring_template', templateId, 'Deleted recurring template')
  revalidatePath('/admin/schedule/recurring')
  redirect('/admin/schedule/recurring')
}

export async function generateSlots(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const from = formData.get('from') as string
  const to   = formData.get('to')   as string
  if (!from || !to) redirect('/admin/schedule/recurring?err=missing_range')
  if (from > to) redirect('/admin/schedule/recurring?err=invalid_range')

  const { data: templates } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('active', true)

  if (!templates || templates.length === 0) redirect('/admin/schedule/recurring?err=no_templates')

  const slots: object[] = []
  let cursor = from
  while (cursor <= to) {
    const dow = new Date(`${cursor}T00:00:00Z`).getUTCDay() // 0=Sun
    const rota = dow === 0 ? 6 : dow - 1 // convert to 0=Mon...6=Sun
    for (const t of templates) {
      if ((t.days_of_week as number[]).includes(rota)) {
        slots.push({
          date: cursor,
          week_start: getWeekStart(cursor),
          duty: t.duty,
          location: t.location,
          start_time: t.start_time,
          end_time: t.end_time,
          max_volunteers: t.max_volunteers,
          notes: t.notes ?? '',
        })
      }
    }
    cursor = addDays(cursor, 1)
  }

  if (slots.length === 0) redirect('/admin/schedule/recurring?err=no_matches')

  // Upsert — ignore conflicts on (date, duty, start_time)
  const { error } = await supabase
    .from('slots')
    .upsert(slots, { onConflict: 'date,duty,start_time', ignoreDuplicates: true })

  if (error) redirect(`/admin/schedule/recurring?err=${encodeURIComponent(error.message)}`)

  const created = slots.length
  await audit(user.id, 'slots.generate', 'slot', null, `Generated ${created} slots from ${from} to ${to}`)
  revalidatePath('/rota')
  revalidatePath('/admin/schedule')
  revalidatePath('/admin/schedule/recurring')
  redirect(`/admin/schedule/recurring?generated=${created}`)
}

type TemplatePayload = {
  duty: string; location: string; days_of_week: number[]
  start_time: string; end_time: string; max_volunteers: number; notes: string; active: boolean
}

function parseTemplateForm(formData: FormData): { error: string } | TemplatePayload {
  const duty         = formData.get('duty')          as string
  const location     = formData.get('location')      as string
  const startTime    = formData.get('startTime')     as string
  const endTime      = formData.get('endTime')       as string
  const maxVols      = parseInt(formData.get('maxVolunteers') as string, 10) || 1
  const notes        = ((formData.get('notes') as string) ?? '').trim()
  const active       = formData.get('active') !== 'false'
  const daysOfWeek   = formData.getAll('daysOfWeek').map(d => parseInt(d as string, 10))

  if (!duty || !location || !startTime || !endTime)
    return { error: 'Duty, location, and times are required.' }
  if (daysOfWeek.length === 0)
    return { error: 'Select at least one day of the week.' }
  if (startTime >= endTime)
    return { error: 'Start time must be before end time.' }

  return { duty, location, days_of_week: daysOfWeek, start_time: startTime, end_time: endTime, max_volunteers: maxVols, notes, active }
}
