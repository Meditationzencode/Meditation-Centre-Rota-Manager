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
  // Special events and classes
  'Sangha Film Club':         'border-l-[#7c83b3]',  // dusk indigo
  "Women's Circle":           'border-l-[#c98ba0]',  // rose
  "Men's Evening":            'border-l-[#7aa3a0]',  // teal
  'Extended Practice Morning':'border-l-[#caa83f]',  // deep gold
  'Buddha Day (Wesak)':       'border-l-[#d39a55]',  // saffron
  'Puja Evening':             'border-l-[#a585c0]',  // violet
  'Yoga':                     'border-l-[#8bb37a]',  // leaf green
  'Silence Day':              'border-l-[#9aa0a6]',  // slate
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
  // Special events and classes
  'Sangha Film Club':         'bg-[#e7e8f3] text-[#3f4474]',
  "Women's Circle":           'bg-[#f5e3ea] text-[#7a3050]',
  "Men's Evening":            'bg-[#dfeceb] text-[#2f5450]',
  'Extended Practice Morning':'bg-[#f3ead0] text-[#6f5d1f]',
  'Buddha Day (Wesak)':       'bg-[#f5e6d2] text-[#7a4f1f]',
  'Puja Evening':             'bg-[#efe6f5] text-[#5a3a72]',
  'Yoga':                     'bg-[#e6f0df] text-[#3f5a30]',
  'Silence Day':              'bg-[#ebedef] text-[#454b52]',
  'Other':              'bg-sand/40 text-ink/70',
}

export function dutyBorder(duty: string): string {
  return DUTY_BORDER[duty] ?? 'border-l-sand'
}

export function dutyPill(duty: string): string {
  return DUTY_PILL[duty] ?? 'bg-sand/40 text-ink/70'
}
