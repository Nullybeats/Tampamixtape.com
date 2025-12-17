import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  Play,
  ArrowRight,
  Sparkles,
  BarChart3,
  Users,
  Music
} from 'lucide-react'

function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

function AnimatedNumber({ value, suffix = '' }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <span>
      {formatNumber(count)}{suffix}
    </span>
  )
}

export function Hero() {
  const stats = [
    { label: 'Artists Tracked', value: 2847, icon: Users },
    { label: 'Total Streams', value: 1200000000, suffix: '+', icon: Play },
    { label: 'Chart Updates', value: 24, suffix: '/day', icon: BarChart3 },
    { label: 'New Releases', value: 150, suffix: '/week', icon: Music },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Badge variant="outline" className="px-4 py-1.5 gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              Real-time music analytics for Tampa Bay artists
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
          >
            Track Tampa's
            <br />
            <span className="text-gradient">Rising Stars</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            The definitive source for Tampa Bay music analytics. Real-time charts,
            streaming data, and discovery tools powered by Spotify, Apple Music,
            YouTube, and more.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" className="gap-2 glow-green">
              <TrendingUp className="w-5 h-5" />
              Explore Charts
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="xl" className="gap-2">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="glass rounded-xl p-6 text-center hover:glow-green-sm transition-shadow"
                >
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-gradient">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ height: ['20%', '80%', '20%'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 bg-primary rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
