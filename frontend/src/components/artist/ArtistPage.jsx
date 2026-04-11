import { useState, useEffect, useCallback } from 'react'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin,
  Users,
  Play,
  Clock,
  Calendar,
  Disc3,
  Music,
  ExternalLink,
  Share2,
  Heart,
  TrendingUp,
  Loader2,
  ArrowLeft,
  Album,
  Check,
  Link,
  UserPlus,
  UserCheck,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num?.toString() || '0'
}

function formatDuration(ms) {
  if (!ms) return ''
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function TrackRow({ track, index, isLiked, likeCount, onLikeToggle, isAuthenticated }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
    >
      <span className="w-6 text-center text-muted-foreground text-sm">{index + 1}</span>

      {track.albumImage && (
        <img
          src={track.albumImage}
          alt={track.name}
          className="w-12 h-12 rounded"
        />
      )}

      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{track.name}</h4>
        {track.albumName && (
          <p className="text-sm text-muted-foreground truncate">{track.albumName}</p>
        )}
      </div>

      <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
        {(track.duration || track.durationMs) && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(track.duration || track.durationMs)}
          </span>
        )}
        {track.popularity !== undefined && (
          <div className="flex items-center gap-1" title="Popularity">
            <TrendingUp className="w-3 h-3" />
            {track.popularity}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onLikeToggle(track)
          }}
          title={isAuthenticated ? (isLiked ? 'Unlike' : 'Like') : 'Sign up to like tracks'}
        >
          <motion.div
            whileTap={{ scale: 0.75 }}
            animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="inline-flex"
          >
            <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground/60 hover:text-red-400'}`} />
          </motion.div>
        </Button>
        {likeCount > 0 && (
          <span className="text-xs text-muted-foreground min-w-[1ch]">{likeCount}</span>
        )}
        {track.previewUrl && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => window.open(track.url, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

function AlbumCard({ album, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="cursor-pointer group"
      onClick={() => window.open(album.url, '_blank')}
    >
      <Card className="overflow-hidden hover:glow-green-sm transition-all">
        <div className="relative aspect-square">
          {album.image ? (
            <img
              src={album.image}
              alt={album.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <Disc3 className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-12 h-12 text-white" />
          </div>
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 text-xs capitalize"
          >
            {album.type}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h4 className="font-semibold truncate">{album.name}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Calendar className="w-3 h-3" />
            {album.releaseDate?.split('-')[0] || 'Unknown'}
            <span className="mx-1">•</span>
            {album.totalTracks || album.trackCount || 0} tracks
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ArtistPage({ artistId, artistName, onBack, onAuthClick }) {
  const [artist, setArtist] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [likedTrackIds, setLikedTrackIds] = useState(new Set())
  const [trackLikeCounts, setTrackLikeCounts] = useState({})
  const { isAuthenticated, followArtist, unfollowArtist, checkFollowStatus, likeTrack, unlikeTrack, checkTrackLikeStatus } = useAuth()

  // Set dynamic meta tags for SEO (for JS-executing search engines)
  useDocumentMeta({
    title: artist?.name
      ? `${artist.name} — Tampa Mixtape`
      : 'Tampa Mixtape — Tampa Bay\'s Music Radar',
    description: artist?.name
      ? `Discover ${artist.name} on Tampa Mixtape — Tampa Bay's Music Radar`
      : 'Discover Tampa Bay\'s hottest artists. Artist rankings, new releases, and music discovery powered by Apple Music.',
    image: artist?.image || 'https://tampamixtape.com/og-image.png',
    url: artistId
      ? `https://tampamixtape.com/artist/${artistId}`
      : 'https://tampamixtape.com/',
  })

  // Look up the DB user ID for follow/like functionality
  const [dbUserId, setDbUserId] = useState(null)

  useEffect(() => {
    if (!artistId) return
    // Find the DB user by Apple Music ID
    fetch(`${API_URL}/api/artists/hot100?limit=1000`)
      .then(res => res.json())
      .then(data => {
        const match = data.artists?.find(a => a.appleMusicId === artistId)
        if (match) {
          setDbUserId(match.id)
        }
      })
      .catch(() => {})
  }, [artistId])

  // Check follow status when we have the DB user ID
  useEffect(() => {
    if (!dbUserId || !isAuthenticated) return
    checkFollowStatus(dbUserId).then(data => setIsFollowing(data.isFollowing))
  }, [dbUserId, isAuthenticated])

  // Check like status for all tracks when artist data loads
  useEffect(() => {
    if (!artist?.topTracks?.length) return
    const checkLikes = async () => {
      const liked = new Set()
      const counts = {}
      await Promise.all(
        artist.topTracks.map(async (track) => {
          if (!track.id) return
          if (isAuthenticated) {
            const data = await checkTrackLikeStatus(track.id)
            if (data.isLiked) liked.add(track.id)
            counts[track.id] = data.likeCount || 0
          }
        })
      )
      setLikedTrackIds(liked)
      setTrackLikeCounts(counts)
    }
    checkLikes()
  }, [artist, isAuthenticated])

  const handleFollow = async () => {
    if (!isAuthenticated) {
      onAuthClick?.('signup')
      return
    }
    if (!dbUserId) return
    try {
      if (isFollowing) {
        await unfollowArtist(dbUserId)
        setIsFollowing(false)
      } else {
        await followArtist(dbUserId)
        setIsFollowing(true)
      }
    } catch (err) {
      console.error('Follow toggle error:', err)
    }
  }

  const handleTrackLike = async (track) => {
    if (!isAuthenticated) {
      onAuthClick?.('signup')
      return
    }
    if (!track.id) return
    try {
      const trackId = track.id
      if (likedTrackIds.has(trackId)) {
        const result = await unlikeTrack(trackId)
        setLikedTrackIds(prev => {
          const next = new Set(prev)
          next.delete(trackId)
          return next
        })
        setTrackLikeCounts(prev => ({ ...prev, [trackId]: result.likeCount || 0 }))
        toast('Removed from liked tracks', { icon: '💔' })
      } else {
        const result = await likeTrack(trackId, {
          trackName: track.name,
          artistName: artist?.name || '',
          albumImage: track.albumImage || null,
          trackUrl: track.url || null,
        })
        setLikedTrackIds(prev => new Set(prev).add(trackId))
        setTrackLikeCounts(prev => ({ ...prev, [trackId]: result.likeCount || 0 }))
        toast(`Liked "${track.name}"`, { icon: '❤️' })
      }
    } catch (err) {
      console.error('Track like toggle error:', err)
      toast.error('Failed to update like')
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/artist/${artistId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  useEffect(() => {
    if (artistId) {
      fetchFullArtistData()
    } else if (artistName) {
      fetchArtistByName()
    }
  }, [artistId, artistName])

  const fetchFullArtistData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/artists/apple-music/${artistId}/full`)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setArtist(data)
    } catch (err) {
      console.error('Error fetching artist data:', err)
      setError('Failed to load artist data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchArtistByName = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First search for the artist to get their Apple Music ID
      const searchRes = await fetch(`${API_URL}/api/artists/search?q=${encodeURIComponent(artistName)}`)

      if (!searchRes.ok) {
        throw new Error('Search failed')
      }

      const searchData = await searchRes.json()

      if (searchData.results?.length > 0) {
        const appleMusicArtist = searchData.results.find(a => a.appleMusicId)
        if (appleMusicArtist) {
          // Fetch full data with the Apple Music ID
          const res = await fetch(`${API_URL}/api/artists/apple-music/${appleMusicArtist.appleMusicId}/full`)

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to load artist')
          }

          const data = await res.json()
          setArtist(data)
          return
        }
      }

      setError('Artist not found')
    } catch (err) {
      console.error('Error fetching artist data:', err)
      setError('Failed to load artist data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading artist...</p>
        </div>
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Artist Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || "We couldn't find this artist. Please try searching again."}
          </p>
          <Button onClick={onBack} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const pastReleases = artist.latestReleases || []
  const upcomingReleases = artist.upcomingReleases || []

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Gradient */}
        <div className="absolute inset-0 h-96 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Artist Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 glow-green"
            >
              {artist.image ? (
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Music className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
            </motion.div>

            {/* Artist Info */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Region Badge */}
                <Badge variant="outline" className="mb-3 gap-1">
                  <MapPin className="w-3 h-3" />
                  {artist.region || 'Tampa Bay'} Region
                </Badge>

                <h1 className="text-4xl md:text-5xl font-bold mb-4">{artist.name}</h1>

                {/* Genres */}
                {artist.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {artist.genres.map((genre) => (
                      <Badge key={genre} variant="secondary" className="capitalize">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold">{formatNumber(artist.followers)}</span>
                    <span className="text-muted-foreground">followers</span>
                  </div>
                  {artist.popularity !== undefined && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold">{artist.popularity}</span>
                      <span className="text-muted-foreground">popularity</span>
                    </div>
                  )}
                  {artist.totalAlbums > 0 && (
                    <div className="flex items-center gap-2">
                      <Album className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold">{artist.totalAlbums}</span>
                      <span className="text-muted-foreground">albums</span>
                    </div>
                  )}
                  {artist.totalSingles > 0 && (
                    <div className="flex items-center gap-2">
                      <Disc3 className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold">{artist.totalSingles}</span>
                      <span className="text-muted-foreground">singles</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="gap-2" onClick={() => window.open(artist.url, '_blank')}>
                    <Play className="w-5 h-5" />
                    Play on Apple Music
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <><UserCheck className="w-5 h-5 text-primary" /> Following</>
                    ) : (
                      <><UserPlus className="w-5 h-5" /> Follow</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={handleShare}
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Link className="w-5 h-5" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="tracks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="tracks" className="gap-2">
              <Music className="w-4 h-4" />
              All Songs
            </TabsTrigger>
            <TabsTrigger value="releases" className="gap-2">
              <Disc3 className="w-4 h-4" />
              Latest Releases
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="discography" className="gap-2">
              <Album className="w-4 h-4" />
              Discography
            </TabsTrigger>
          </TabsList>

          {/* All Songs Tab */}
          <TabsContent value="tracks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Popular Tracks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {artist.topTracks?.length > 0 ? (
                  <div className="space-y-1">
                    {artist.topTracks.map((track, index) => (
                      <TrackRow
                        key={track.id || index}
                        track={track}
                        index={index}
                        isLiked={likedTrackIds.has(track.id)}
                        likeCount={trackLikeCounts[track.id] || 0}
                        onLikeToggle={handleTrackLike}
                        isAuthenticated={isAuthenticated}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No tracks available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Latest Releases Tab */}
          <TabsContent value="releases">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Disc3 className="w-5 h-5 text-primary" />
                  Latest Releases
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pastReleases.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {pastReleases.map((album, index) => (
                      <AlbumCard key={album.id} album={album} index={index} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No releases available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Releases Tab */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Releases
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingReleases.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {upcomingReleases.map((album, index) => (
                      <AlbumCard key={album.id} album={album} index={index} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No upcoming releases
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discography Tab */}
          <TabsContent value="discography" className="space-y-8">
            {/* Albums */}
            {artist.discography?.albums?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Album className="w-5 h-5 text-primary" />
                    Albums ({artist.discography.albums.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {artist.discography.albums.map((album, index) => (
                      <AlbumCard key={album.id} album={album} index={index} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Singles & EPs */}
            {artist.discography?.singles?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Disc3 className="w-5 h-5 text-primary" />
                    Singles & EPs ({artist.discography.singles.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {artist.discography.singles.map((album, index) => (
                      <AlbumCard key={album.id} album={album} index={index} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compilations */}
            {artist.discography?.compilations?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    Compilations ({artist.discography.compilations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {artist.discography.compilations.map((album, index) => (
                      <AlbumCard key={album.id} album={album} index={index} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!artist.discography?.albums?.length && !artist.discography?.singles?.length && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No discography available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
