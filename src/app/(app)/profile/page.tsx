import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, getProfileForUser } from '@/lib/supabase/server'
import ProfileForm from './profile-form'
import UnavailabilityForm from './unavailability-form'
import PageHeader from '@/components/ui/page-header'
import Card from '@/components/ui/card'
import { ROLE_STYLES } from '@/lib/badge-styles'

export const metadata: Metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, { data: signups }, { data: unavailability }] = await Promise.all([
    getProfileForUser<{
      id: string
      name: string
      role: 'admin' | 'coordinator' | 'volunteer' | 'viewer'
      active: boolean
      phone_number: string
      created_at: string
    }>(user.id, '*'),
    supabase.from('signups')
      .select('*, slot:slots(*)')
      .eq('user_id', user.id)
      .order('signed_up_at'),
    supabase.from('unavailability')
      .select('*')
      .eq('user_id', user.id)
      .order('date'),
  ])

  if (!profile) redirect('/auth-error?reason=missing_profile')

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = (signups ?? [])
    .filter(s => s.slot && (s.slot as { date: string }).date >= today)
    .sort((a, b) => (a.slot as { date: string }).date.localeCompare((b.slot as { date: string }).date))

  return (
    <div>
      <PageHeader title="My Profile" maxWidth="max-w-5xl" />

      <div className="max-w-2xl mx-auto px-5 space-y-5">
        {/* Profile card */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-sage-100 text-sage-800 flex items-center justify-center text-2xl font-semibold font-serif flex-shrink-0">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-serif text-xl font-medium text-ink">{profile.name}</h2>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block ${ROLE_STYLES[profile.role as keyof typeof ROLE_STYLES]}`}>
              {profile.role}
            </span>
            <p className="text-sm text-ink/45 mt-1">{user.email}</p>
            {profile.phone_number && (
              <p className="text-sm text-ink/45">{profile.phone_number}</p>
            )}
          </div>
        </Card>

        {/* Edit form */}
        <ProfileForm name={profile.name} phone={profile.phone_number} />

        {/* Unavailability — not shown to viewers */}
        {profile.role !== 'viewer' && (
          <UnavailabilityForm entries={unavailability ?? []} />
        )}

        {/* Upcoming sign-ups */}
        <Card clip>
          <div className="flex items-center justify-between px-5 py-4 border-b border-sand/60">
            <h2 className="font-serif text-lg font-medium text-ink">My Sign-ups</h2>
            <a
              href="/api/rota/export"
              className="text-xs text-ink/55 hover:text-ink border border-sand rounded-md px-2.5 py-1.5 hover:bg-paper-100 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Export .ics
            </a>
          </div>
          {upcoming.length === 0 ? (
            <div className="px-5 py-8 text-center text-ink/40 text-sm">No upcoming sign-ups.</div>
          ) : (
            <ul className="divide-y divide-sand/40">
              {upcoming.map(s => {
                const slot = s.slot as { id: string; date: string; duty: string; start_time: string; end_time: string; location: string; week_start: string }
                return (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xs font-semibold text-sage-700 uppercase tracking-wide w-16 flex-shrink-0">
                      {new Date(`${slot.date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{slot.duty}</p>
                      <p className="text-xs text-ink/45">{slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)} · {slot.location}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
