import type { Role } from '@/lib/types'

const STYLES: Record<Role, string> = {
  admin:       'bg-purple-100 text-purple-800',
  coordinator: 'bg-teal-100 text-teal-800',
  volunteer:   'bg-sage-100 text-sage-800',
  viewer:      'bg-stone-100 text-stone-600',
}

export default function Badge({ role }: { role: Role }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${STYLES[role]}`}>
      {role}
    </span>
  )
}
