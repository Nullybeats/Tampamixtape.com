import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Flame,
  Sparkles,
  Music,
  Users,
  ArrowUpRight,
  Clock,
  Loader2,
  ChevronRight,
} from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num?.toLocaleString() || '0'
}

function formatTimeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function TrendingArtistCard({ artist, rank, index }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
      onClick={() => artist.profileSlug && navigate(`/${artist.profileSlug}`)}
    >
      <span className={`w-6 text-center font-bold ${
        rank <= 3 ? 'text-yellow-500' : 'text-muted-foreground'
      }`}>
        {rank}
      </span>

      {artist.avatar ? (
        <img
          src={artist.avatar}
          alt={artist.artistName}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary transition-all"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
          <Music className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate group-hover:text-primary transition-colors">
          {artist.artistName}
        </h4>
        <p className="text-sm text-muted-foreground truncate">
          {artist.genres?.split(',')[0] || 'Artist'}
        </p>
      </div>

      <div className="text-right hidden sm:block">
        <div className="flex items-center gap-1 text-sm font-medium text-primary">
          <TrendingUp className="w-4 h-4" />
          {artist.popularity}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatNumber(artist.followers)} followers
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  )
}

function ActivityItem({ activity, index }) {
  const navigate = useNavigate()

  const getIcon = () => {
    switch (activity.type) {
      case 'release':
        return <Music className="w-4 h-4" />
      case 'trending':
        return <TrendingUp className="w-4 h-4" />
      case 'new_artist':
        return <Sparkles className="w-4 h-4" />
      default:
        return <Flame className="w-4 h-4" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
      onClick={() => activity.profileSlug && navigate(`/${activity.profileSlug}`)}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        activity.type === 'release' ? 'bg-primary/20 text-primary' :
        activity.type === 'trending' ? 'bg-yellow-500/20 text-yellow-500' :
        'bg-blue-500/20 text-blue-500'
      }`}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.artistName}</span>
          {' '}
          <span className="text-muted-foreground">{activity.message}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTimeAgo(activity.timestamp)}
        </p>
      </div>

      {activity.image && (
        <img
          src={activity.image}
          alt=""
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
      )}
    </motion.div>
  )
}

export function TrendingSection() {
  const navigate = useNavigate()
  const [trendingArtists, setTrendingArtists] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top artists and recent releases in parallel
        const [artistsRes, releasesRes] = await Promise.all([
          fetch(`${API_URL}/api/artists/hot100?limit=50`),
          fetch(`${API_URL}/api/releases?limit=10`),
        ])

        const artistsData = await artistsRes.json()
        const releasesData = await releasesRes.json()

        // Get top 5 trending artists
        const artists = artistsData.artists || []
        setTrendingArtists(artists.slice(0, 5))

        // Build activity feed from releases
        const releases = releasesData.releases || []
        const activityItems = releases.slice(0, 6).map(release => ({
          type: 'release',
          artistName: release.artistName,
          message: `dropped "${release.name}"`,
          timestamp: release.releaseDate,
          image: release.image,
          profileSlug: release.artistSlug,
        }))

        // Add some "trending" activities from top artists
        const trendingActivities = artists.slice(0, 3).map(artist => ({
          type: 'trending',
          artistName: artist.artistName,
          message: `is trending in Tampa #${artists.indexOf(artist) + 1}`,
          timestamp: new Date().toISOString(),
          image: artist.avatar,
          profileSlug: artist.profileSlug,
        }))

        // Merge and sort by timestamp
        const allActivities = [...activityItems, ...trendingActivities]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 6)

        setActivities(allActivities)
      } catch (error) {
        console.error('Error fetching trending data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
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
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Trending <span className="text-gradient">Right Now</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See what's happening in the Tampa Bay music scene. Real-time activity and rising stars.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Trending Artists */}
          <Card>
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
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Activity Feed
                </span>
                <Badge variant="secondary" className="text-xs">
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
