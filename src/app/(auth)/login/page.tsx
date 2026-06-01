import type { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import LoginForm from './login-form'

export const metadata: Metadata = { title: 'Sign In' }

const DEMO_ACCOUNTS = [
  { email: 'admin@bodhigrove.demo',  role: 'Admin',       name: 'Ananda Sharma',   Icon: CrownIcon },
  { email: 'coord1@bodhigrove.demo', role: 'Coordinator', name: 'Maya Patel',      Icon: PeopleIcon },
  { email: 'vol1@bodhigrove.demo',   role: 'Volunteer',   name: 'James Whitfield', Icon: LeafIcon },
] as const

export default function LoginPage() {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2 bg-paper-100 overflow-hidden">
      {/* Subtle leaf-shadow texture across the top of the cream background */}
      <BackgroundShadows />

      {/* ── Brand panel ─────────────────────────────────────────────── */}
      <aside className="relative z-10 hidden lg:flex flex-col justify-between p-14 pr-0">

        {/* Wordmark + lotus */}
        <div className="flex items-center gap-4">
          <LotusEmblem size={64} />
          <div className="leading-none">
            <p className="font-serif text-[28px] font-medium text-sage-900 tracking-[0.06em]">BODHI GROVE</p>
            <p className="text-[11px] uppercase tracking-[0.32em] text-gold-600 mt-2">Meditation Centre</p>
          </div>
        </div>

        {/* Headline block */}
        <div className="max-w-md">
          <div className="mb-5">
            <LotusEmblem size={32} ring={false} />
          </div>
          <h1 className="font-serif text-[56px] leading-[1.05] text-sage-900 font-normal mb-5">
            A quiet place to<br />coordinate service<span className="text-gold-500">.</span>
          </h1>
          <div className="w-14 h-px bg-gold-400 mb-6" />
          <p className="text-ink/65 text-[17px] leading-relaxed mb-8 max-w-sm">
            Manage volunteer service with<br />clarity and compassion.
          </p>
          <div className="flex items-center gap-4 text-sage-800 font-medium">
            <span>Scheduling</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
            <span>Volunteers</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
            <span>Service</span>
          </div>
        </div>

        {/* Bottom: stones-in-sand + quote */}
        <div className="flex items-end justify-between gap-8 pr-8">
          <div className="relative">
            <SandRipples />
            <Image
              src="/login-stones.png"
              alt=""
              width={420}
              height={420}
              className="relative w-44 h-auto select-none"
            />
          </div>

          <blockquote className="max-w-[14rem] pb-4">
            <p className="font-serif italic text-ink/75 text-[15px] leading-relaxed">
              <span className="font-serif text-gold-500 text-3xl leading-none align-top mr-1">&ldquo;</span>
              Peace comes from within.<br />Do not seek it without.
            </p>
            <footer className="text-xs text-gold-600 mt-2 not-italic tracking-wide">— Buddha</footer>
          </blockquote>
        </div>
      </aside>

      {/* ── The leaf — sits across the column boundary, behind the card ─ */}
      <Image
        src="/login-leaf.png"
        alt=""
        width={1200}
        height={1200}
        priority
        className="hidden lg:block absolute z-20 left-1/2 top-1/2 -translate-x-[58%] -translate-y-1/2 w-[36rem] h-auto pointer-events-none select-none drop-shadow-xl"
      />

      {/* ── Form panel ──────────────────────────────────────────────── */}
      <main className="relative z-30 flex items-center justify-center p-6 sm:p-10 lg:py-12 lg:pr-12 lg:pl-0">
        <div className="w-full max-w-md bg-paper-50/95 backdrop-blur-sm border border-sand/70 rounded-3xl shadow-2xl shadow-sand/40 p-10">

          {/* Header */}
          <div className="flex flex-col items-center mb-7">
            <LotusEmblem size={40} ring={false} />
            <h2 className="font-serif text-[40px] font-medium text-sage-900 mt-4 leading-none">Welcome back</h2>
            <p className="text-ink/55 text-sm mt-2.5 text-center">Sign in to manage volunteer service.</p>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          {/* Lotus divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-sand/70" />
            <LotusEmblem size={20} ring={false} />
            <div className="flex-1 h-px bg-sand/70" />
          </div>

          <p className="text-center text-sm text-ink/65 mb-3">
            Try a demo account
          </p>
          <div className="flex flex-col gap-2.5">
            {DEMO_ACCOUNTS.map((acc, i) => (
              <button
                key={acc.email}
                type="button"
                data-email={acc.email}
                className={`demo-fill group relative flex items-center gap-3 px-4 py-3 text-left border border-sand/70 rounded-xl bg-white hover:bg-sage-50 hover:border-sage-300 transition-colors overflow-hidden ${
                  i === 0 ? 'border-l-[4px] border-l-sage-700' : ''
                }`}
              >
                <span className="w-7 h-7 rounded-md bg-sage-50 text-sage-700 flex items-center justify-center group-hover:bg-sage-100 transition-colors flex-shrink-0">
                  <acc.Icon />
                </span>
                <span className="text-sm font-semibold text-sage-900 flex-1">{acc.role}</span>
                <span className="text-sm text-ink/60">{acc.name}</span>
                <span className="text-ink/40 group-hover:text-sage-700 group-hover:translate-x-0.5 transition-all">›</span>
              </button>
            ))}
          </div>

          {/* Portfolio footer */}
          <div className="flex flex-col items-center mt-7 pt-6 border-t border-sand/60">
            <LotusEmblem size={18} ring={false} className="mb-2 opacity-70" />
            <p className="text-xs text-ink/65">
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
            <p className="text-[10px] text-ink/45 mt-1.5">
              Next.js 15 &middot; TypeScript &middot; Supabase &middot; PostgreSQL &middot; Playwright E2E tests
            </p>
          </div>
        </div>

        {/* Mobile-only brand block */}
        <div className="lg:hidden absolute top-6 left-0 right-0 flex flex-col items-center pointer-events-none">
          <div className="flex items-center gap-2.5">
            <LotusEmblem size={26} />
            <span className="font-serif text-lg font-semibold text-sage-900">Bodhi Grove</span>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Decorative layers ────────────────────────────────────────────────

/** Soft warm blooms + a faint blurred leaf shadow across the top of the page. */
function BackgroundShadows() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute -top-32 -right-20 w-[36rem] h-[36rem] rounded-full bg-gold-100/40 blur-3xl" />
      <div className="absolute top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full bg-mist/15 blur-3xl" />
      {/* Soft branch-shadow silhouette top-right, suggests dappled light from above */}
      <Image
        src="/login-leaf.png"
        alt=""
        width={900}
        height={900}
        className="absolute -top-40 right-[-8%] w-[48rem] h-auto opacity-25 mix-blend-multiply rotate-[18deg] select-none"
      />
    </div>
  )
}

/** Concentric circular ripples in the cream, behind the stones. */
function SandRipples() {
  return (
    <svg
      className="absolute -left-6 -bottom-4 w-72 h-40 text-sand/70"
      viewBox="0 0 280 160"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden
    >
      <ellipse cx="100" cy="130" rx="120" ry="22" />
      <ellipse cx="100" cy="130" rx="95" ry="18" />
      <ellipse cx="100" cy="130" rx="70" ry="14" />
      <ellipse cx="100" cy="130" rx="50" ry="10" />
    </svg>
  )
}

/** Lotus emblem — 3 vertical petals in a thin gold ring. Closer to the mockup. */
function LotusEmblem({
  size = 40,
  ring = true,
  className = '',
}: { size?: number; ring?: boolean; className?: string }) {
  const inner = size * 0.58
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${
        ring ? 'rounded-full border border-gold-500/70' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#9c8347"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Three vertical petals */}
        <path d="M12 4c1.4 2.4 1.4 6 0 9-1.4-3-1.4-6.6 0-9Z" />
        <path d="M7 7c2.4 2 4 5 4.5 7-2-1-4.4-3.5-4.5-7Z" />
        <path d="M17 7c-2.4 2-4 5-4.5 7 2-1 4.4-3.5 4.5-7Z" />
        {/* Base */}
        <path d="M5 14c2.4 1.2 5 1.6 7 1.6s4.6-.4 7-1.6c-1 2-3.6 3.4-7 3.4S6 16 5 14Z" />
      </svg>
    </span>
  )
}

function CrownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l4 5 5-7 5 7 4-5-2 11H5L3 8z" />
      <path d="M5 19h14" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="3" />
      <path d="M3 19c1-3 3-4.5 6-4.5s5 1.5 6 4.5" />
      <circle cx="17" cy="10" r="2.4" />
      <path d="M15 19.5c.7-2.1 2-3 3.8-3s2.7.9 3.2 2.5" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" />
      <path d="M5 19c4-3 7-6 10-10" />
    </svg>
  )
}
