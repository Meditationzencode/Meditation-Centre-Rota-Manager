'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { toggleMemberActive, deleteMember } from '@/lib/actions'
import type { Profile } from '@/lib/types'

export default function MemberActions({ member }: { member: Profile }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
      <Link
        href={`/admin/members/${member.id}/edit`}
        title="Edit"
        aria-label={`Edit ${member.name}`}
        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink/55 hover:text-sage-700 hover:bg-sage-100/60 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      </Link>
      <button
        disabled={pending}
        onClick={() => startTransition(async () => { await toggleMemberActive(member.id, member.active) })}
        title={member.active ? 'Deactivate' : 'Activate'}
        aria-label={`${member.active ? 'Deactivate' : 'Activate'} ${member.name}`}
        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink/55 hover:text-ink hover:bg-paper-200/60 disabled:opacity-50 transition-colors"
      >
        {member.active ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        )}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm(`Permanently delete ${member.name}? This cannot be undone.`)) return
          startTransition(async () => { await deleteMember(member.id) })
        }}
        title="Delete"
        aria-label={`Delete ${member.name}`}
        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink/55 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  )
}
