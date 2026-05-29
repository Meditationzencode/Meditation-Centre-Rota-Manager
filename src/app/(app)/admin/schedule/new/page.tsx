import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SlotForm from '../../slot-form'
import PageHeader from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Add Slot' }

export default async function NewSlotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!profile || !['admin', 'coordinator'].includes(profile.role)) redirect('/dashboard')

  return (
    <div>
      <PageHeader
        title="Add Slot"
        maxWidth="max-w-5xl"
        actions={
          <Link href="/admin/schedule" className="text-sm text-ink/65 hover:text-ink">← Back</Link>
        }
      />
      <div className="max-w-2xl mx-auto px-5">
        <SlotForm slot={null} />
      </div>
    </div>
  )
}
