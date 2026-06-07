'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { translatePostgresError } from '@/lib/errors'
import { str, MAX_LEN } from '@/lib/validation'
import type { ActionResult } from '@/lib/types'

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
