import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RecurringTemplateForm from '@/app/(app)/admin/recurring-template-form'
import type { RecurringTemplate } from '@/lib/types'

export const metadata: Metadata = { title: 'Edit Recurring Template' }

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinator'].includes(profile.role)) redirect('/dashboard')

  const { data: template } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (!template) notFound()

  return (
    <div>
      <div className="max-w-5xl mx-auto px-5 pt-8 pb-5">
        <div className="flex items-center gap-2 text-sm text-ink/55 mb-1">
          <Link href="/admin/schedule" className="hover:text-ink">Schedule</Link>
          <span>/</span>
          <Link href="/admin/schedule/recurring" className="hover:text-ink">Recurring</Link>
          <span>/</span>
          <span>Edit</span>
        </div>
        <h1 className="font-serif text-3xl font-medium text-ink">Edit Template</h1>
        <div className="mt-4 h-px bg-gradient-to-r from-gold-400/60 via-sand to-transparent" />
      </div>
      <div className="max-w-2xl mx-auto px-5">
        <RecurringTemplateForm template={template as RecurringTemplate} />
      </div>
    </div>
  )
}
