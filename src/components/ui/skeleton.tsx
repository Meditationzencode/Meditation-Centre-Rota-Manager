type Props = {
  className?: string
  /** Renders as inline-block so it sits inside a line of text. */
  inline?: boolean
}

/** Pulsing sand-tone block used inside route loading skeletons. */
export default function Skeleton({ className = '', inline = false }: Props) {
  return (
    <span
      aria-hidden
      className={`${inline ? 'inline-block align-middle' : 'block'} bg-sand/50 animate-pulse rounded ${className}`}
    />
  )
}
