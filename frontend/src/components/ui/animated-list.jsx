import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Staggered scroll-reveal list. Children slide/fade in one after another when
 * the list scrolls into view. Reinforces a "live" feed feel.
 *
 * @param {number} stagger  delay between items (seconds)
 * @param {number} delay    initial delay before the first item (seconds)
 */
export function AnimatedList({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  as: Tag = 'div',
}) {
  const MotionTag = motion[Tag] || motion.div
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
        hidden: {},
      }}
    >
      {children}
    </MotionTag>
  )
}

export function AnimatedListItem({ children, className, as: Tag = 'div' }) {
  const MotionTag = motion[Tag] || motion.div
  return (
    <MotionTag
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
        visible: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </MotionTag>
  )
}
