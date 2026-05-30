'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { logout } from '@/lib/actions'
import type { Profile } from '@/lib/types'
import BrandMark from './ui/brand-mark'
import { ROLE_STYLES } from '@/lib/badge-styles'

export default function Nav({ profile }: { profile: Pick<Profile, 'id' | 'name' | 'role'> }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/rota',      label: 'Rota'      },
    ...(profile.role === 'admin' || profile.role === 'coordinator'
      ? [{ href: '/admin/schedule', label: 'Schedule' }]
      : []),
    ...(profile.role === 'admin'
      ? [
          { href: '/admin/members',       label: 'Members'      },
          { href: '/admin/availability',  label: 'Availability' },
          { href: '/admin/swaps',         label: 'Swaps'        },
          { href: '/admin/activity',      label: 'Activity'     },
        ]
      : []),
  ]

  return (
    <header className="sticky top-0 z-50 bg-paper-50/95 backdrop-blur-sm border-b border-sand/70">
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
          <BrandMark size={26} />
          <span className="font-serif text-lg font-semibold text-ink">Bodhi Grove</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-stretch h-full flex-1">
          {navLinks.map(link => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center px-3.5 text-sm font-medium transition-colors ${
                  active
                    ? 'text-sage-800 bg-sage-100/60'
                    : 'text-ink/65 hover:text-ink hover:bg-paper-200/50'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute left-0 right-0 bottom-[-1px] h-[2px] bg-sage-600" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User menu */}
        <div className="ml-auto relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            className="flex items-center gap-2 border border-sand rounded-full pl-1 pr-3 py-1 hover:bg-paper-200/60 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-sage-100 text-sage-800 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {profile.name.charAt(0)}
            </div>
            <span className="text-sm font-medium text-ink/80 hidden sm:block">{profile.name.split(' ')[0]}</span>
            <svg className="w-3 h-3 text-ink/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-white border border-sand rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-sand/60">
                <p className="text-sm font-semibold text-ink">{profile.name}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block ${ROLE_STYLES[profile.role]}`}>
                  {profile.role}
                </span>
              </div>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-ink/75 hover:bg-paper-100 transition-colors"
              >
                My Profile
              </Link>
              <form action={logout} className="block border-t border-sand/60">
                <button type="submit" className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-ink/65 hover:text-ink ml-2"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-sand/60 bg-paper-50 px-5 py-3 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-sage-100/70 text-sage-800'
                  : 'text-ink/65 hover:bg-paper-200/60'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
