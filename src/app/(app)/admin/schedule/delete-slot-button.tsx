'use client'

import { useTransition } from 'react'
import { deleteSlot } from '@/lib/actions'

export default function DeleteSlotButton({ slotId, duty }: { slotId: string; duty: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete "${duty}"? This will remove all sign-ups too.`)) return
        startTransition(async () => { await deleteSlot(slotId) })
      }}
      className="text-xs text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50 px-2 py-1 rounded transition-colors"
    >
      {pending ? '…' : 'Delete'}
    </button>
  )
}
