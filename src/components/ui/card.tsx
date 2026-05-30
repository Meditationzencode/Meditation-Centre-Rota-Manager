import type { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  /** When true, also clip overflow at the rounded corners. */
  clip?: boolean
}

/**
 * Standard surface chrome used for content cards across the app.
 * White fill, soft sand border, gentle shadow, rounded-xl corners.
 */
export default function Card({ clip = false, className = '', ...rest }: Props) {
  return (
    <div
      className={`bg-white border border-sand/70 rounded-xl shadow-sm ${clip ? 'overflow-hidden' : ''} ${className}`}
      {...rest}
    />
  )
}
