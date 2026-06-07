'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { translatePostgresError } from '@/lib/errors'
import { parseTemplateForm } from '@/lib/validation'
import { expandTemplatesToSlots, type SlotTemplate } from '@/lib/scheduling'
import type { ActionResult } from '@/lib/types'

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
