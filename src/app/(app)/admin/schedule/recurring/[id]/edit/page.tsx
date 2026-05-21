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
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-2xl mx-auto px-5">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
            <Link href="/admin/schedule" className="hover:text-stone-700">Schedule</Link>
            <span>/</span>
            <Link href="/admin/schedule/recurring" className="hover:text-stone-700">Recurring</Link>
            <span>/</span>
            <span>Edit</span>
          </div>
          <h1 className="font-serif text-3xl font-medium">Edit Template</h1>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-5 mt-6">
        <RecurringTemplateForm template={template as RecurringTemplate} />
      </div>
    </div>
  )
}
