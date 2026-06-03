import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AuditEntry } from '@/lib/types'
import PageHeader from '@/components/ui/page-header'
import Card from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'
import { actionColour, actionLabel, cleanDetail } from '@/lib/audit-format'

export const metadata: Metadata = { title: 'Activity Log' }

// Filter by action family rather than the ~19 individual actions.
const ACTION_CATS = [
  { value: 'signup',   label: 'Sign-ups' },
  { value: 'slot',     label: 'Slots' },
  { value: 'swap',     label: 'Swaps' },
  { value: 'member',   label: 'Members' },
  { value: 'template', label: 'Templates' },
  { value: 'admin',    label: 'Admin actions' },
]
const selCls =
  'text-sm border border-sand rounded-md px-2.5 py-1.5 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-mist'

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; user?: string; from?: string; to?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { action, user: userId, from, to } = await searchParams
  const hasFilter = Boolean(action || userId || from || to)

  const { data: people } = await supabase.from('profiles').select('id, name').order('name')

  let query = supabase
    .from('audit_log')
    .select('*, profile:profiles(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (action && ACTION_CATS.some(c => c.value === action)) query = query.like('action', `${action}%`)
  if (userId) query = query.eq('user_id', userId)
  if (from) query = query.gte('created_at', `${from}T00:00:00`)
  if (to)   query = query.lte('created_at', `${to}T23:59:59`)

  const { data: entries } = await query
  const log = (entries ?? []) as AuditEntry[]

  return (
    <div>
      <PageHeader
        title="Activity Log"
        subtitle="Last 200 actions across the system."
        maxWidth="max-w-5xl"
      />

      <div className="max-w-5xl mx-auto px-5 space-y-4">
        {/* Filters */}
        <form method="get" className="flex flex-wrap items-end gap-3 bg-white border border-sand/70 rounded-xl px-4 py-3 shadow-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink/55">Action</span>
            <select name="action" defaultValue={action ?? ''} className={selCls}>
              <option value="">All actions</option>
              {ACTION_CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink/55">User</span>
            <select name="user" defaultValue={userId ?? ''} className={selCls}>
              <option value="">All users</option>
              {(people ?? []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink/55">From</span>
            <input type="date" name="from" defaultValue={from ?? ''} className={selCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink/55">To</span>
            <input type="date" name="to" defaultValue={to ?? ''} className={selCls} />
          </label>
          <button type="submit" className="text-sm font-medium px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-md transition-colors">
            Apply
          </button>
          {hasFilter && (
            <Link href="/admin/activity" className="text-sm font-medium px-3 py-2 text-ink/55 hover:text-ink">
              Clear
            </Link>
          )}
        </form>

        {log.length === 0 ? (
          <EmptyState
            title={hasFilter ? 'No matching activity' : 'Nothing yet'}
            body={hasFilter
              ? 'Try widening or clearing the filters above.'
              : 'The audit log will fill in as members sign up, swap shifts, and admins manage the schedule.'}
          />
        ) : (
          <Card clip>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-paper-100 border-b border-sand/60 text-[11px] text-ink/50 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold w-44">Time</th>
                    <th className="px-4 py-3 text-left font-semibold w-40">User</th>
                    <th className="px-4 py-3 text-left font-semibold w-36">Action</th>
                    <th className="px-4 py-3 text-left font-semibold">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/40">
                  {log.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={`group relative transition-colors ${
                        i % 2 === 1 ? 'bg-paper-50/60' : ''
                      } hover:bg-paper-100/80`}
                    >
                      <td className="px-4 py-3.5 text-ink/45 whitespace-nowrap text-xs relative">
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {new Date(entry.created_at).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">
                        {entry.profile?.name ?? <span className="text-ink/40 italic">deleted user</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${actionColour(entry.action)}`}>
                          {actionLabel(entry.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink/70 max-w-xs truncate">{cleanDetail(entry.detail)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
