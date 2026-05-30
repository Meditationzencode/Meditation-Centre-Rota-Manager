'use client'

import { useState, useTransition } from 'react'
import { deleteTemplate } from '@/lib/actions'
import ConfirmDialog from '@/components/ui/confirm-dialog'

export default function DeleteTemplateButton({ id, duty }: { id: string; duty: string }) {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        title="Delete"
        aria-label={`Delete ${duty} template`}
        className="w-8 h-8 inline-flex items-center justify-center rounded-md text-ink/55 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>

      <ConfirmDialog
        open={open}
        title={`Delete "${duty}" template?`}
        body="Existing slots already generated from this template stay in place. Only future generations stop."
        confirmLabel="Delete template"
        tone="red"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false)
          startTransition(async () => { await deleteTemplate(id) })
        }}
      />
    </>
  )
}
