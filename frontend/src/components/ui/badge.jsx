import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-500/20 text-green-400',
        warning: 'border-transparent bg-yellow-500/20 text-yellow-400',
        spotify: 'border-transparent bg-[#1db954]/20 text-[#1db954]',
        apple: 'border-transparent bg-[#fa243c]/20 text-[#fa243c]',
        youtube: 'border-transparent bg-[#ff0000]/20 text-[#ff0000]',
        soundcloud: 'border-transparent bg-[#ff5500]/20 text-[#ff5500]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
