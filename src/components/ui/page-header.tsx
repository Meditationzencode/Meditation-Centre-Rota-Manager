import BrandMark from './brand-mark'

type Props = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  maxWidth?: 'max-w-6xl' | 'max-w-7xl' | 'max-w-5xl'
  /** Show the small lotus mark beside the title (default true). */
  withMark?: boolean
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  maxWidth = 'max-w-6xl',
  withMark = true,
}: Props) {
  return (
    <div className={`${maxWidth} mx-auto px-5 pt-8 pb-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {withMark && <BrandMark size={20} withRing={false} />}
            <h1 className="font-serif text-3xl font-medium text-ink leading-none">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-ink/55 text-sm mt-2 ml-[30px]">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-4 h-px bg-gradient-to-r from-gold-400/60 via-sand to-transparent" />
    </div>
  )
}
