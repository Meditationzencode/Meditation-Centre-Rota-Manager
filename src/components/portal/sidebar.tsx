'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions'
import type { Profile } from '@/lib/types'
import {
  Lotus, IconHome, IconCalendar, IconCalEx, IconUsers, IconBook,
  IconSwap, IconChart, IconGear, IconChevD,
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
  const isManager = profile.role === 'admin' || profile.role === 'coordinator'
  const isAdmin = profile.role === 'admin'

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
    <aside className="side">
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
  )
}
