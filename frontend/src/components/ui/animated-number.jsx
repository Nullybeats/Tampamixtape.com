import { useEffect, useRef, useState } from 'react'

export function formatNumber(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toLocaleString()
}

/**
 * Count-up number that animates the first time it scrolls into view.
 * Respects prefers-reduced-motion (jumps straight to the value).
 *
 * @param {number} value    target value
 * @param {string} suffix   trailing string (e.g. '+')
 * @param {boolean} format  compact K/M/B formatting (default true)
 */
export function AnimatedNumber({ value = 0, suffix = '', format = true, duration = 1600 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setCount(value)
      return
    }

    const run = () => {
      if (started.current) return
      started.current = true
      const steps = 60
      const increment = value / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(current)
        }
      }, duration / steps)
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration])

  const display = format ? formatNumber(Math.floor(count)) : Math.round(count).toLocaleString()

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  )
}
