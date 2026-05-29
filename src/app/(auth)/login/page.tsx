import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from './login-form'
import BrandMark from '@/components/ui/brand-mark'
import { ROLE_STYLES } from '@/lib/badge-styles'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-paper-100">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 bg-gradient-to-br from-sage-700 via-sage-800 to-sage-900 text-white">
        {/* Soft accents */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-14 left-16 w-40 h-40 rounded-full bg-gold-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-mist/10 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-10">
            <BrandMark size={42} />
            <span className="text-xs uppercase tracking-[0.22em] text-white/55">Lotus Grove</span>
          </div>
          <h1 className="font-serif text-5xl font-medium mb-2">Bodhi Grove</h1>
          <p className="uppercase tracking-[0.2em] text-sm text-white/55 mb-1">Meditation Centre</p>
          <p className="text-white/55 text-sm mt-4">Sangha Rota — volunteer scheduling portal</p>
        </div>

        <div className="relative space-y-6">
          <blockquote className="border-l-2 border-gold-400/60 pl-4 italic font-serif text-lg text-white/75">
            &ldquo;Peace comes from within. Do not seek it without.&rdquo;
          </blockquote>
          <div className="border-t border-white/10 pt-5 text-xs text-white/45 space-y-1">
            <p className="font-semibold text-white/65 not-italic">
              Designed &amp; built by{' '}
              <a
                href="https://github.com/Meditationzencode"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white transition-colors"
              >
                MeditationzenCode
              </a>
            </p>
            <p>Full-stack portfolio project &mdash; Next.js 15 &middot; TypeScript &middot; PostgreSQL &middot; Supabase Auth &middot; Playwright E2E</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8 bg-paper-100">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center justify-center gap-2.5">
            <BrandMark size={28} />
            <span className="font-serif text-2xl font-semibold text-ink">Bodhi Grove</span>
          </div>

          <h2 className="font-serif text-3xl font-medium text-ink mb-1">Welcome back</h2>
          <p className="text-ink/55 text-sm mb-8">Sign in to manage the rota</p>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          {/* Demo credentials */}
          <div className="mt-8 pt-6 border-t border-sand/70">
            <p className="text-xs text-ink/55 mb-3">
              Demo accounts &mdash; password: <code className="bg-sand/40 text-ink/80 px-1.5 py-0.5 rounded">Demo1234!</code>
            </p>
            <div className="flex flex-col gap-2">
              {[
                { email: 'admin@bodhigrove.demo',  role: 'admin',       name: 'Ananda Sharma'   },
                { email: 'coord1@bodhigrove.demo', role: 'coordinator', name: 'Maya Patel'      },
                { email: 'vol1@bodhigrove.demo',   role: 'volunteer',   name: 'James Whitfield' },
              ].map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  data-email={acc.email}
                  className="demo-fill flex items-center gap-2.5 px-3 py-2 text-left text-sm border border-sand/70 rounded-md bg-white hover:bg-paper-100 hover:border-mist transition-colors"
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${ROLE_STYLES[acc.role as keyof typeof ROLE_STYLES]}`}>
                    {acc.role}
                  </span>
                  <span className="text-ink/80">{acc.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Portfolio credit */}
          <div className="mt-6 pt-5 border-t border-sand/70 text-center">
            <p className="text-xs text-ink/55">
              Designed &amp; built by{' '}
              <a
                href="https://github.com/Meditationzencode"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink underline hover:text-sage-700 transition-colors"
              >
                MeditationzenCode
              </a>
            </p>
            <p className="text-[10px] text-ink/45 mt-1">
              Next.js 15 &middot; TypeScript &middot; Supabase &middot; PostgreSQL &middot; Playwright E2E tests
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
