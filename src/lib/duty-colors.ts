// Duty-specific colour treatments derived from the Lotus Grove palette.
// Borders are slightly stronger than the chip backgrounds so left-stripes
// register without painting saturated rainbows across the rota.

export const DUTY_BORDER: Record<string, string> = {
  'Morning Sitting':    'border-l-gold-400',
  'Evening Sitting':    'border-l-[#8d9bb1]',  // dusk blue
  'Reception Desk':     'border-l-sand',
  'Kitchen Duty':       'border-l-[#c89b7a]',  // soft terracotta
  'Shrine Room Clean':  'border-l-sage-400',
  'Garden Maintenance': 'border-l-mist',
  'Welcome Greeter':    'border-l-[#c9b87a]',  // straw
  'Other':              'border-l-sand',
}

export const DUTY_PILL: Record<string, string> = {
  'Morning Sitting':    'bg-gold-50 text-gold-700',
  'Evening Sitting':    'bg-[#e8ebef] text-[#3f4856]',
  'Reception Desk':     'bg-sand/40 text-ink/70',
  'Kitchen Duty':       'bg-[#f2e3d6] text-[#7a4f30]',
  'Shrine Room Clean':  'bg-sage-100 text-sage-800',
  'Garden Maintenance': 'bg-mist/30 text-sage-800',
  'Welcome Greeter':    'bg-[#f0e8c9] text-[#7a6a30]',
  'Other':              'bg-sand/40 text-ink/70',
}

export function dutyBorder(duty: string): string {
  return DUTY_BORDER[duty] ?? 'border-l-sand'
}

export function dutyPill(duty: string): string {
  return DUTY_PILL[duty] ?? 'bg-sand/40 text-ink/70'
}
