import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SpotlightCard } from '@/components/ui/spotlight'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { TierBadge } from '@/components/ui/tier-badge'
import {
  TrendingUp,
  Flame,
  Sparkles,
  Music,
  Users,
  ArrowUpRight,
  Loader2,
} from 'lucide-react'
import { ActivityItem } from '@/components/feed'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

function TrendingArtistCard({ artist, rank, index }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <SpotlightCard
        onClick={() => artist.profileSlug && navigate(`/${artist.profileSlug}`)}
        className="group rounded-lg cursor-pointer transition-colors hover:bg-white/[0.03]"
        contentClassName="flex items-center gap-3 px-2.5 py-2"
      >
        <span className={`font-display w-6 text-center text-base font-bold tabular-nums ${
          rank <= 3 ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {rank}
        </span>

        {artist.avatar ? (
          <img
            src={artist.avatar}
            alt={artist.artistName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-primary transition-all"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Music className="w-5 h-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {artist.artistName}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {artist.genres?.split(',')[0] || 'Artist'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <TierBadge tier={artist.demandScoreTier} variant="dot" className="hidden sm:inline-flex" />
          <div className="w-9 text-right font-mono text-base font-bold tabular-nums text-primary">
            <AnimatedNumber value={artist.demandScore || 0} format={false} />
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  )
}

export function TrendingSection({ artists: propArtists, releases: propReleases }) {
  const navigate = useNavigate()
  const [trendingArtists, setTrendingArtists] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If props are provided, use them directly
    if (propArtists && propReleases) {
      setTrendingArtists(propArtists)
      buildActivities(propArtists, propReleases)
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const [artistsRes, releasesRes] = await Promise.all([
          fetch(`${API_URL}/api/artists/hot100?limit=50`),
          fetch(`${API_URL}/api/releases?limit=10`),
        ])

        const artistsData = await artistsRes.json()
        const releasesData = await releasesRes.json()

        const artists = artistsData.artists || []
        const releases = releasesData.releases || []
        setTrendingArtists(artists.slice(0, 5))
        buildActivities(artists, releases)
      } catch (error) {
        console.error('Error fetching trending data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [propArtists, propReleases])

  function buildActivities(artists, releases) {
    const activityItems = releases.slice(0, 6).map(release => ({
      type: 'release',
      artistName: release.artistName,
      message: `dropped "${release.name}"`,
      timestamp: release.releaseDate,
      image: release.image,
      profileSlug: release.artistSlug,
    }))

    const trendingActivities = artists.slice(0, 3).map((artist, idx) => ({
      type: 'trending',
      artistName: artist.artistName,
      message: `is trending in Tampa #${idx + 1}`,
      timestamp: new Date().toISOString().split('T')[0],
      image: artist.avatar,
      profileSlug: artist.profileSlug,
    }))

    const allActivities = [...activityItems, ...trendingActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6)

    setActivities(allActivities)
  }

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    )
  }

  return (
    <section className="relative py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">
            <Flame className="w-4 h-4 mr-1 text-orange-500" />
            What's Hot
          </Badge>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mb-4 tracking-[-0.02em]">
            Trending <span className="text-gradient">right now</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See what's happening in the Tampa Bay music scene. Real-time activity and rising stars.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Trending Artists */}
          <Card className="bg-card/60 backdrop-blur-xl border-white/5 elev-2 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  This Week's Hot Artists
                </span>
                <Button variant="ghost" size="sm" onClick={() => navigate('/artists')}>
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {trendingArtists.length > 0 ? (
                <div className="space-y-1">
                  {trendingArtists.map((artist, index) => (
                    <TrendingArtistCard
                      key={artist.id}
                      artist={artist}
                      rank={index + 1}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No trending artists yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-card/60 backdrop-blur-xl border-white/5 elev-2 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Activity Feed
                </span>
                <Badge variant="secondary" className="text-xs gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {activities.length > 0 ? (
                <div className="space-y-1">
                  {activities.map((activity, index) => (
                    <ActivityItem
                      key={`${activity.artistName}-${index}`}
                      activity={activity}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
