import type { Role } from '@/lib/types'
import { ROLE_STYLES } from '@/lib/badge-styles'

export default function Badge({ role }: { role: Role }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${ROLE_STYLES[role]}`}>
      {role}
    </span>
  )
}
