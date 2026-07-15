import { cn } from '@/lib/utils'

const TIERS = {
  breakout: { label: 'Breakout', text: 'text-red-400', dot: 'bg-red-400' },
  trending: { label: 'Trending', text: 'text-orange-400', dot: 'bg-orange-400' },
  radar: { label: 'Radar', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  building: { label: 'Building', text: 'text-sky-400', dot: 'bg-sky-400' },
  emerging: { label: 'Emerging', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  seed: { label: 'Seed', text: 'text-emerald-400', dot: 'bg-emerald-400' },
}

/**
 * Compact demand-score tier chip: a colored status dot + label.
 * `variant="dot"` renders just the dot + label (no pill) for tight spots.
 */
export function TierBadge({ tier, className, variant = 'pill' }) {
  if (!tier) return null
  const t = TIERS[tier] || { label: tier, text: 'text-muted-foreground', dot: 'bg-muted-foreground' }

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium', t.text, className)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} />
        {t.label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium ring-1 ring-white/5',
        t.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} />
      {t.label}
    </span>
  )
}
