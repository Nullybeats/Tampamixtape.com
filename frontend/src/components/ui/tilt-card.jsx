import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Lightweight 3D tilt on hover — no 3D library. Tracks the pointer and applies a
 * subtle perspective rotation + lift. Disabled under prefers-reduced-motion and
 * on touch (no hover). Composes with any card content.
 *
 * @param {number} max  maximum tilt in degrees
 */
export function TiltCard({ children, className, max = 7, ...props }) {
  const ref = useRef(null)
  const [style, setStyle] = useState({})

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const handleMove = (e) => {
    if (prefersReduced) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setStyle({
      transform: `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-4px)`,
    })
  }

  const reset = () => setStyle({})

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.25s ease-out', ...style }}
      className={cn('will-change-transform', className)}
      {...props}
    >
      {children}
    </div>
  )
}
