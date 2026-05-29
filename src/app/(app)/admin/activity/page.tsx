import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AuditEntry } from '@/lib/types'
import PageHeader from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Activity Log' }

// Four-tone signal system:
//   positive  — sage    (created, signed up, activated)
//   info      — mist    (updated, swap requested — neutral admin action)
//   attention — gold    (cancelled, deactivated — soft warning)
//   destructive — red   (deleted)
const ACTION_COLOURS: Record<string, string> = {
  'signup.add':       'bg-sage-200 text-sage-900',
  'signup.cancel':    'bg-gold-100 text-gold-700',
  'slot.create':      'bg-sage-200 text-sage-900',
  'slot.update':      'bg-mist/40 text-sage-900',
  'slot.delete':      'bg-red-100 text-red-700',
  'member.create':    'bg-sage-200 text-sage-900',
  'member.update':    'bg-mist/40 text-sage-900',
  'member.delete':    'bg-red-100 text-red-700',
  'member.activate':  'bg-sage-200 text-sage-900',
  'member.deactivate':'bg-gold-100 text-gold-700',
  'swap.request':     'bg-mist/40 text-sage-900',
  'swap.approve':     'bg-sage-200 text-sage-900',
  'swap.reject':      'bg-gold-100 text-gold-700',
}

function actionColour(action: string) {
  return ACTION_COLOURS[action] ?? 'bg-sand/50 text-ink/65'
}

const ACTION_LABELS: Record<string, string> = {
  'signup.add':       'Signed up',
  'signup.cancel':    'Cancelled signup',
  'slot.create':      'Slot created',
  'slot.update':      'Slot updated',
  'slot.delete':      'Slot deleted',
  'member.create':    'Member added',
  'member.update':    'Member updated',
  'member.delete':    'Member deleted',
  'member.activate':  'Activated',
  'member.deactivate':'Deactivated',
  'swap.request':     'Swap requested',
  'swap.approve':     'Swap approved',
  'swap.reject':      'Swap rejected',
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Strip user-facing UUIDs from audit detail text — keep just the first 6
// characters as an opaque short ID, so the line still gives the reader an
// anchor without showing a 36-character machine identifier.
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
function cleanDetail(detail: string) {
  return detail.replace(UUID_RE, m => `#${m.slice(0, 6)}`)
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
          )}
        </div>
      </div>
    </div>
  )
}
