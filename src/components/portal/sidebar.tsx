'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logout } from '@/lib/actions'
import type { Profile } from '@/lib/types'
import {
  Lotus, IconHome, IconCalendar, IconCalEx, IconUsers, IconBook,
  IconSwap, IconChart, IconGear, IconChevD, IconMenu, IconX,
  type IconComponent,
} from './icons'

type NavItem = {
  href: string
  label: string
  Icon: IconComponent
  badge?: number
}

export default function Sidebar({
  profile,
  pendingSwaps = 0,
}: {
  profile: Pick<Profile, 'id' | 'name' | 'role'>
  pendingSwaps?: number
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isManager = profile.role === 'admin' || profile.role === 'coordinator'
  const isAdmin = profile.role === 'admin'

  // Close the mobile drawer on navigation and on Escape.
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const nav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', Icon: IconHome },
    { href: '/rota',      label: 'Rota',      Icon: IconCalendar },
    ...(isManager ? [{ href: '/admin/schedule', label: 'Schedule', Icon: IconCalEx }] : []),
    ...(isAdmin ? [
      { href: '/admin/members',      label: 'Volunteers',   Icon: IconUsers },
      { href: '/admin/availability', label: 'Availability', Icon: IconBook },
      { href: '/admin/swaps',        label: 'Swaps',        Icon: IconSwap, badge: pendingSwaps },
      { href: '/admin/activity',     label: 'Activity',     Icon: IconChart },
    ] : []),
    { href: '/profile', label: 'Settings', Icon: IconGear },
  ]

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <>
      {/* Mobile top bar — shown only ≤860px (see portal.css) */}
      <div className="mobilebar">
        <Link className="mobilebar__brand" href="/dashboard">
          <span className="mobilebar__mark"><Lotus size={26} /></span>
          <span className="mobilebar__name">Bodhi Grove</span>
        </Link>
        <button
          type="button"
          className="mobilebar__toggle"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="app-nav"
          onClick={() => setOpen(true)}
        >
          <IconMenu size={22} />
        </button>
      </div>

      {/* Drawer backdrop (mobile) */}
      <div
        className={`side-backdrop${open ? ' side-backdrop--show' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside id="app-nav" className={`side${open ? ' side--open' : ''}`}>
        <button
          type="button"
          className="side__close"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        >
          <IconX size={20} />
        </button>

        <Link className="side__brand" href="/dashboard">
        <span className="side__brand-mark"><Lotus size={34} /></span>
        <span>
          <span className="side__brand-name">Bodhi Grove</span>
          <span className="side__brand-sub">Meditation Centre</span>
        </span>
      </Link>

      <nav className="side__nav">
        {nav.map(({ href, label, Icon, badge }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`navitem${active ? ' navitem--active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
              {badge ? <span className="navitem__badge">{badge}</span> : null}
            </Link>
          )
        })}
      </nav>

      <div className="side__leaf" aria-hidden="true">
        <svg viewBox="0 0 220 150" fill="none" stroke="currentColor" strokeWidth="1.2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 150c-8-46 8-90 54-112-2 50-20 86-54 112z" />
          <path d="M30 150c6-34 22-60 46-78" />
          <path d="M96 150c4-34 24-58 58-66-6 34-28 56-58 66z" />
          <path d="M96 150c10-24 30-40 50-48" />
          <path d="M150 150c2-24 18-40 46-44-6 24-22 38-46 44z" />
        </svg>
      </div>

      <div className="side__userwrap">
        <Link className="side__user" href="/profile">
          <span className="side__avatar-wrap">
            <span className="side__avatar">{profile.name.charAt(0)}</span>
            <span className="side__status" />
          </span>
          <span>
            <span className="side__user-name">{profile.name}</span>
            <span className="side__user-role">{profile.role}</span>
          </span>
          <span className="side__user-chev"><IconChevD size={18} /></span>
        </Link>
        <form action={logout}>
          <button type="submit" className="side__signout">Sign out</button>
        </form>
      </div>
      </aside>
    </>
  )
}
