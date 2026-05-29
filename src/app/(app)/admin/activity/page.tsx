import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AuditEntry } from '@/lib/types'
import PageHeader from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Activity Log' }

const ACTION_COLOURS: Record<string, string> = {
  'signup.add':       'bg-sage-100 text-sage-800',
  'signup.cancel':    'bg-gold-100 text-gold-700',
  'slot.create':      'bg-mist/30 text-sage-800',
  'slot.update':      'bg-paper-200 text-ink/70',
  'slot.delete':      'bg-red-100 text-red-700',
  'member.create':    'bg-mist/30 text-sage-800',
  'member.update':    'bg-paper-200 text-ink/70',
  'member.delete':    'bg-red-100 text-red-700',
  'member.activate':  'bg-sage-100 text-sage-800',
  'member.deactivate':'bg-gold-100 text-gold-700',
}

function actionColour(action: string) {
  return ACTION_COLOURS[action] ?? 'bg-paper-200 text-ink/70'
}

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
        <div className="bg-white border border-sand/70 rounded-xl shadow-sm overflow-hidden">
          {log.length === 0 ? (
            <div className="px-5 py-12 text-center text-ink/40 text-sm">No activity recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-paper-100 border-b border-sand/60 text-[11px] text-ink/50 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Time</th>
                    <th className="px-4 py-3 text-left font-semibold">User</th>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                    <th className="px-4 py-3 text-left font-semibold">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/40">
                  {log.map(entry => (
                    <tr key={entry.id} className="hover:bg-paper-100/60 transition-colors">
                      <td className="px-4 py-3 text-ink/45 whitespace-nowrap text-xs">
                        {new Date(entry.created_at).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">
                        {entry.profile?.name ?? <span className="text-ink/40 italic">deleted user</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${actionColour(entry.action)}`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink/65 max-w-xs truncate">{entry.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
