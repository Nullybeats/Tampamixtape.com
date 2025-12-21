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
      return <Crown className="w-5 h-5 text-yellow-400" />
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />
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
      <div className="w-12 text-center">
        <div className="flex items-center justify-center gap-1">
          {getRankIcon(artist.rank)}
          <span className={`text-2xl font-bold ${artist.rank <= 3 ? 'text-gradient-gold' : ''}`}>
            {artist.rank}
          </span>
        </div>
      </div>

      {/* Artist Image */}
      <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-secondary">
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

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <div className="text-center">
          <div className="font-semibold text-foreground flex items-center gap-1 justify-center">
            <TrendingUp className="w-3 h-3 text-primary" />
            {artist.popularity}
          </div>
          <div className="text-xs">popularity</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-foreground flex items-center gap-1 justify-center">
            <Users className="w-3 h-3" />
            {formatNumber(artist.followers)}
          </div>
          <div className="text-xs">followers</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {artist.spotifyUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation()
              window.open(artist.spotifyUrl, '_blank')
            }}
          >
            <svg viewBox="0 0 24 24" fill="#1DB954" className="w-4 h-4">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
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

export function Hot100Section() {
  const navigate = useNavigate()
  const [artists, setArtists] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
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
  }, [])

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
            Artist Rankings
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Tampa <span className="text-gradient-gold">Hot 100</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The definitive ranking of Tampa Bay's top artists, ranked by Spotify popularity and follower count.
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
            <CardContent className="p-4 space-y-2">
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
              description: 'Artists with the highest Spotify popularity scores.',
              icon: TrendingUp,
              color: 'text-green-400',
            },
            {
              title: 'Rising Stars',
              description: 'New artists making waves in Tampa Bay.',
              icon: Award,
              color: 'text-primary',
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
