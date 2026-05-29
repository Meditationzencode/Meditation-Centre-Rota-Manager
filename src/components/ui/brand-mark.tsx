type Props = {
  size?: number
  className?: string
  withRing?: boolean
}

export default function BrandMark({ size = 22, className = '', withRing = true }: Props) {
  const inner = size * 0.62
  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${
        withRing ? 'rounded-full border border-gold-400/70' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={inner}
        height={inner}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#b59a5b"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 4c1.6 2.6 1.6 6.4 0 9-1.6-2.6-1.6-6.4 0-9Z" />
        <path d="M5 9c2.8.6 5.4 2.8 6.5 5.3C8.7 13.7 6.1 11.5 5 9Z" />
        <path d="M19 9c-2.8.6-5.4 2.8-6.5 5.3 2.8-.6 5.4-2.8 6.5-5.3Z" />
        <path d="M4 15c2.8 1.6 6 2 8 1-2 1-5.2.6-8-1Z" />
        <path d="M20 15c-2.8 1.6-6 2-8 1 2 1 5.2.6 8-1Z" />
      </svg>
    </span>
  )
}
