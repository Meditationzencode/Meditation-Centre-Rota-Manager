import { redirect } from 'next/navigation'
import { createClient, getProfileForUser } from '@/lib/supabase/server'
import Nav from '@/components/nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getProfileForUser(user.id)

  if (!profile) redirect('/auth-error?reason=missing_profile')

  return (
    <div className="min-h-screen flex flex-col">
      <Nav profile={profile} />
      <main className="flex-1 pb-12">
        {children}
      </main>
      <footer className="border-t border-sand/70 bg-paper-50 py-4 text-center text-xs text-ink/45 space-y-1">
        <p>Bodhi Grove Meditation Centre &mdash; Sangha Rota &mdash; <em>Demo version. No real data.</em></p>
        <p>
          Built by{' '}
          <a
            href="https://github.com/Meditationzencode"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink/70 transition-colors"
          >
            MeditationzenCode
          </a>
          {' '}&mdash; full-stack project using Next.js 15, TypeScript, PostgreSQL &amp; Playwright E2E tests
        </p>
      </footer>
    </div>
  )
}
