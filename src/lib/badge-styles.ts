import type { Role } from '@/lib/types'

// Unified badge palette — used everywhere a role appears.
// Tones drawn from the Lotus Grove palette: gold, mist, sage, sand.
export const ROLE_STYLES: Record<Role, string> = {
  admin:       'bg-gold-100 text-gold-700',
  coordinator: 'bg-mist/30 text-sage-800',
  volunteer:   'bg-sage-100 text-sage-800',
  viewer:      'bg-sand/50 text-ink/65',
}

// Status indicator dots & text — Active / Inactive / Pending / Full.
export const STATUS_STYLES = {
  active:   { dot: 'bg-sage-500', text: 'text-sage-700' },
  inactive: { dot: 'bg-stone-300', text: 'text-stone-400' },
  pending:  { dot: 'bg-gold-500', text: 'text-gold-700' },
  full:     { dot: 'bg-red-400',  text: 'text-red-600'  },
}

// "spots filled" pills — used on the rota grids and the Schedule table.
// Mental model: empty needs attention (gold), partial is fine (sage),
// full is good (stronger sage). Red is reserved for genuine errors.
export const COUNT_PILL = {
  empty:   'bg-gold-100 text-gold-700',
  partial: 'bg-sage-100 text-sage-800',
  full:    'bg-sage-200 text-sage-900',
  over:    'bg-red-100 text-red-700',
}
