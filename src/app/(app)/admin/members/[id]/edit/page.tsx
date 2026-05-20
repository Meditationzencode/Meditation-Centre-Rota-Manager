import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberForm from '../../../member-form'

export const metadata: Metadata = { title: 'Edit Member' }

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: member } = await supabase
    .from('profiles').select('*').eq('id', id).single()

  if (!member) notFound()

  return (
    <div>
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-2xl mx-auto px-5 flex items-center justify-between gap-3">
          <h1 className="font-serif text-3xl font-medium">Edit Member</h1>
          <Link href="/admin/members" className="text-sm text-stone-600 hover:text-stone-900">← Back</Link>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-5 mt-6">
        <MemberForm member={member} />
      </div>
    </div>
  )
}
