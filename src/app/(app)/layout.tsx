import { redirect } from 'next/navigation'
import { createClient, getMyProfile } from '@/lib/supabase/server'
import Sidebar from '@/components/portal/sidebar'
import './portal.css'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getMyProfile(user.id)

  if (!profile) redirect('/auth-error?reason=missing_profile')

  // Pending-swaps badge in the sidebar — admins only.
  const { count: pendingSwaps } = profile.role === 'admin'
    ? await supabase.from('shift_swaps').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    : { count: 0 }

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <div className="app">
        <Sidebar profile={profile} pendingSwaps={pendingSwaps ?? 0} />
        <main id="main" className="main">
          {children}
          <footer className="portal-foot">
            <p>Bodhi Grove Meditation Centre — Sangha Rota — <em>Demo version. No real data.</em></p>
            <p>
              Built by{' '}
              <a
                href="https://github.com/Meditationzencode"
                target="_blank"
                rel="noopener noreferrer"
              >
                MeditationzenCode
              </a>
              {' '}— full-stack project using Next.js 15, TypeScript, PostgreSQL &amp; Playwright E2E tests
            </p>
          </footer>
        </main>
      </div>
    </>
  )
}
