import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberActions from './member-actions'
import PageHeader from '@/components/ui/page-header'
import { ROLE_STYLES, STATUS_STYLES } from '@/lib/badge-styles'

export const metadata: Metadata = { title: 'Members' }

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')

  const others = (members ?? []).filter(m => m.id !== user.id)

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle="Manage volunteer accounts and roles"
        actions={
          <Link
            href="/admin/members/new"
            className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            + Add Member
          </Link>
        }
      />

      <div className="max-w-6xl mx-auto px-5">
        <div className="bg-white border border-sand/70 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100 border-b border-sand/60">
                <tr>
                  {['Name', 'Role', 'Status', 'Joined', ''].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-ink/50 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/40">
                {others.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-ink/40">
                      No other members found.
                    </td>
                  </tr>
                ) : others.map((m, i) => {
                  const status = m.active ? STATUS_STYLES.active : STATUS_STYLES.inactive
                  return (
                    <tr
                      key={m.id}
                      className={`group relative transition-colors ${
                        i % 2 === 1 ? 'bg-paper-50/60' : ''
                      } hover:bg-paper-100/80 ${!m.active ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3.5 relative">
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gold-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-sage-100 text-sage-800 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {m.name.charAt(0)}
                          </div>
                          <span className="font-medium text-ink">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${ROLE_STYLES[m.role as keyof typeof ROLE_STYLES]}`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-medium ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {m.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink/45 whitespace-nowrap text-xs">
                        {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MemberActions member={m} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
