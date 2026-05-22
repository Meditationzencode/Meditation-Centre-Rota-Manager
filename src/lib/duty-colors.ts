export const DUTY_BORDER: Record<string, string> = {
  'Morning Sitting':    'border-l-amber-400',
  'Evening Sitting':    'border-l-indigo-400',
  'Reception Desk':     'border-l-teal-500',
  'Kitchen Duty':       'border-l-orange-400',
  'Shrine Room Clean':  'border-l-green-500',
  'Garden Maintenance': 'border-l-emerald-500',
  'Welcome Greeter':    'border-l-sky-400',
  'Other':              'border-l-stone-300',
}

export const DUTY_PILL: Record<string, string> = {
  'Morning Sitting':    'bg-amber-100 text-amber-800',
  'Evening Sitting':    'bg-indigo-100 text-indigo-800',
  'Reception Desk':     'bg-teal-100 text-teal-800',
  'Kitchen Duty':       'bg-orange-100 text-orange-800',
  'Shrine Room Clean':  'bg-green-100 text-green-800',
  'Garden Maintenance': 'bg-emerald-100 text-emerald-800',
  'Welcome Greeter':    'bg-sky-100 text-sky-800',
  'Other':              'bg-stone-100 text-stone-700',
}

export function dutyBorder(duty: string): string {
  return DUTY_BORDER[duty] ?? 'border-l-stone-300'
}

export function dutyPill(duty: string): string {
  return DUTY_PILL[duty] ?? 'bg-stone-100 text-stone-700'
}
