import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AuditEntry } from '@/lib/types'
import PageHeader from '@/components/ui/page-header'
import Card from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'
import { actionColour, actionLabel, cleanDetail } from '@/lib/audit-format'

export const metadata: Metadata = { title: 'Activity Log' }

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: entries } = await supabase
    .from('audit_log')
    .select('*, profile:profiles(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const log = (entries ?? []) as AuditEntry[]

  return (
    <div>
      <PageHeader
        title="Activity Log"
        subtitle="Last 200 actions across the system."
        maxWidth="max-w-5xl"
      />

      <div className="max-w-5xl mx-auto px-5">
        {log.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            body="The audit log will fill in as members sign up, swap shifts, and admins manage the schedule."
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
