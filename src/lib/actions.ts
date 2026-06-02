'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendSignupConfirmation, sendSignupCancelled, sendSwapRequestedToAdmins, sendSwapDecision } from '@/lib/email'
import { requireUser, requireRole } from '@/lib/auth'
import { translatePostgresError } from '@/lib/errors'
import { log } from '@/lib/log'
import { SITE_URL } from '@/lib/env'
import { parseSlotForm, parseTemplateForm, str, isEmail, MAX_LEN } from '@/lib/validation'
import { expandTemplatesToSlots, type SlotTemplate } from '@/lib/scheduling'
import type { ActionResult, Role } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  } catch (err) {
    // Audit failures must never break the user-facing action — but we do
    // want to know about them, since a silent gap defeats the audit story.
    log.error({ action: 'audit', userId, message: 'failed to insert audit entry', err })
  }
}

/**
 * Resolve email addresses for a set of profile IDs via the admin auth API.
 * Looks each ID up directly (admins are few) instead of scanning the entire
 * auth.users table.
 */
async function emailsForUserIds(ids: string[]): Promise<string[]> {
  const admin = createAdminClient()
  const emails: string[] = []
  for (const id of ids) {
    const { data, error } = await admin.auth.admin.getUserById(id)
    if (error) {
      log.warn({ action: 'emailsForUserIds', userId: id, message: 'getUserById failed', err: error })
      continue
    }
    if (data.user?.email) emails.push(data.user.email)
  }
  return emails
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

export async function sendMagicLink(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  if (!email) return { error: 'Email address is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That doesn't look like an email." }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${SITE_URL}/api/auth/callback?next=/dashboard`,
    },
  })

  // Don't reveal whether the email exists — log internally, always succeed externally.
  if (error) log.warn({ action: 'sendMagicLink', message: 'OTP request failed', err: error })
  return { success: true }
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function updateProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const supabase = await createClient()

  const name = str(formData.get('name'))
  if (!name) return { error: 'Name cannot be empty.' }
  if (name.length > MAX_LEN.name) return { error: `Name must be ${MAX_LEN.name} characters or fewer.` }

  const phone_number = str(formData.get('phone'))
  if (phone_number.length > MAX_LEN.phone) return { error: `Phone number must be ${MAX_LEN.phone} characters or fewer.` }

  const { error } = await supabase.from('profiles').update({ name, phone_number }).eq('id', user.id)
  if (error) return { error: translatePostgresError(error, { action: 'updateProfile', userId: user.id }) }

  const newPassword = str(formData.get('password'))
  if (newPassword) {
    const confirm = str(formData.get('confirmPassword'))
    if (newPassword.length < 8) return { error: 'New password must be at least 8 characters.' }
    if (newPassword !== confirm) return { error: 'Passwords do not match.' }

    // Re-authenticate with the current password before changing it, so a
    // hijacked or borrowed session cannot silently reset the account password.
    const currentPassword = str(formData.get('currentPassword'))
    if (!currentPassword) return { error: 'Enter your current password to change it.' }
    if (!user.email) return { error: 'Cannot verify identity for this account.' }
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (reauthErr) return { error: 'Current password is incorrect.' }

    const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
    if (pwErr) return { error: pwErr.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

// ── Unavailability ────────────────────────────────────────────────────────────

export async function addUnavailability(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const supabase = await createClient()

  const date = str(formData.get('date'))
  const note = str(formData.get('note'))
  if (!date) return { error: 'Please select a date.' }
  if (note.length > MAX_LEN.unavailNote) return { error: `Note must be ${MAX_LEN.unavailNote} characters or fewer.` }

  const { error } = await supabase.from('unavailability').insert({ user_id: user.id, date, note })
  if (error) {
    if (error.code === '23505') return { error: 'You have already marked that date as unavailable.' }
    return { error: translatePostgresError(error, { action: 'addUnavailability', userId: user.id }) }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function removeUnavailability(id: string): Promise<ActionResult> {
  const user = await requireUser()
  const supabase = await createClient()

  const { error } = await supabase.from('unavailability').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: translatePostgresError(error, { action: 'removeUnavailability', userId: user.id }) }

  revalidatePath('/profile')
  return { success: true }
}

// ── Rota sign-up / cancel ─────────────────────────────────────────────────────

export async function signUpForSlot(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const supabase = await createClient()

  const slotId = formData.get('slotId') as string
  if (!slotId) return { error: 'Missing slot.' }

  const { data: slot } = await supabase
    .from('slots')
    .select('max_volunteers, duty, date, start_time, end_time, location')
    .eq('id', slotId)
    .single()
  if (!slot) return { error: 'Slot not found.' }

  // Friendly pre-check — the database trigger is the actual source of truth.
  const { count } = await supabase
    .from('signups')
    .select('*', { count: 'exact', head: true })
    .eq('slot_id', slotId)
  if ((count ?? 0) >= slot.max_volunteers) return { error: 'This slot is already full.' }

  const { error } = await supabase.from('signups').insert({ slot_id: slotId, user_id: user.id })
  if (error) {
    if (error.code === '23505') return { error: 'You are already signed up for this slot.' }
    return { error: translatePostgresError(error, { action: 'signUpForSlot', userId: user.id }) }
  }

  await audit(user.id, 'signup.add', 'signup', slotId, `Signed up for ${slot.duty} on ${slot.date}`)
  if (user.email) {
    const time = `${slot.start_time.slice(0, 5)}–${slot.end_time.slice(0, 5)}`
    await sendSignupConfirmation(user.email, slot.duty, slot.date, time, slot.location)
  }
  revalidatePath('/rota')
  return { success: true }
}

export async function cancelSignup(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const supabase = await createClient()

  const slotId = formData.get('slotId') as string
  if (!slotId) return { error: 'Missing slot.' }

  const { data: slot } = await supabase.from('slots').select('duty, date').eq('id', slotId).single()

  const { error } = await supabase.from('signups').delete().eq('slot_id', slotId).eq('user_id', user.id)
  if (error) return { error: translatePostgresError(error, { action: 'cancelSignup', userId: user.id }) }

  if (slot) {
    await audit(user.id, 'signup.cancel', 'signup', slotId, `Cancelled signup for ${slot.duty} on ${slot.date}`)
    if (user.email) await sendSignupCancelled(user.email, slot.duty, slot.date)
  }
  revalidatePath('/rota')
  return { success: true }
}

// ── Shift swaps ───────────────────────────────────────────────────────────────

export async function requestSwap(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const supabase = await createClient()

  const slotId = formData.get('slotId') as string
  const reason = str(formData.get('reason'))
  if (!slotId) return { error: 'Missing slot.' }
  if (reason.length > MAX_LEN.reason) return { error: `Reason must be ${MAX_LEN.reason} characters or fewer.` }

  const { data: signup } = await supabase
    .from('signups').select('id').eq('slot_id', slotId).eq('user_id', user.id).single()
  if (!signup) return { error: 'You are not signed up for this slot.' }

  const { data: slot } = await supabase.from('slots').select('duty, date').eq('id', slotId).single()

  const { error } = await supabase.from('shift_swaps').insert({ requester_id: user.id, slot_id: slotId, reason })
  if (error) {
    if (error.code === '23505') return { error: 'You already have a pending swap request for this slot.' }
    return { error: translatePostgresError(error, { action: 'requestSwap', userId: user.id }) }
  }

  await audit(user.id, 'swap.request', 'shift_swap', slotId, `Requested swap for slot ${slotId}`)

  // Notify admins. Resolve each admin's email directly by id rather than
  // scanning the whole auth.users table.
  if (slot) {
    const { data: adminProfiles } = await supabase.from('profiles').select('id').eq('role', 'admin')
    if (adminProfiles && adminProfiles.length > 0) {
      const adminEmails = await emailsForUserIds(adminProfiles.map(p => p.id))
      const requesterName =
        (await supabase.from('profiles').select('name').eq('id', user.id).single()).data?.name ?? 'A volunteer'
      await sendSwapRequestedToAdmins(adminEmails, requesterName, slot.duty, slot.date, reason)
    }
  }

  revalidatePath('/rota')
  return { success: true }
}

export async function reviewSwap(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const guard = await requireRole(['admin'])
  if ('error' in guard) return guard
  const { user } = guard

  const swapId     = formData.get('swapId')     as string
  const decision   = formData.get('decision')   as 'approved' | 'rejected'
  const adminNotes = str(formData.get('adminNotes'))
  if (!swapId || (decision !== 'approved' && decision !== 'rejected')) {
    return { error: 'Invalid swap decision.' }
  }
  if (adminNotes.length > MAX_LEN.adminNotes) return { error: `Notes must be ${MAX_LEN.adminNotes} characters or fewer.` }

  const adminClient = createAdminClient()
  const { data: swap } = await adminClient
    .from('shift_swaps')
    .select('requester_id, slot_id, status, slot:slots(duty, date)')
    .eq('id', swapId)
    .single()
  if (!swap) return { error: 'Swap request not found.' }
  if (swap.status !== 'pending') return { error: 'This swap request has already been reviewed.' }

  // Guard the update on the still-pending status so two admins reviewing at
  // once cannot both apply a decision.
  const { data: updated, error } = await adminClient
    .from('shift_swaps')
    .update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString(), admin_notes: adminNotes })
    .eq('id', swapId)
    .eq('status', 'pending')
    .select('id')
  if (error) return { error: translatePostgresError(error, { action: 'reviewSwap', userId: user.id }) }
  if (!updated || updated.length === 0) return { error: 'This swap request has already been reviewed.' }

  if (decision === 'approved') {
    await adminClient.from('signups').delete().eq('slot_id', swap.slot_id).eq('user_id', swap.requester_id)
  }

  const slot = swap.slot as unknown as { duty: string; date: string } | null
  await audit(user.id, `swap.${decision}`, 'shift_swap', swapId,
    `${decision === 'approved' ? 'Approved' : 'Rejected'} swap for ${slot?.duty} on ${slot?.date}`)

  if (slot) {
    const { data: requesterUser } = await adminClient.auth.admin.getUserById(swap.requester_id)
    if (requesterUser.user?.email) {
      await sendSwapDecision(requesterUser.user.email, decision === 'approved', slot.duty, slot.date)
    }
  }

  revalidatePath('/admin/swaps')
  revalidatePath('/rota')
  return { success: true }
}

// ── Slots (admin / coordinator) ───────────────────────────────────────────────

export async function createSlot(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const guard = await requireRole(['admin', 'coordinator'])
  if ('error' in guard) return guard
  const { user } = guard

  const payload = parseSlotForm(formData)
  if ('error' in payload) return payload

  const supabase = await createClient()
  const { data, error } = await supabase.from('slots').insert({ ...payload, created_by: user.id }).select('id').single()
  if (error) return { error: translatePostgresError(error, { action: 'createSlot', userId: user.id }) }

  await audit(user.id, 'slot.create', 'slot', data?.id ?? null, `Created slot: ${payload.duty} on ${payload.date} at ${payload.location}`)
  revalidatePath('/rota')
  revalidatePath('/admin/schedule')
  redirect('/admin/schedule')
}

export async function updateSlot(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const guard = await requireRole(['admin', 'coordinator'])
  if ('error' in guard) return guard
  const { user } = guard

  const id      = formData.get('id') as string
  if (!id) return { error: 'Missing slot id.' }
  const payload = parseSlotForm(formData)
  if ('error' in payload) return payload

  const supabase = await createClient()
  const { error } = await supabase.from('slots').update(payload).eq('id', id)
  if (error) return { error: translatePostgresError(error, { action: 'updateSlot', userId: user.id }) }

  await audit(user.id, 'slot.update', 'slot', id, `Updated slot: ${payload.duty} on ${payload.date}`)
  revalidatePath('/rota')
  revalidatePath('/admin/schedule')
  redirect('/admin/schedule')
}

export async function deleteSlot(slotId: string): Promise<ActionResult> {
  const guard = await requireRole(['admin', 'coordinator'])
  if ('error' in guard) return guard
  const { user } = guard

  const supabase = await createClient()
  const { data: slot } = await supabase.from('slots').select('duty, date').eq('id', slotId).single()
  const { error } = await supabase.from('slots').delete().eq('id', slotId)
  if (error) return { error: translatePostgresError(error, { action: 'deleteSlot', userId: user.id }) }

  if (slot) await audit(user.id, 'slot.delete', 'slot', slotId, `Deleted slot: ${slot.duty} on ${slot.date}`)
  revalidatePath('/rota')
  revalidatePath('/admin/schedule')
  return { success: true }
}

// ── Admin volunteer assignment ────────────────────────────────────────────────

export async function adminAssignVolunteer(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const guard = await requireRole(['admin', 'coordinator'])
  if ('error' in guard) return guard
  const { user } = guard

  const slotId  = formData.get('slotId')  as string
  const userId  = formData.get('userId')  as string
  if (!slotId || !userId) return { error: 'Missing slot or volunteer.' }

  const supabase = await createClient()
  const { data: slot } = await supabase.from('slots').select('max_volunteers, duty, date').eq('id', slotId).single()
  if (!slot) return { error: 'Slot not found.' }

  // Friendly pre-check — the capacity trigger is the source of truth.
  const { count } = await supabase.from('signups').select('*', { count: 'exact', head: true }).eq('slot_id', slotId)
  if ((count ?? 0) >= slot.max_volunteers) return { error: 'This slot is already full.' }

  const admin = createAdminClient()
  const { error } = await admin.from('signups').insert({ slot_id: slotId, user_id: userId })
  if (error) {
    if (error.code === '23505') return { error: 'That volunteer is already signed up.' }
    return { error: translatePostgresError(error, { action: 'adminAssignVolunteer', userId: user.id }) }
  }

  await audit(user.id, 'admin.assign', 'signup', slotId, `Admin assigned volunteer to ${slot.duty} on ${slot.date}`)
  revalidatePath(`/admin/schedule/${slotId}/edit`)
  revalidatePath('/rota')
  return { success: true }
}

export async function adminRemoveVolunteer(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const guard = await requireRole(['admin', 'coordinator'])
  if ('error' in guard) return guard
  const { user } = guard

  const slotId = formData.get('slotId') as string
  const userId = formData.get('userId') as string
  if (!slotId || !userId) return { error: 'Missing slot or volunteer.' }

  const supabase = await createClient()
  const { data: slot } = await supabase.from('slots').select('duty, date').eq('id', slotId).single()

  const admin = createAdminClient()
  const { error } = await admin.from('signups').delete().eq('slot_id', slotId).eq('user_id', userId)
  if (error) return { error: translatePostgresError(error, { action: 'adminRemoveVolunteer', userId: user.id }) }

  if (slot) await audit(user.id, 'admin.remove', 'signup', slotId, `Admin removed volunteer from ${slot.duty} on ${slot.date}`)
  revalidatePath(`/admin/schedule/${slotId}/edit`)
  revalidatePath('/rota')
  return { success: true }
}

// ── Members (admin only) ──────────────────────────────────────────────────────

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

// ── Password reset ─────────────────────────────────────────────────────────────

export async function requestPasswordReset(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  if (!email) return { error: 'Email address is required.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/api/auth/callback?type=recovery&next=/reset-password`,
  })

  // Always return success to prevent email enumeration. Errors are logged
  // server-side so failures are still observable.
  if (error) log.warn({ action: 'requestPasswordReset', message: 'reset email failed', err: error })
  return { success: true }
}

export async function resetPassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const password = ((formData.get('password')        as string) ?? '').trim()
  const confirm  = ((formData.get('confirmPassword') as string) ?? '').trim()

  if (!password) return { error: 'Password is required.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }
  if (password !== confirm) return { error: 'Passwords do not match.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  redirect('/login?reset=1')
}

// ── Recurring shift templates ──────────────────────────────────────────────────

const MAX_GENERATE_RANGE_DAYS = 365

export async function createTemplate(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const guard = await requireRole(['admin', 'coordinator'])
  if ('error' in guard) return guard
  const { user } = guard

  const payload = parseTemplateForm(formData)
  if ('error' in payload) return payload

  const supabase = await createClient()
  const { error } = await supabase.from('recurring_templates').insert(payload)
  if (error) return { error: translatePostgresError(error, { action: 'createTemplate', userId: user.id }) }

  await audit(user.id, 'template.create', 'recurring_template', null, `Created recurring template: ${payload.duty}`)
  revalidatePath('/admin/schedule/recurring')
  redirect('/admin/schedule/recurring')
}

export async function updateTemplate(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const guard = await requireRole(['admin', 'coordinator'])
  if ('error' in guard) return guard
  const { user } = guard

  const id = formData.get('id') as string
  if (!id) return { error: 'Missing template id.' }
  const payload = parseTemplateForm(formData)
  if ('error' in payload) return payload

  const supabase = await createClient()
  const { error } = await supabase.from('recurring_templates').update(payload).eq('id', id)
  if (error) return { error: translatePostgresError(error, { action: 'updateTemplate', userId: user.id }) }

  await audit(user.id, 'template.update', 'recurring_template', id, `Updated recurring template: ${payload.duty}`)
  revalidatePath('/admin/schedule/recurring')
  redirect('/admin/schedule/recurring')
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const guard = await requireRole(['admin', 'coordinator'])
  if ('error' in guard) redirect(`/admin/schedule/recurring?err=${encodeURIComponent(guard.error)}`)
  const { user } = guard as { user: { id: string } }

  const supabase = await createClient()
  const { error } = await supabase.from('recurring_templates').delete().eq('id', templateId)
  if (error) redirect(`/admin/schedule/recurring?err=${encodeURIComponent(translatePostgresError(error, { action: 'deleteTemplate', userId: user.id }))}`)

  await audit(user.id, 'template.delete', 'recurring_template', templateId, 'Deleted recurring template')
  revalidatePath('/admin/schedule/recurring')
  redirect('/admin/schedule/recurring')
}

export async function generateSlots(formData: FormData): Promise<void> {
  const guard = await requireRole(['admin', 'coordinator'])
  if ('error' in guard) redirect(`/admin/schedule/recurring?err=${encodeURIComponent(guard.error)}`)
  const { user } = guard as { user: { id: string } }

  const from = formData.get('from') as string
  const to   = formData.get('to')   as string
  if (!from || !to) redirect('/admin/schedule/recurring?err=missing_range')
  if (from > to)   redirect('/admin/schedule/recurring?err=invalid_range')

  // Defensive cap: prevent a typo from generating decades of slots.
  const rangeDays = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000)
  if (rangeDays > MAX_GENERATE_RANGE_DAYS) {
    redirect('/admin/schedule/recurring?err=range_too_large')
  }

  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('active', true)
  if (!templates || templates.length === 0) redirect('/admin/schedule/recurring?err=no_templates')

  const slots = expandTemplatesToSlots(templates as SlotTemplate[], from, to)

  if (slots.length === 0) redirect('/admin/schedule/recurring?err=no_matches')

  const { error } = await supabase
    .from('slots')
    .upsert(slots, { onConflict: 'date,duty,start_time', ignoreDuplicates: true })
  if (error) {
    redirect(`/admin/schedule/recurring?err=${encodeURIComponent(translatePostgresError(error, { action: 'generateSlots', userId: user.id }))}`)
  }

  const created = slots.length
  await audit(user.id, 'slots.generate', 'slot', null, `Generated ${created} slots from ${from} to ${to}`)
  revalidatePath('/rota')
  revalidatePath('/admin/schedule')
  revalidatePath('/admin/schedule/recurring')
  redirect(`/admin/schedule/recurring?generated=${created}`)
}
