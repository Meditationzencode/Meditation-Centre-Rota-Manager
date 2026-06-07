'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { translatePostgresError } from '@/lib/errors'
import { parseSlotForm } from '@/lib/validation'
import type { ActionResult } from '@/lib/types'

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
