import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import LoginForm from './login-form'
import { Lotus } from './icons'
import './login.css'

export const metadata: Metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="scene scene--in">
      {/* full-bleed background photo */}
      <Image
        className="scene__bg"
        src="/login-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <div className="scene__wash" />

      {/* Brand lockup */}
      <Link className="scene__brand reveal" style={{ ['--d' as string]: '0ms' }} href="/">
        <span className="scene__brand-mark"><Lotus size={30} /></span>
        <span className="scene__brand-text">
          <span className="scene__brand-name">Bodhi Grove</span>
          <span className="scene__brand-sub">Meditation Centre</span>
        </span>
      </Link>

      {/* Left column: hero + Buddha quote */}
      <div className="scene__left">
        <div className="hero">
          <span className="hero__lotus reveal" style={{ ['--d' as string]: '120ms' }}>
            <Lotus size={32} />
          </span>
          <h2 className="hero__title reveal" style={{ ['--d' as string]: '200ms' }}>
            A quiet place to<br />coordinate service<span className="hero__dot">.</span>
          </h2>
          <span className="hero__rule reveal" style={{ ['--d' as string]: '320ms' }} />
          <p className="hero__sub reveal" style={{ ['--d' as string]: '400ms' }}>
            Manage volunteer service with<br />clarity and compassion.
          </p>
          <div className="hero__chips reveal" style={{ ['--d' as string]: '480ms' }}>
            <span>Scheduling</span><span className="hero__sep" />
            <span>Volunteers</span><span className="hero__sep" />
            <span>Service</span>
          </div>
        </div>

        <blockquote className="verse reveal" style={{ ['--d' as string]: '600ms' }}>
          <span className="verse__mark">&ldquo;</span>
          <p className="verse__text">Peace comes from within.<br />Do not seek it without.</p>
          <cite className="verse__by">— Buddha</cite>
        </blockquote>
      </div>

      {/* Right column: floating sign-in card */}
      <div className="scene__right">
        <div className="reveal reveal--card" style={{ ['--d' as string]: '260ms' }}>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
