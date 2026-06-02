// Monoline icon set for the portal shell + dashboard.
// Ported from the design handoff (design_handoff_dashboard/icons.jsx);
// strokes inherit currentColor so they tint with the palette.

export type IconProps = { size?: number; sw?: number; className?: string }
export type IconComponent = (props: IconProps) => React.JSX.Element

type Props = IconProps

const base = {
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function Svg({ size = 24, sw = 1.6, className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={sw} className={className} {...base}>
      {children}
    </svg>
  )
}

/* ---- sidebar nav ---- */
export const IconHome = (p: Props) => (
  <Svg {...p}><path d="M4 11l8-7 8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></Svg>
)
export const IconTeam = (p: Props) => (
  <Svg {...p}><circle cx="8" cy="9" r="2.6" /><circle cx="16" cy="9" r="2.6" /><path d="M3.5 18a4.5 4.5 0 0 1 9 0M11.5 18a4.5 4.5 0 0 1 9 0" /></Svg>
)
export const IconChat = (p: Props) => (
  <Svg {...p}><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16H9l-4 3.5V6.5A1.5 1.5 0 0 1 5 5z" /></Svg>
)
export const IconBook = (p: Props) => (
  <Svg {...p}><path d="M12 6.2C9.8 4.9 7.3 4.7 4.8 5.2v12c2.5-.5 5-.3 7.2 1 2.2-1.3 4.7-1.5 7.2-1v-12c-2.5-.5-5-.3-7.2 1z" /><path d="M12 6.2V18" /></Svg>
)
export const IconChart = (p: Props) => (
  <Svg {...p}><path d="M4 4v16h16" /><path d="M8 15v2.5M12 10.5V17.5M16 6.5V17.5" /></Svg>
)
export const IconGear = (p: Props) => (
  <Svg {...p}><circle cx="12" cy="12" r="3.1" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M18.9 5.1l-2.1 2.1M7.2 16.8l-2.1 2.1" /></Svg>
)
export const IconChevD = ({ size = 18, sw = 1.8, className }: Props) => (
  <Svg size={size} sw={sw} className={className}><path d="M5 9l7 7 7-7" /></Svg>
)

/* ---- duty / feature ---- */
export const IconCalendar = (p: Props) => (
  <Svg {...p}><rect x="3.5" y="4.5" width="17" height="16" rx="2.5" /><path d="M3.5 9h17M8 2.5v4M16 2.5v4" /><circle cx="8.5" cy="13.5" r="1.1" fill="currentColor" stroke="none" /><circle cx="12" cy="13.5" r="1.1" fill="currentColor" stroke="none" /></Svg>
)
export const IconCalEx = (p: Props) => (
  <Svg {...p}><rect x="3.5" y="4.5" width="17" height="16" rx="2.5" /><path d="M3.5 9h17M8 2.5v4M16 2.5v4M12 12v5M9.5 14.5L12 17l2.5-2.5" /></Svg>
)
export const IconUsers = (p: Props) => (
  <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 5.6M17 14.2a5.5 5.5 0 0 1 3.5 4.8" /></Svg>
)
export const IconLeaf = (p: Props) => (
  <Svg {...p}><path d="M5 19c0-8 6-13 14-14 0 9-5 15-14 14z" /><path d="M5 19c3-4 6-6 9-7" /></Svg>
)
export const IconCheck = (p: Props) => (
  <Svg {...p}><path d="M5 12.5l4.5 4.5L19 6.5" /></Svg>
)
export const IconClock = (p: Props) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>
)
export const IconRepeat = (p: Props) => (
  <Svg {...p}><path d="M4 9a6 6 0 0 1 10-4l2.5 2M20 15a6 6 0 0 1-10 4l-2.5-2" /><path d="M16.5 3.5V7H13M7.5 20.5V17H11" /></Svg>
)
export const IconBell = (p: Props) => (
  <Svg {...p}><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9zM10 20a2 2 0 0 0 4 0" /></Svg>
)
export const IconSearch = (p: Props) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></Svg>
)
export const IconPlus = (p: Props) => (
  <Svg {...p}><path d="M12 5.5v13M5.5 12h13" /></Svg>
)
export const IconSend = (p: Props) => (
  <Svg {...p}><path d="M21 3L3 10.6l6.6 2.5L12 20l3.2-9L21 3z" /><path d="M9.6 13.1L21 3" /></Svg>
)
export const IconMega = (p: Props) => (
  <Svg {...p}><path d="M5 9.5v5l9 4V5.5l-9 4z" /><path d="M5 9.5H3.6a1.5 1.5 0 0 0 0 5H5" /><path d="M17.5 9.5a3 3 0 0 1 0 5" /><path d="M7 15.5l1 4.5" /></Svg>
)
export const IconHeart = (p: Props) => (
  <Svg {...p}><path d="M12 20s-7-4.5-7-9.6A3.6 3.6 0 0 1 12 7a3.6 3.6 0 0 1 7 3.4C19 15.5 12 20 12 20z" /></Svg>
)
export const IconClipCheck = (p: Props) => (
  <Svg {...p}><rect x="5" y="4.5" width="14" height="16" rx="2.2" /><path d="M9 4.5a3 3 0 0 1 6 0" /><path d="M8.8 12.2l1.8 1.8 3.6-3.6" /></Svg>
)
export const IconSunrise = (p: Props) => (
  <Svg {...p}><path d="M3 18.5h18" /><path d="M7 18.5a5 5 0 0 1 10 0" /><path d="M12 3.5v3M5 8l1.6 1.6M19 8l-1.6 1.6" /></Svg>
)
export const IconSunset = (p: Props) => (
  <Svg {...p}><path d="M3 18.5h18" /><path d="M7 18.5a5 5 0 0 1 10 0" /><path d="M12 9.5V3.5M9 6.5l3 3 3-3" /></Svg>
)
export const IconCup = (p: Props) => (
  <Svg {...p}><path d="M5 8.5h11v4a5.5 5.5 0 0 1-11 0z" /><path d="M16 9.5h2a2 2 0 0 1 0 4h-2" /><path d="M4 20.5h13" /></Svg>
)
export const IconSwap = (p: Props) => (
  <Svg {...p}><path d="M4 8h13l-3-3M20 16H7l3 3" /></Svg>
)
export const IconArrowR = ({ size = 18, sw = 1.7, className }: Props) => (
  <Svg size={size} sw={sw} className={className}><path d="M4 12h15M13 6l6 6-6 6" /></Svg>
)
export const IconChevR = ({ size = 18, sw = 1.8, className }: Props) => (
  <Svg size={size} sw={sw} className={className}><path d="M9 5l7 7-7 7" /></Svg>
)

// Hand-drawn lotus mark (five petals + waterline) — shared with the login scene.
export const Lotus = ({ size = 28 }: { size?: number }) => (
  <svg viewBox="0 0 64 56" width={size} height={(size * 56) / 64}
       fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 12c-4 6-4 16 0 30 4-14 4-24 0-30z" />
    <path d="M32 42C24 34 19 24 19 16c6 2 11 9 13 18z" />
    <path d="M32 42c8-8 13-18 13-26-6 2-11 9-13 18z" />
    <path d="M32 42C20 40 11 33 7 25c7-1 16 4 25 13z" />
    <path d="M32 42c12-2 21-9 25-17-7-1-16 4-25 13z" />
    <path d="M12 46c5 3 10 4 20 4s15-1 20-4" opacity=".55" />
  </svg>
)
