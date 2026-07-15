import { cn } from '@/lib/utils'

/**
 * Infinite horizontal marquee. Duplicates children once so the loop is seamless.
 * Pauses on hover; respects prefers-reduced-motion (via .animate-marquee in index.css).
 *
 * @param {number} speed  seconds for one full loop (lower = faster)
 * @param {boolean} reverse  scroll right-to-left when false, left-to-right when true
 */
export function Marquee({
  children,
  speed = 40,
  reverse = false,
  className,
  fade = true,
}) {
  return (
    <div
      className={cn(
        'group relative flex w-full overflow-hidden',
        fade &&
          '[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]',
        className
      )}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className={cn(
            'flex shrink-0 items-center gap-4 pr-4 group-hover:[animation-play-state:paused]',
            reverse ? 'animate-marquee-reverse' : 'animate-marquee'
          )}
          style={{ '--marquee-duration': `${speed}s` }}
        >
          {children}
        </div>
      ))}
    </div>
  )
}
