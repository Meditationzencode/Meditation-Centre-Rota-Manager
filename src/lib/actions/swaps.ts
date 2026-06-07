'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireUser, requireRole } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { sendSwapRequestedToAdmins, sendSwapDecision } from '@/lib/email'
import { translatePostgresError } from '@/lib/errors'
import { log } from '@/lib/log'
import { str, MAX_LEN } from '@/lib/validation'
import type { ActionResult } from '@/lib/types'

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
