import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Play,
  ArrowRight,
  Sparkles,
  Disc3,
  Music
} from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

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

export function Hero({ stats: propStats, artists: propArtists }) {
  const navigate = useNavigate()
  const [platformStats, setPlatformStats] = useState({
    artistCount: 0,
    albumCount: 0,
    singleCount: 0,
    totalFollowers: 0,
  })
  const [statsLoaded, setStatsLoaded] = useState(false)

  // Use props from landing endpoint if available, otherwise fetch
  useEffect(() => {
    if (propStats) {
      setPlatformStats({
        artistCount: propStats.artistCount || 0,
        albumCount: propStats.albums || 0,
        singleCount: propStats.singles || 0,
        totalFollowers: propStats.totalFollowers || 0,
      })
      setStatsLoaded(true)
      return
    }

    const fetchStats = async () => {
      try {
        const [artistsRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/artists/hot100?limit=100`),
          fetch(`${API_URL}/api/releases/stats`),
        ])

        const artistsData = await artistsRes.json()
        const statsData = await statsRes.json()

        const artists = artistsData.artists || []
        const totalFollowers = artists.reduce((sum, a) => sum + (a.followers || 0), 0)

        setPlatformStats({
          artistCount: artists.length,
          albumCount: statsData.albums || 0,
          singleCount: statsData.singles || 0,
          totalFollowers,
        })
        setStatsLoaded(true)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        setPlatformStats({
          artistCount: 50,
          albumCount: 120,
          singleCount: 350,
          totalFollowers: 2500000,
        })
        setStatsLoaded(true)
      }
    }

    fetchStats()
  }, [propStats])

  const stats = useMemo(() => [
    { label: 'Artists', value: platformStats.artistCount || 50, suffix: '+', icon: Users },
    { label: 'Albums Released', value: platformStats.albumCount || 120, suffix: '+', icon: Disc3 },
    { label: 'Singles Released', value: platformStats.singleCount || 350, suffix: '+', icon: Music },
    { label: 'Total Followers', value: platformStats.totalFollowers || 2500000, suffix: '+', icon: Play },
  ], [platformStats])

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/3 to-transparent rounded-full" />
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
            className="font-display text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight uppercase"
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
            Discover Tampa Bay's hottest artists. Artist rankings, new releases,
            and music discovery powered by Spotify.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" className="gap-2 glow-green" onClick={() => navigate('/artists')}>
              <Users className="w-5 h-5" />
              Explore Artists
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="xl" className="gap-2" onClick={() => navigate('/releases')}>
              <Disc3 className="w-5 h-5" />
              View Releases
            </Button>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
