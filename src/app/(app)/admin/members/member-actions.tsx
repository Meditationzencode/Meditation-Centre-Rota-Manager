'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { toggleMemberActive, deleteMember } from '@/lib/actions'
import type { Profile } from '@/lib/types'

export default function MemberActions({ member }: { member: Profile }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex gap-2">
      <Link
        href={`/admin/members/${member.id}/edit`}
        className="text-xs text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition-colors"
      >
        Edit
      </Link>
      <button
        disabled={pending}
        onClick={() => startTransition(async () => { await toggleMemberActive(member.id, member.active) })}
        className="text-xs text-stone-600 border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-50 px-2 py-1 rounded transition-colors"
      >
        {member.active ? 'Deactivate' : 'Activate'}
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm(`Permanently delete ${member.name}? This cannot be undone.`)) return
          startTransition(async () => { await deleteMember(member.id) })
        }}
        className="text-xs text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50 px-2 py-1 rounded transition-colors"
      >
        Delete
      </button>
    </div>
  )
}
