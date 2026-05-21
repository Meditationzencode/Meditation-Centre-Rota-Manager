import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AuditEntry } from '@/lib/types'

export const metadata: Metadata = { title: 'Activity Log' }

const ACTION_COLOURS: Record<string, string> = {
  'signup.add':       'bg-green-100 text-green-800',
  'signup.cancel':    'bg-yellow-100 text-yellow-800',
  'slot.create':      'bg-teal-100 text-teal-800',
  'slot.update':      'bg-blue-100 text-blue-800',
  'slot.delete':      'bg-red-100 text-red-800',
  'member.create':    'bg-teal-100 text-teal-800',
  'member.update':    'bg-blue-100 text-blue-800',
  'member.delete':    'bg-red-100 text-red-800',
  'member.activate':  'bg-green-100 text-green-800',
  'member.deactivate':'bg-orange-100 text-orange-800',
}

function actionColour(action: string) {
  return ACTION_COLOURS[action] ?? 'bg-stone-100 text-stone-700'
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
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-5xl mx-auto px-5">
          <h1 className="font-serif text-3xl font-medium">Activity Log</h1>
          <p className="text-stone-500 text-sm mt-1">Last 200 actions across the system.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 mt-6">
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          {log.length === 0 ? (
            <div className="px-5 py-12 text-center text-stone-400 text-sm">No activity recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-xs text-stone-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Time</th>
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                    <th className="px-4 py-3 text-left font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {log.map(entry => (
                    <tr key={entry.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 text-stone-400 whitespace-nowrap text-xs">
                        {new Date(entry.created_at).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-stone-800 whitespace-nowrap">
                        {entry.profile?.name ?? <span className="text-stone-400 italic">deleted user</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${actionColour(entry.action)}`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600 max-w-xs truncate">{entry.detail}</td>
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
