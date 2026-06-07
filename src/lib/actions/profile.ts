'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { translatePostgresError } from '@/lib/errors'
import { str, MAX_LEN } from '@/lib/validation'
import type { ActionResult } from '@/lib/types'

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
