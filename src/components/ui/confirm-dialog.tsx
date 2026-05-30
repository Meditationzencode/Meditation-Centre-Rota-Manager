'use client'

import { useEffect, useRef } from 'react'

type Tone = 'sage' | 'red'

type Props = {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  /** Tone of the primary action button. Use 'red' for destructive. */
  tone?: Tone
  onConfirm: () => void
  onCancel: () => void
  /** Disable confirm while a transition is pending. */
  pending?: boolean
}

const TONE_CLASSES: Record<Tone, string> = {
  sage: 'bg-sage-600 hover:bg-sage-700 text-white',
  red:  'bg-red-600 hover:bg-red-700 text-white',
}

/**
 * Branded confirmation dialog backed by the native <dialog> element so we
 * get focus trap and Escape-to-close for free, with none of the OS-style
 * window.confirm() chrome that breaks the warm palette.
 */
export default function ConfirmDialog({
  open, title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  tone = 'sage', onConfirm, onCancel, pending = false,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      onClick={e => {
        // Click outside the dialog body (on the backdrop) dismisses.
        if (e.target === ref.current) onCancel()
      }}
      className="bg-transparent p-0 backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
    >
      <div className="bg-paper-50 border border-sand rounded-xl shadow-xl max-w-sm w-[calc(100vw-2rem)] p-6">
        <h2 id="confirm-title" className="font-serif text-xl font-medium text-ink mb-2">
          {title}
        </h2>
        <p id="confirm-body" className="text-sm text-ink/70 leading-relaxed mb-5">
          {body}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium px-4 py-2 bg-paper-100 text-ink/75 border border-sand rounded-md hover:bg-paper-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm disabled:opacity-60 ${TONE_CLASSES[tone]}`}
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
