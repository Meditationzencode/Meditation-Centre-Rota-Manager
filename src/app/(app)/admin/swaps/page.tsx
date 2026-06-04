import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import SwapActions from './swap-actions'
import PageHeader from '@/components/ui/page-header'
import Card from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Swap Requests' }

const FILTERS = ['pending', 'approved', 'rejected', 'all'] as const
type Filter = (typeof FILTERS)[number]
const FILTER_LABELS: Record<Filter, string> = {
  pending: 'Pending', approved: 'Approved', rejected: 'Rejected', all: 'All',
}

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

export default async function SwapsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { status: rawStatus } = await searchParams
  const filter: Filter = (FILTERS as readonly string[]).includes(rawStatus ?? '')
    ? (rawStatus as Filter)
    : 'pending'

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

  const swaps = (rawSwaps ?? []) as unknown as SwapEntry[]
  const counts: Record<Filter, number> = {
    pending:  swaps.filter(s => s.status === 'pending').length,
    approved: swaps.filter(s => s.status === 'approved').length,
    rejected: swaps.filter(s => s.status === 'rejected').length,
    all:      swaps.length,
  }
  const shown = filter === 'all' ? swaps : swaps.filter(s => s.status === filter)

  return (
    <div>
      <PageHeader
        title="Swap Requests"
        subtitle="Review and action volunteer shift swap requests"
        maxWidth="max-w-5xl"
      />

      <div className="max-w-4xl mx-auto px-5 space-y-5">
        {/* Status filter */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
          {FILTERS.map(f => {
            const active = f === filter
            return (
              <Link
                key={f}
                href={f === 'pending' ? '/admin/swaps' : `/admin/swaps?status=${f}`}
                role="tab"
                aria-selected={active}
                className={`inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
                  active
                    ? 'bg-sage-600 border-sage-600 text-white'
                    : 'bg-white border-sand text-ink/65 hover:border-sage-400 hover:text-sage-700'
                }`}
              >
                {FILTER_LABELS[f]}
                <span className={`text-xs font-semibold ${active ? 'text-white/80' : 'text-ink/40'}`}>
                  {counts[f]}
                </span>
              </Link>
            )
          })}
        </div>

        {shown.length === 0 ? (
          <EmptyState
            title={
              filter === 'pending' ? 'No pending swap requests'
              : filter === 'all' ? 'No swap requests yet'
              : `No ${filter} requests`
            }
            body={
              filter === 'pending'
                ? 'All volunteer swap requests have been reviewed.'
                : 'Volunteer swap requests will appear here as they come in.'
            }
          />
        ) : (
          <Card clip>
            <ul className="divide-y divide-sand/40">
              {shown.map(swap => (
                <SwapRow key={swap.id} swap={swap} showActions={swap.status === 'pending'} />
              ))}
            </ul>
          </Card>
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
