import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Member Availability' }

export default async function AdminAvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const [{ data: unavailability }, { data: profiles }] = await Promise.all([
    admin.from('unavailability').select('*').order('date').order('created_at'),
    admin.from('profiles').select('id, name, role').order('name'),
  ])

  type PRow = { id: string; name: string; role: string }
  const profileMap = new Map<string, { name: string; role: string }>(
    (profiles ?? []).map((p: PRow) => [p.id, { name: p.name, role: p.role }])
  )

  const byMember = new Map<string, { name: string; role: string; dates: { id: string; date: string; note: string }[] }>()
  for (const entry of (unavailability ?? [])) {
    const p = profileMap.get(entry.user_id)
    if (!p) continue
    if (!byMember.has(entry.user_id)) byMember.set(entry.user_id, { name: p.name, role: p.role, dates: [] })
    byMember.get(entry.user_id)!.dates.push({ id: entry.id, date: entry.date, note: entry.note ?? '' })
  }

  const members = [...byMember.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name))

  const fmtDate = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    })

  return (
    <div>
      <PageHeader
        title="Member Availability"
        maxWidth="max-w-5xl"
        subtitle={`Unavailability dates submitted by volunteers — ${
          members.length === 0
            ? 'none yet'
            : `${members.length} member${members.length !== 1 ? 's' : ''}, ${(unavailability ?? []).length} date${(unavailability ?? []).length !== 1 ? 's' : ''} total`
        }`}
      />

      <div className="max-w-4xl mx-auto px-5 space-y-4 pb-12">
        {members.length === 0 ? (
          <div className="bg-white border border-sand/70 rounded-xl shadow-sm p-10 text-center text-ink/40 text-sm">
            No unavailability dates have been submitted yet.
          </div>
        ) : members.map(([userId, { name, role, dates }]) => (
          <div key={userId} className="bg-white border border-sand/70 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-sand/50 bg-paper-100">
              <div className="w-8 h-8 rounded-full bg-sage-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-ink">{name}</p>
                <p className="text-xs text-ink/45 capitalize">{role}</p>
              </div>
              <span className="ml-auto text-xs bg-white border border-sand text-ink/65 px-2 py-0.5 rounded-full">
                {dates.length} date{dates.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="divide-y divide-sand/30">
              {dates.map(d => (
                <div key={d.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-sm font-medium text-ink/80">{fmtDate(d.date)}</span>
                  {d.note && (
                    <span className="text-xs text-ink/60 bg-paper-100 border border-sand/50 px-2 py-0.5 rounded">
                      {d.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
