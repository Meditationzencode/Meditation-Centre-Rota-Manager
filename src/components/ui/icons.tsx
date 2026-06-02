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
