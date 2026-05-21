import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <span className="font-serif text-xl font-medium text-stone-800">Sangha Rota</span>
          <Link
            href={ctaHref}
            className="text-sm font-medium bg-sage-600 hover:bg-sage-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-stone-100 to-stone-50 border-b border-stone-200 py-24 text-center">
        <div className="max-w-2xl mx-auto px-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-sage-600 mb-4">
            Bodhi Grove Meditation Centre
          </p>
          <h1 className="font-serif text-5xl font-medium text-stone-900 mb-6 leading-tight">
            Volunteer Rota,<br />Simplified.
          </h1>
          <p className="text-stone-500 text-lg mb-10 leading-relaxed max-w-lg mx-auto">
            Sangha Rota makes it easy to organise and manage volunteer shifts — from building
            the schedule to signing up, swapping, and tracking who does what.
          </p>
          <Link
            href={ctaHref}
            className="inline-block bg-sage-600 hover:bg-sage-700 text-white font-medium px-8 py-3 rounded-md transition-colors text-base"
          >
            {isLoggedIn ? 'Go to Dashboard →' : 'Get started →'}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 py-16 w-full">
        <h2 className="font-serif text-3xl font-medium text-center text-stone-800 mb-10">
          Everything you need
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-serif text-lg font-medium text-stone-800 mb-2">{f.title}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-stone-100 border-t border-b border-stone-200 py-16">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="font-serif text-3xl font-medium text-center text-stone-800 mb-10">
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
                <h3 className="font-serif text-lg font-medium text-stone-800 mb-2">{s.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 text-center">
        <div className="max-w-xl mx-auto px-5">
          <h2 className="font-serif text-2xl font-medium text-stone-800 mb-4">
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
      <footer className="mt-auto border-t border-stone-200 bg-stone-100 py-4 text-center text-xs text-stone-400">
        Bodhi Grove Meditation Centre &mdash; Sangha Rota &mdash;{' '}
        <em>Demo version. No real data.</em>
      </footer>
    </div>
  )
}
