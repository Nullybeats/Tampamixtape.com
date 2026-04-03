import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Crown,
  Medal,
  Award,
  ExternalLink,
  Music,
  Users,
  Loader2,
  TrendingUp,
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

function getRankIcon(rank) {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-hot" />
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />
    case 3:
      return <Award className="w-5 h-5 text-hot/70" />
    default:
      return null
  }
}

function ArtistRow({ artist, index }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onClick={() => artist.profileSlug && navigate(`/${artist.profileSlug}`)}
      className={`group flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${
        artist.rank <= 3 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/50'
      }`}
    >
      {/* Rank */}
      <div className="w-14 text-center">
        <div className="flex items-center justify-center gap-1">
          {getRankIcon(artist.rank)}
          <span className={`font-display text-3xl font-bold ${artist.rank <= 3 ? 'text-gradient-hot' : 'text-muted-foreground'}`}>
            {artist.rank}
          </span>
        </div>
      </div>

      {/* Artist Image */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
        {artist.avatar ? (
          <img
            src={artist.avatar}
            alt={artist.artistName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
          {artist.artistName}
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          {artist.genres && (
            <span className="text-sm text-muted-foreground truncate">
              {artist.genres.split(',')[0]}
            </span>
          )}
          {artist.region && (
            <Badge variant="secondary" className="text-xs">
              {artist.region}
            </Badge>
          )}
        </div>
      </div>

      {/* Demand Score */}
      <div className="hidden md:flex items-center gap-4 text-sm">
        {artist.demandScoreTier && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            artist.demandScoreTier === 'breakout' ? 'bg-red-500/20 text-red-400' :
            artist.demandScoreTier === 'trending' ? 'bg-orange-500/20 text-orange-400' :
            artist.demandScoreTier === 'radar' ? 'bg-yellow-500/20 text-yellow-400' :
            artist.demandScoreTier === 'building' ? 'bg-blue-500/20 text-blue-400' :
            'bg-muted text-muted-foreground'
          }`}>
            {artist.demandScoreTier === 'breakout' ? '🔥' :
             artist.demandScoreTier === 'trending' ? '📈' :
             artist.demandScoreTier === 'radar' ? '👀' :
             artist.demandScoreTier === 'building' ? '🧱' : '🌱'}{' '}
            {artist.demandScoreTier.charAt(0).toUpperCase() + artist.demandScoreTier.slice(1)}
          </span>
        )}
        <div className="text-center">
          <div className="font-mono font-bold text-foreground text-lg">
            {artist.demandScore || 0}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">score</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {artist.appleMusicUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation()
              window.open(artist.appleMusicUrl, '_blank')
            }}
          >
            <svg viewBox="0 0 24 24" fill="#fa243c" className="w-4 h-4">
              <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.99c-.042.003-.083.01-.124.013-.5.032-.999.09-1.486.198a4.94 4.94 0 00-1.955.84C1.332 1.965.633 3.107.336 4.484a10.46 10.46 0 00-.18 1.622c-.003.04-.01.083-.013.124v11.54c.003.042.01.083.013.124.032.5.09.999.198 1.486.311 1.31 1.062 2.31 2.18 3.043.544.358 1.147.6 1.796.748.498.115 1.006.17 1.518.19.042.003.083.01.124.013h12.02c.042-.003.083-.01.124-.013a9.225 9.225 0 002.19-.24c1.31-.317 2.31-1.062 3.043-2.18a5.022 5.022 0 00.726-1.877c.115-.498.17-1.006.19-1.518.003-.042.01-.083.013-.124V6.248c-.003-.042-.01-.083-.013-.124zM17.997 11.462l-.006.017v5.075a2.153 2.153 0 01-.362 1.199 2.117 2.117 0 01-.96.805c-.376.178-.787.27-1.202.27-.26 0-.522-.033-.778-.1a2.823 2.823 0 01-.726-.3 2.142 2.142 0 01-.57-.496 2.167 2.167 0 01-.378-.66 2.153 2.153 0 01-.134-.737c0-.326.058-.643.174-.95.116-.306.28-.583.492-.828a2.33 2.33 0 01.756-.594c.29-.154.613-.257.968-.31.354-.052.688-.038 1.002.042V10.39l-5.44 1.2v6.076a2.153 2.153 0 01-.362 1.199 2.117 2.117 0 01-.96.805c-.376.178-.787.27-1.202.27-.26 0-.522-.033-.778-.1a2.823 2.823 0 01-.726-.3 2.142 2.142 0 01-.57-.496 2.167 2.167 0 01-.378-.66 2.153 2.153 0 01-.134-.737c0-.326.058-.643.174-.95.116-.306.28-.583.492-.828a2.33 2.33 0 01.756-.594c.29-.154.613-.257.968-.31.354-.052.688-.038 1.002.042V9.218c0-.138.027-.27.082-.395a.947.947 0 01.234-.331.949.949 0 01.345-.214l6.078-1.574a.945.945 0 01.246-.033.826.826 0 01.592.247.815.815 0 01.247.592v3.952z"/>
            </svg>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation()
            if (artist.profileSlug) {
              navigate(`/${artist.profileSlug}`)
            }
          }}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export function Hot100Section({ artists: propArtists }) {
  const navigate = useNavigate()
  const [artists, setArtists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (propArtists) {
      setArtists(propArtists)
      setIsLoading(false)
      return
    }

    const fetchHot100 = async () => {
      try {
        const response = await fetch(`${API_URL}/api/artists/hot100?limit=10`)
        if (!response.ok) throw new Error('Failed to fetch Hot 100')
        const data = await response.json()
        setArtists(data.artists || [])
      } catch (err) {
        console.error('Hot 100 fetch error:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHot100()
  }, [propArtists])

  return (
    <section id="hot100" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            <Trophy className="w-4 h-4 mr-1" />
            Demand Score
          </Badge>
          <h2 className="font-display text-5xl sm:text-6xl font-bold mb-4 uppercase tracking-tight">
            Tampa <span className="text-gradient-hot">Hot 100</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ranked by the TampaMixtape Demand Score — release activity, community engagement, chart presence, and live shows.
          </p>
        </motion.div>

        {/* Chart Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Top Artists
                </CardTitle>
                <Badge variant="secondary">
                  {artists.length > 0 ? `${artists.length} Artists` : 'Live Rankings'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 divide-y divide-border/50">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Unable to load rankings</p>
                </div>
              ) : artists.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No artists ranked yet</p>
                  <p className="text-sm mt-2">Check back soon!</p>
                </div>
              ) : (
                <>
                  {artists.map((artist, index) => (
                    <ArtistRow key={artist.id} artist={artist} index={index} />
                  ))}

                  <div className="pt-4 text-center">
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={() => navigate('/artists')}
                    >
                      View All Artists
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            {
              title: 'Most Popular',
              description: 'Artists with the highest popularity scores.',
              icon: TrendingUp,
              color: 'text-primary',
            },
            {
              title: 'Rising Stars',
              description: 'New artists making waves in Tampa Bay.',
              icon: Award,
              color: 'text-amber-400',
            },
            {
              title: 'Tampa Legends',
              description: 'The all-time greats from the Tampa Bay area.',
              icon: Crown,
              color: 'text-yellow-400',
            },
          ].map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:glow-green-sm transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className={`w-6 h-6 ${card.color}`} />
                      <h3 className="font-semibold">{card.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {card.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group-hover:text-primary transition-colors"
                      onClick={() => navigate('/artists')}
                    >
                      Explore
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
