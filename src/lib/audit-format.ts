// Presentation helpers for audit-log entries.
// Lives in lib/ rather than the page so other surfaces (e.g. a future
// dashboard "recent activity" widget) can reuse the same vocabulary.

// Four-tone signal palette:
//   positive    — sage    (created, signed up, activated, approved)
//   info        — mist    (updated, swap requested)
//   attention   — gold    (cancelled, deactivated, rejected)
//   destructive — red    (deleted)
const ACTION_COLOURS: Record<string, string> = {
  'signup.add':       'bg-sage-200 text-sage-900',
  'signup.cancel':    'bg-gold-100 text-gold-700',
  'slot.create':      'bg-sage-200 text-sage-900',
  'slot.update':      'bg-mist/40 text-sage-900',
  'slot.delete':      'bg-red-100 text-red-700',
  'member.create':    'bg-sage-200 text-sage-900',
  'member.update':    'bg-mist/40 text-sage-900',
  'member.delete':    'bg-red-100 text-red-700',
  'member.activate':  'bg-sage-200 text-sage-900',
  'member.deactivate':'bg-gold-100 text-gold-700',
  'swap.request':     'bg-mist/40 text-sage-900',
  'swap.approve':     'bg-sage-200 text-sage-900',
  'swap.reject':      'bg-gold-100 text-gold-700',
}

const ACTION_LABELS: Record<string, string> = {
  'signup.add':       'Signed up',
  'signup.cancel':    'Cancelled signup',
  'slot.create':      'Slot created',
  'slot.update':      'Slot updated',
  'slot.delete':      'Slot deleted',
  'member.create':    'Member added',
  'member.update':    'Member updated',
  'member.delete':    'Member deleted',
  'member.activate':  'Activated',
  'member.deactivate':'Deactivated',
  'swap.request':     'Swap requested',
  'swap.approve':     'Swap approved',
  'swap.reject':      'Swap rejected',
}

export function actionColour(action: string): string {
  return ACTION_COLOURS[action] ?? 'bg-sand/50 text-ink/65'
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action]
    ?? action.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi
const ISO_DATE_RE = /\b(\d{4})-(\d{2})-(\d{2})\b/g
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * Tidy up audit detail strings for display:
 *   • collapse 36-char UUIDs to a short opaque #xxxxxx tag
 *   • reformat ISO dates (2099-11-17) to en-GB short form (17 Nov 2099)
 *     so the row reads in one consistent voice
 */
export function cleanDetail(detail: string): string {
  return detail
    .replace(UUID_RE, m => `#${m.slice(0, 6)}`)
    .replace(ISO_DATE_RE, (_, y, m, d) => `${parseInt(d, 10)} ${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y}`)
}
