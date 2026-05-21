import { redirect } from 'next/navigation'
import { createClient, getProfileForUser } from '@/lib/supabase/server'
import Nav from '@/components/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.error('[layout] url:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30))
  console.error('[layout] user:', user?.id ?? 'null', 'authError:', authError?.message ?? 'none')

  if (!user) redirect('/login')

  const profile = await getProfileForUser(user.id)

  console.error('[layout] profile:', profile?.name ?? 'null')

  if (!profile) redirect('/auth-error?reason=missing_profile')

  return (
    <div className="min-h-screen flex flex-col">
      <Nav profile={profile} />
      <main className="flex-1 pb-12">
        {children}
      </main>
      <footer className="border-t border-stone-200 bg-stone-100 py-4 text-center text-xs text-stone-400">
        Bodhi Grove Meditation Centre &mdash; Sangha Rota &mdash;{' '}
        <em>Demo version. No real data.</em>
      </footer>
    </div>
  )
}
