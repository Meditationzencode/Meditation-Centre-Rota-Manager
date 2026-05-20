import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SlotForm from '../../slot-form'

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
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-2xl mx-auto px-5 flex items-center justify-between gap-3">
          <h1 className="font-serif text-3xl font-medium">Add Slot</h1>
          <Link href="/admin/schedule" className="text-sm text-stone-600 hover:text-stone-900">← Back</Link>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-5 mt-6">
        <SlotForm slot={null} />
      </div>
    </div>
  )
}
