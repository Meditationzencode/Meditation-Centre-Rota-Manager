'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { logout } from '@/lib/actions'
import type { Profile } from '@/lib/types'

const ROLE_STYLES = {
  admin:       'bg-purple-100 text-purple-800',
  coordinator: 'bg-teal-100 text-teal-800',
  volunteer:   'bg-sage-100 text-sage-800',
}

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
          { href: '/admin/members',  label: 'Members'  },
          { href: '/admin/activity', label: 'Activity' },
        ]
      : []),
  ]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0 group">
          <span className="text-sage-600 text-lg">◆</span>
          <span className="font-serif text-lg font-semibold text-stone-900">Bodhi Grove</span>
          <span className="text-[10px] text-stone-400 uppercase tracking-wider hidden sm:block">Meditation Centre</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-sage-50 text-sage-700'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User menu */}
        <div className="ml-auto relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            className="flex items-center gap-2 border border-stone-200 rounded-full pl-1 pr-3 py-1 hover:bg-stone-50 hover:border-stone-400 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-sage-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {profile.name.charAt(0)}
            </div>
            <span className="text-sm font-medium text-stone-700 hidden sm:block">{profile.name.split(' ')[0]}</span>
            <svg className="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-stone-100">
                <p className="text-sm font-semibold text-stone-900">{profile.name}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block ${ROLE_STYLES[profile.role]}`}>
                  {profile.role}
                </span>
              </div>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                My Profile
              </Link>
              <form action={logout} className="block border-t border-stone-100">
                <button type="submit" className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  Sign Out
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-stone-600 hover:text-stone-900 ml-2"
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
        <div className="md:hidden border-t border-stone-200 bg-white px-5 py-3 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-sage-50 text-sage-700'
                  : 'text-stone-600 hover:bg-stone-100'
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
