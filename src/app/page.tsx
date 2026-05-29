import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BrandMark from '@/components/ui/brand-mark'

export const metadata: Metadata = { title: 'Sangha Rota — Bodhi Grove Meditation Centre' }

const FEATURES = [
  {
    title: 'Role-based access',
    desc: 'Admins manage everything. Coordinators schedule and approve. Volunteers sign up for shifts. Viewers see the rota read-only.',
  },
  {
    title: 'Weekly & monthly views',
    desc: 'Browse the full rota week by week or get a month-at-a-glance calendar overview. Print or export to PDF.',
  },
  {
    title: 'Sign up & swap',
    desc: 'Volunteers self-serve for open slots. Request a swap when something comes up — coordinators approve.',
  },
  {
    title: 'Email notifications',
    desc: 'Automatic emails on signup confirmations, cancellations, swap requests, and swap decisions.',
  },
  {
    title: 'Calendar export',
    desc: 'Download your upcoming shifts as an .ics file to import into Google, Apple, or Outlook Calendar.',
  },
  {
    title: 'Audit log',
    desc: 'Every significant action is recorded. Admins can review the full history of changes across the system.',
  },
]

export default async function HomePage() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch { }

  const ctaHref = isLoggedIn ? '/dashboard' : '/login'
  const ctaLabel = isLoggedIn ? 'Go to Dashboard' : 'Login'

  return (
    <div className="min-h-screen flex flex-col bg-paper-100">
      {/* Header */}
      <header className="border-b border-sand/70 bg-paper-50/85 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={26} />
            <span className="font-serif text-xl font-medium text-ink">Sangha Rota</span>
          </Link>
          <Link
            href={ctaHref}
            className="text-sm font-medium bg-sage-600 hover:bg-sage-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-sand/60 py-24 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-48 h-48 rounded-full bg-gold-100/40 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-mist/20 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-5">
          <div className="inline-flex items-center gap-2 mb-5">
            <BrandMark size={32} />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sage-700">
              Bodhi Grove Meditation Centre
            </p>
          </div>
          <h1 className="font-serif text-5xl font-medium text-ink mb-6 leading-tight">
            Volunteer Rota,<br />Simplified.
          </h1>
          <p className="text-ink/60 text-lg mb-10 leading-relaxed max-w-lg mx-auto">
            Sangha Rota makes it easy to organise and manage volunteer shifts — from building
            the schedule to signing up, swapping, and tracking who does what.
          </p>
          <Link
            href={ctaHref}
            className="inline-block bg-sage-600 hover:bg-sage-700 text-white font-medium px-8 py-3 rounded-md transition-colors text-base shadow-sm"
          >
            {isLoggedIn ? 'Go to Dashboard →' : 'Get started →'}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 py-16 w-full">
        <h2 className="font-serif text-3xl font-medium text-center text-ink mb-10">
          Everything you need
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white border border-sand/70 rounded-xl p-5 shadow-sm">
              <h3 className="font-serif text-lg font-medium text-ink mb-2">{f.title}</h3>
              <p className="text-sm text-ink/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-paper-50 border-t border-b border-sand/60 py-16">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="font-serif text-3xl font-medium text-center text-ink mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              {
                step: '1',
                title: 'Create shifts',
                body: 'Admins and coordinators build the schedule — one-off slots or repeating weekly templates.',
              },
              {
                step: '2',
                title: 'Volunteers sign up',
                body: 'Team members see the weekly rota and claim open slots directly. No back-and-forth needed.',
              },
              {
                step: '3',
                title: 'Stay organised',
                body: 'Track who is doing what, approve swaps, export to calendar, and review the full audit log.',
              },
            ].map(s => (
              <div key={s.step}>
                <div className="w-10 h-10 rounded-full bg-sage-600 text-white font-serif text-xl font-medium flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-serif text-lg font-medium text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink/60 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 text-center">
        <div className="max-w-xl mx-auto px-5">
          <h2 className="font-serif text-2xl font-medium text-ink mb-4">
            Ready to try it?
          </h2>
          <Link
            href={ctaHref}
            className="inline-block bg-sage-600 hover:bg-sage-700 text-white font-medium px-8 py-3 rounded-md transition-colors"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Login to get started'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-sand/70 bg-paper-50 py-5 text-center text-xs text-ink/45 space-y-1">
        <p>Bodhi Grove Meditation Centre &mdash; Sangha Rota &mdash; <em>Demo version. No real data.</em></p>
        <p>
          Designed &amp; built by{' '}
          <a
            href="https://github.com/Meditationzencode"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink/70 transition-colors"
          >
            MeditationzenCode
          </a>
          {' '}&mdash; full-stack portfolio project &middot; Next.js 15 &middot; TypeScript &middot; Supabase &middot; Playwright E2E tests
        </p>
      </footer>
    </div>
  )
}
