import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import SwapActions from './swap-actions'

export const metadata: Metadata = { title: 'Swap Requests' }

const STATUS_STYLES = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-sage-100 text-sage-700',
  rejected: 'bg-red-100 text-red-600',
}

type SwapEntry = {
  id: string
  reason: string
  admin_notes: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  requester: { name: string } | null
  slot: { date: string; duty: string; start_time: string; end_time: string; location: string } | null
}

export default async function SwapsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: rawSwaps } = await admin
    .from('shift_swaps')
    .select(`
      id, reason, admin_notes, status, created_at,
      requester:profiles!requester_id(name),
      slot:slots(date, duty, start_time, end_time, location)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const swaps   = (rawSwaps ?? []) as SwapEntry[]
  const pending  = swaps.filter(s => s.status === 'pending')
  const resolved = swaps.filter(s => s.status !== 'pending')

  return (
    <div>
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-4xl mx-auto px-5">
          <h1 className="font-serif text-3xl font-medium">Swap Requests</h1>
          <p className="text-stone-500 text-sm mt-1">
            Review and action volunteer shift swap requests
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 mt-6 space-y-8">

        {/* Pending */}
        <section>
          <h2 className="font-serif text-xl mb-3">
            Pending
            {pending.length > 0 && (
              <span className="ml-2 text-sm font-sans font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </h2>
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            {pending.length === 0 ? (
              <p className="px-5 py-8 text-center text-stone-400 text-sm">No pending swap requests.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {pending.map(swap => (
                  <SwapRow key={swap.id} swap={swap} showActions />
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Resolved */}
        {resolved.length > 0 && (
          <section>
            <h2 className="font-serif text-xl mb-3">Recent Decisions</h2>
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-stone-100">
                {resolved.map(swap => (
                  <SwapRow key={swap.id} swap={swap} showActions={false} />
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function SwapRow({ swap, showActions }: { swap: SwapEntry; showActions: boolean }) {
  return (
    <li className="flex items-start gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{swap.requester?.name ?? 'Unknown'}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[swap.status]}`}>
            {swap.status}
          </span>
        </div>
        {swap.slot && (
          <p className="text-xs text-stone-500 mt-0.5">
            {new Date(`${swap.slot.date}T00:00:00Z`).toLocaleDateString('en-GB', {
              weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
            })}
            {' · '}{swap.slot.duty}
            {' · '}{swap.slot.start_time.slice(0, 5)}–{swap.slot.end_time.slice(0, 5)}
            {' · '}{swap.slot.location}
          </p>
        )}
        {swap.reason && (
          <p className="text-xs text-stone-400 italic mt-1">&ldquo;{swap.reason}&rdquo;</p>
        )}
        {swap.admin_notes && (
          <p className="text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded px-2 py-1 mt-1">
            Note: {swap.admin_notes}
          </p>
        )}
        <p className="text-[10px] text-stone-400 mt-1">
          Requested {new Date(swap.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </div>

      {showActions && <SwapActions swapId={swap.id} />}
    </li>
  )
}
