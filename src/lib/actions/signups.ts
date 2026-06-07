'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { sendSignupConfirmation, sendSignupCancelled } from '@/lib/email'
import { translatePostgresError } from '@/lib/errors'
import type { ActionResult } from '@/lib/types'

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
