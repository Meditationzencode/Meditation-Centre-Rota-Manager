import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MemberActions from './member-actions'

export const metadata: Metadata = { title: 'Members' }

const ROLE_STYLES = {
  admin:       'bg-purple-100 text-purple-800',
  coordinator: 'bg-teal-100 text-teal-800',
  volunteer:   'bg-sage-100 text-sage-800',
}

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
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-medium">Members</h1>
            <p className="text-stone-500 text-sm mt-1">Manage volunteer accounts and roles</p>
          </div>
          <Link
            href="/admin/members/new"
            className="bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            + Add Member
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 mt-6">
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  {['Name', 'Role', 'Status', 'Joined', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {others.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-stone-400">
                      No other members found.
                    </td>
                  </tr>
                ) : others.map(m => (
                  <tr key={m.id} className={`hover:bg-stone-50 transition-colors ${!m.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-sage-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${ROLE_STYLES[m.role as keyof typeof ROLE_STYLES]}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${m.active ? 'text-sage-700' : 'text-stone-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.active ? 'bg-sage-500' : 'bg-stone-400'}`} />
                        {m.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 whitespace-nowrap text-xs">
                      {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <MemberActions member={m} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
