import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AuroraBackground } from '@/components/ui/spotlight'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { LiveRankingsCard } from '@/components/landing/LiveRankingsCard'
import { HeroAlbumWall } from '@/components/landing/HeroAlbumWall'
import {
  Users,
  Play,
  ArrowRight,
  Sparkles,
  Disc3,
  Music
} from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export function Hero({ stats: propStats, artists: propArtists, releases: propReleases }) {
  const navigate = useNavigate()
  const [platformStats, setPlatformStats] = useState({
    artistCount: 0,
    albumCount: 0,
    singleCount: 0,
    totalFollowers: 0,
  })
  const [statsLoaded, setStatsLoaded] = useState(false)
  // Resolve artists/releases from props, falling back to self-fetch so the
  // album wall + Live Rankings card populate even when /api/landing is absent.
  const [artists, setArtists] = useState(propArtists || [])
  const [releases, setReleases] = useState(propReleases || [])

  useEffect(() => {
    if (propArtists?.length) setArtists(propArtists)
    if (propReleases?.length) setReleases(propReleases)
    if (propStats) {
      setPlatformStats({
        artistCount: propStats.artistCount || 0,
        albumCount: propStats.albums || 0,
        singleCount: propStats.singles || 0,
        totalFollowers: propStats.totalFollowers || 0,
      })
      setStatsLoaded(true)
    }

    const needArtists = !propArtists?.length
    const needReleases = !propReleases?.length
    const needStats = !propStats
    if (!needArtists && !needReleases && !needStats) return

    const fetchFallback = async () => {
      try {
        const [artistsRes, statsRes, releasesRes] = await Promise.all([
          fetch(`${API_URL}/api/artists/hot100?limit=100`),
          fetch(`${API_URL}/api/releases/stats`),
          fetch(`${API_URL}/api/releases?limit=24`),
        ])

        const artistsData = await artistsRes.json()
        const statsData = await statsRes.json()
        const releasesData = await releasesRes.json()

        const fetchedArtists = artistsData.artists || []
        const fetchedReleases = releasesData.releases || []

        if (needArtists) setArtists(fetchedArtists)
        if (needReleases) setReleases(fetchedReleases)
        if (needStats) {
          const totalFollowers = fetchedArtists.reduce((sum, a) => sum + (a.followers || 0), 0)
          setPlatformStats({
            artistCount: fetchedArtists.length,
            albumCount: statsData.albums || 0,
            singleCount: statsData.singles || 0,
            totalFollowers,
          })
        }
        setStatsLoaded(true)
      } catch (error) {
        console.error('Failed to load hero data:', error)
        if (needStats) {
          setPlatformStats({
            artistCount: 50,
            albumCount: 120,
            singleCount: 350,
            totalFollowers: 2500000,
          })
        }
        setStatsLoaded(true)
      }
    }

    fetchFallback()
  }, [propStats, propArtists, propReleases])

  const stats = useMemo(() => [
    { label: 'Artists', value: platformStats.artistCount || 50, suffix: '+', icon: Users },
    { label: 'Albums', value: platformStats.albumCount || 120, suffix: '+', icon: Disc3 },
    { label: 'Singles', value: platformStats.singleCount || 350, suffix: '+', icon: Music },
    { label: 'Followers', value: platformStats.totalFollowers || 2500000, suffix: '+', icon: Play },
  ], [platformStats])

  const fade = (delay) => ({
    initial: { opacity: 0, y: 24, filter: 'blur(6px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  })

  // Album covers (Apple Music artwork) already in the feed — releases first, avatars fill in.
  const albumImages = [
    ...(releases || []).map((r) => r?.image),
    ...(artists || []).map((a) => a?.avatar),
  ]

  return (
    <section className="relative overflow-hidden pt-28 pb-24 sm:pt-32">
      <HeroAlbumWall images={albumImages} />
      <AuroraBackground soft />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Eyebrow */}
          <motion.div {...fade(0.05)}>
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Real-time music analytics for Tampa Bay
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            {...fade(0.15)}
            className="mt-7 font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-extrabold leading-[0.95] tracking-[-0.03em]"
          >
            Track Tampa&rsquo;s
            <br />
            <span className="text-gradient">rising stars.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fade(0.25)}
            className="mt-7 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed"
          >
            Discover Tampa Bay&rsquo;s hottest artists. Live rankings, new
            releases, and music discovery&nbsp;&mdash;&nbsp;powered by Apple Music.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            {...fade(0.35)}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button size="xl" className="gap-2" onClick={() => navigate('/artists')}>
              <Users className="w-5 h-5" />
              Explore Artists
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="xl" className="gap-2" onClick={() => navigate('/releases')}>
              <Disc3 className="w-5 h-5" />
              View Releases
            </Button>
          </motion.div>

          {/* Hero product visual — Live Rankings card on a glowing pedestal */}
          <motion.div {...fade(0.45)} className="mt-16 w-full">
            <LiveRankingsCard artists={artists} />
          </motion.div>

          {/* Metric row (previously computed but never rendered) */}
          <motion.div
            {...fade(0.55)}
            className="mt-20 grid grid-cols-2 sm:grid-cols-4 w-full max-w-3xl overflow-hidden rounded-2xl glass divide-x divide-y sm:divide-y-0 divide-white/5"
          >
            {stats.map(({ label, value, suffix }) => (
              <div key={label} className="flex flex-col items-center gap-1 px-4 py-5">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
                  {statsLoaded ? <AnimatedNumber value={value} suffix={suffix} /> : '—'}
                </span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
