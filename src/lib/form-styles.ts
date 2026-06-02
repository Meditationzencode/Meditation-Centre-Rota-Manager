// Shared form styling so every in-app form uses the warm Lotus Grove palette
// (sand borders, mist focus ring, ink text) instead of ad-hoc stone greys.
// Mirrors the convention already used by the profile and unavailability forms.

export const formField =
  'w-full border border-sand rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-mist focus:border-transparent'

export const formLabel = 'block text-sm font-medium text-ink/80 mb-1'

// Secondary / cancel button.
export const formCancelBtn =
  'text-sm px-4 py-2 border border-sand rounded-md text-ink/70 hover:bg-paper-100 transition-colors'
