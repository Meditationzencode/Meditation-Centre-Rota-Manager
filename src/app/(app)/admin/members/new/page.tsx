import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberForm from '../../member-form'
import PageHeader from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Add Member' }

export default async function NewMemberPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div>
      <PageHeader
        title="Add Member"
        maxWidth="max-w-5xl"
        actions={
          <Link href="/admin/members" className="text-sm text-ink/65 hover:text-ink">← Back</Link>
        }
      />
      <div className="max-w-2xl mx-auto px-5">
        <MemberForm member={null} />
      </div>
    </div>
  )
}
