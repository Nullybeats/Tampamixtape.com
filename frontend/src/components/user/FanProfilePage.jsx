import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { Heart, Users, MapPin, Calendar, Music, TrendingUp } from 'lucide-react'
import { formatNumber } from '@/components/feed'

function ArtistCard({ artist, index }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden hover:glow-green-sm transition-all"
        onClick={() => navigate(`/${artist.profileSlug}`)}
      >
        <div className="relative aspect-square">
          {artist.avatar ? (
            <img
              src={artist.avatar}
              alt={artist.artistName}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <Music className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h4 className="font-semibold truncate">{artist.artistName}</h4>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            {artist.followers > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {formatNumber(artist.followers)}
              </span>
            )}
            {artist.genres && (
              <span className="truncate">{artist.genres.split(',')[0]?.trim()}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function FanProfilePage() {
  const { user, getFollowingArtists, getLikedArtists } = useAuth()
  const [followedArtists, setFollowedArtists] = useState([])
  const [likedArtists, setLikedArtists] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [followed, liked] = await Promise.all([
          getFollowingArtists(),
          getLikedArtists(),
        ])
        setFollowedArtists(followed)
        setLikedArtists(liked)
      } catch (err) {
        console.error('Error loading fan profile data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const displayName = user?.name || user?.artistName || user?.email?.split('@')[0] || 'Fan'
  const initials = displayName.slice(0, 2).toUpperCase()
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 mb-8"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{initials}</span>
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <Badge variant="secondary">Fan</Badge>
              {user?.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {user.region}
                </span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Joined {memberSince}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{followedArtists.length}</p>
                <p className="text-sm text-muted-foreground">Artists Following</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{likedArtists.length}</p>
                <p className="text-sm text-muted-foreground">Artists Liked</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="liked" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="liked" className="gap-2">
              <Heart className="w-4 h-4" />
              Liked Artists
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <Users className="w-4 h-4" />
              Following
            </TabsTrigger>
          </TabsList>

          <TabsContent value="liked">
            {likedArtists.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No liked artists yet</h3>
                  <p className="text-muted-foreground">Explore Tampa artists and hit the heart to like them!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {likedArtists.map((artist, index) => (
                  <ArtistCard key={artist.id} artist={artist} index={index} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following">
            {followedArtists.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Not following anyone yet</h3>
                  <p className="text-muted-foreground">Follow Tampa artists to see them here!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {followedArtists.map((artist, index) => (
                  <ArtistCard key={artist.id} artist={artist} index={index} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
