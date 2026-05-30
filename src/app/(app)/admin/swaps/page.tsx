import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import SwapActions from './swap-actions'
import PageHeader from '@/components/ui/page-header'
import Card from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Swap Requests' }

const SWAP_STATUS_STYLES = {
  pending:  'bg-gold-100 text-gold-700',
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
      <PageHeader
        title="Swap Requests"
        subtitle="Review and action volunteer shift swap requests"
        maxWidth="max-w-5xl"
      />

      <div className="max-w-4xl mx-auto px-5 space-y-8">

        {/* Pending */}
        <section>
          <h2 className="font-serif text-xl font-medium mb-3 text-ink">
            Pending
            {pending.length > 0 && (
              <span className="ml-2 text-sm font-sans font-semibold bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </h2>
          {pending.length === 0 ? (
            <EmptyState
              title="No pending requests"
              body="Volunteer swap requests will appear here for you to review."
            />
          ) : (
            <Card clip>
              <ul className="divide-y divide-sand/40">
                {pending.map(swap => (
                  <SwapRow key={swap.id} swap={swap} showActions />
                ))}
              </ul>
            </Card>
          )}
        </section>

        {/* Resolved */}
        {resolved.length > 0 && (
          <section>
            <h2 className="font-serif text-xl font-medium mb-3 text-ink">Recent Decisions</h2>
            <Card clip>
              <ul className="divide-y divide-sand/40">
                {resolved.map(swap => (
                  <SwapRow key={swap.id} swap={swap} showActions={false} />
                ))}
              </ul>
            </Card>
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
          <span className="font-medium text-sm text-ink">{swap.requester?.name ?? 'Unknown'}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${SWAP_STATUS_STYLES[swap.status]}`}>
            {swap.status}
          </span>
        </div>
        {swap.slot && (
          <p className="text-xs text-ink/55 mt-0.5">
            {new Date(`${swap.slot.date}T00:00:00Z`).toLocaleDateString('en-GB', {
              weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
            })}
            {' · '}{swap.slot.duty}
            {' · '}{swap.slot.start_time.slice(0, 5)}–{swap.slot.end_time.slice(0, 5)}
            {' · '}{swap.slot.location}
          </p>
        )}
        {swap.reason && (
          <p className="text-xs text-ink/45 italic mt-1">&ldquo;{swap.reason}&rdquo;</p>
        )}
        {swap.admin_notes && (
          <p className="text-xs text-sage-800 bg-sage-50 border border-sage-100 rounded px-2 py-1 mt-1">
            Note: {swap.admin_notes}
          </p>
        )}
        <p className="text-[10px] text-ink/40 mt-1">
          Requested {new Date(swap.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </div>

      {showActions && <SwapActions swapId={swap.id} />}
    </li>
  )
}
