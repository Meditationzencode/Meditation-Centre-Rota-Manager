// Monoline icons + hand-drawn lotus for the login scene.
// Lifted from the design handoff; strokes inherit currentColor.

type IconProps = { size?: number; sw?: number }

const base = {
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const IconMail = ({ size = 18, sw = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M4 7.5l8 5.5 8-5.5" />
  </svg>
)

export const IconLock = ({ size = 17, sw = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
)

export const IconEye = ({ size = 18, sw = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const IconEyeOff = ({ size = 18, sw = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <path d="M3 3l18 18M10.6 6.2A9.7 9.7 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4-.85M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
)

export const IconAlert = ({ size = 13, sw = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16h.01" />
  </svg>
)

export const IconCheck = ({ size = 17, sw = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <path d="M5 12.5l4.5 4.5L19 6.5" />
  </svg>
)

export const IconArrowR = ({ size = 18, sw = 1.7 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
)

export const IconChevR = ({ size = 16, sw = 1.8 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <path d="M9 5l7 7-7 7" />
  </svg>
)

export const IconCrown = ({ size = 20, sw = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <path d="M4 18l-1.5-9 5.5 4.5L12 5l4 8.5L21.5 9 20 18z" />
    <path d="M4 18h16" />
  </svg>
)

export const IconUsers = ({ size = 20, sw = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 5.6M17 14.2a5.5 5.5 0 0 1 3.5 4.8" />
  </svg>
)

export const IconDrop = ({ size = 20, sw = 1.6 }: IconProps) => (
  <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} {...base}>
    <path d="M12 3.5c3.5 4.2 6 7.3 6 10.2a6 6 0 0 1-12 0c0-2.9 2.5-6 6-10.2z" />
  </svg>
)

// Hand-drawn lotus mark. Five petals + waterline.
export const Lotus = ({ size = 28 }: { size?: number }) => {
  const stroke = 1.5
  return (
    <svg viewBox="0 0 64 56" width={size} height={(size * 56) / 64}
         fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 12c-4 6-4 16 0 30 4-14 4-24 0-30z" />
      <path d="M32 42C24 34 19 24 19 16c6 2 11 9 13 18z" />
      <path d="M32 42c8-8 13-18 13-26-6 2-11 9-13 18z" />
      <path d="M32 42C20 40 11 33 7 25c7-1 16 4 25 13z" />
      <path d="M32 42c12-2 21-9 25-17-7-1-16 4-25 13z" />
      <path d="M12 46c5 3 10 4 20 4s15-1 20-4" opacity=".55" />
    </svg>
  )
}
