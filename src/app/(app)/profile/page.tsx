import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, getProfileForUser } from '@/lib/supabase/server'
import ProfileForm from './profile-form'
import UnavailabilityForm from './unavailability-form'

export const metadata: Metadata = { title: 'My Profile' }

const ROLE_STYLES = {
  admin:       'bg-purple-100 text-purple-800',
  coordinator: 'bg-teal-100 text-teal-800',
  volunteer:   'bg-sage-100 text-sage-800',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, { data: signups }, { data: unavailability }] = await Promise.all([
    getProfileForUser<{
      id: string
      name: string
      role: 'admin' | 'coordinator' | 'volunteer'
      active: boolean
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
      <div className="bg-gradient-to-r from-stone-100 to-sage-50 border-b border-stone-200 py-7">
        <div className="max-w-2xl mx-auto px-5">
          <h1 className="font-serif text-3xl font-medium">My Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-6 space-y-5">
        {/* Profile card */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-sage-600 text-white flex items-center justify-center text-2xl font-semibold font-serif flex-shrink-0">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-serif text-xl font-medium">{profile.name}</h2>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block ${ROLE_STYLES[profile.role as keyof typeof ROLE_STYLES]}`}>
              {profile.role}
            </span>
            <p className="text-sm text-stone-400 mt-1">{user.email}</p>
          </div>
        </div>

        {/* Edit form */}
        <ProfileForm name={profile.name} />

        {/* Unavailability */}
        <UnavailabilityForm entries={unavailability ?? []} />

        {/* Upcoming sign-ups */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <h2 className="font-serif text-lg">My Sign-ups</h2>
          </div>
          {upcoming.length === 0 ? (
            <div className="px-5 py-8 text-center text-stone-400 text-sm">No upcoming sign-ups.</div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {upcoming.map(s => {
                const slot = s.slot as { id: string; date: string; duty: string; start_time: string; end_time: string; location: string; week_start: string }
                return (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide w-16 flex-shrink-0">
                      {new Date(`${slot.date}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{slot.duty}</p>
                      <p className="text-xs text-stone-400">{slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)} · {slot.location}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
