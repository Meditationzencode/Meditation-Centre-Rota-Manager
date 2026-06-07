'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'
import { SITE_URL } from '@/lib/env-public'
import type { ActionResult } from '@/lib/types'

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
