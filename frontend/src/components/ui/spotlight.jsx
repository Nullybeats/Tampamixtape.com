import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Decorative aurora/spotlight backdrop. Absolutely positioned, non-interactive.
 * Pure CSS washes (see .aurora in index.css) plus a couple of slow-drifting blobs.
 * Place as the first child of a `relative overflow-hidden` section.
 */
export function AuroraBackground({ className, soft = false }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div className={cn('absolute inset-0', soft ? 'aurora-soft' : 'aurora')} />
      <div className="absolute -top-24 left-1/4 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px] animate-pulse-slow" />
      <div className="absolute top-1/3 right-1/5 h-96 w-96 rounded-full bg-primary/5 blur-[120px] animate-pulse-slow [animation-delay:1s]" />
      {/* top edge fade so the wash melts into the page */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

/**
 * Mouse-following radial spotlight on hover. Wrap any card/row.
 * Renders as a plain div so it composes with existing Card styling.
 */
export function SpotlightCard({
  children,
  className,
  contentClassName,
  color = 'rgba(255, 101, 108, 0.14)',
  size = 380,
  as: Tag = 'div',
  ...props
}) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)

  const handleMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={cn('group/spot relative overflow-hidden', className)}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 60%)`,
        }}
      />
      {/* Inner layer carries the consumer's layout (flex/grid/padding) so it
          isn't collapsed by the wrapper. z-10 keeps content above the spotlight. */}
      <div className={cn('relative z-10', contentClassName)}>{children}</div>
    </Tag>
  )
}
