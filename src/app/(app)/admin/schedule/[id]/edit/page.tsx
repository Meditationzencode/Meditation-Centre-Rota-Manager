import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import SlotForm from '../../../slot-form'
import SlotVolunteers from './slot-volunteers'

export const metadata: Metadata = { title: 'Edit Slot' }

export default async function EditSlotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!profile || !['admin', 'coordinator'].includes(profile.role)) redirect('/dashboard')

  const { data: slot } = await supabase.from('slots').select('*').eq('id', id).single()
  if (!slot) notFound()

  const admin = createAdminClient()
  const [{ data: signupRows }, { data: allProfiles }] = await Promise.all([
    admin.from('signups').select('user_id').eq('slot_id', id),
    admin.from('profiles').select('id, name').in('role', ['admin', 'coordinator', 'volunteer']).eq('active', true).order('name'),
  ])

  type PRow = { id: string; name: string }
  const signedIds = new Set((signupRows ?? []).map((s: { user_id: string }) => s.user_id))
  const profiles  = (allProfiles ?? []) as PRow[]
  const signed    = profiles.filter((p: PRow) => signedIds.has(p.id))
  const available = profiles.filter((p: PRow) => !signedIds.has(p.id))

  return (
    <div>
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-2xl mx-auto px-5 flex items-center justify-between gap-3">
          <h1 className="font-serif text-3xl font-medium">Edit Slot</h1>
          <Link href="/admin/schedule" className="text-sm text-stone-600 hover:text-stone-900">← Back</Link>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-4">
        <SlotForm slot={slot} />
        <SlotVolunteers
          slotId={slot.id}
          signed={signed}
          available={available}
          maxVolunteers={slot.max_volunteers}
        />
      </div>
    </div>
  )
}
