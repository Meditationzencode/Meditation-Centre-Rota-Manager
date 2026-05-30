import BrandMark from './brand-mark'

type Props = {
  title: string
  body?: string
  cta?: React.ReactNode
  /** Pad less vertically when used inside a small card. */
  compact?: boolean
}

/**
 * Standard empty-state block: faint lotus glyph, serif title, ink-65 body,
 * optional CTA. Sits on a sand-dashed card so empty space reads as intentional
 * rather than missing.
 */
export default function EmptyState({ title, body, cta, compact = false }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center bg-paper-50/60 border border-dashed border-sand rounded-xl ${
        compact ? 'py-8 px-6' : 'py-14 px-6'
      }`}
    >
      <span className="opacity-40 mb-3">
        <BrandMark size={48} withRing={false} />
      </span>
      <h3 className="font-serif text-lg font-medium text-ink">{title}</h3>
      {body && <p className="text-sm text-ink/65 mt-1 max-w-sm">{body}</p>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  )
}
