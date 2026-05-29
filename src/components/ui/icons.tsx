type Props = { size?: number; className?: string }

const COMMON = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function svg(size: number, className: string, children: React.ReactNode) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...COMMON}>
      {children}
    </svg>
  )
}

export function UserIcon({ size = 18, className = '' }: Props) {
  return svg(size, className, (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5" />
    </>
  ))
}

export function UsersIcon({ size = 18, className = '' }: Props) {
  return svg(size, className, (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3.5 19c1-2.8 3-4.2 5.5-4.2S13.5 16.2 14.5 19" />
      <circle cx="16.5" cy="10" r="2.4" />
      <path d="M14.5 19.5c.7-2.1 2-3.1 3.8-3.1S21.4 17.4 22 19" />
    </>
  ))
}

export function HandshakeIcon({ size = 18, className = '' }: Props) {
  return svg(size, className, (
    <>
      <path d="M2 13l4-4 3 3-4 4a1.5 1.5 0 0 1-2.1 0L2 15a1.5 1.5 0 0 1 0-2Z" />
      <path d="M22 13l-4-4-3 3 4 4a1.5 1.5 0 0 0 2.1 0L22 15a1.5 1.5 0 0 0 0-2Z" />
      <path d="M9 12l3 3 3-3" />
      <path d="M9 12l-2-2 4-4 3 3" />
    </>
  ))
}

export function SwapIcon({ size = 18, className = '' }: Props) {
  return svg(size, className, (
    <>
      <path d="M4 7h13l-3-3" />
      <path d="M20 17H7l3 3" />
    </>
  ))
}

export function ClipboardIcon({ size = 18, className = '' }: Props) {
  return svg(size, className, (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="M9 12h6M9 16h4" />
    </>
  ))
}

export function CalendarIcon({ size = 18, className = '' }: Props) {
  return svg(size, className, (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ))
}

export function PlusIcon({ size = 18, className = '' }: Props) {
  return svg(size, className, (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ))
}

export function UserPlusIcon({ size = 18, className = '' }: Props) {
  return svg(size, className, (
    <>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M3 20c1.4-3.4 3.5-5 6-5s4.6 1.6 6 5" />
      <path d="M18 6v6M21 9h-6" />
    </>
  ))
}

export function PinIcon({ size = 12, className = '' }: Props) {
  return svg(size, className, (
    <>
      <path d="M12 21s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.4" />
    </>
  ))
}

export function PencilIcon({ size = 16, className = '' }: Props) {
  return svg(size, className, (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </>
  ))
}

export function TrashIcon({ size = 16, className = '' }: Props) {
  return svg(size, className, (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ))
}
