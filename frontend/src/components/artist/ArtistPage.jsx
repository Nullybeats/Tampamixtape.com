import { useState, useEffect } from 'react'
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

function TrackRow({ track, index }) {
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
        {track.duration && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(track.duration)}
          </span>
        )}
        {track.popularity !== undefined && (
          <div className="flex items-center gap-1" title="Popularity">
            <TrendingUp className="w-3 h-3" />
            {track.popularity}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Heart className="w-4 h-4" />
        </Button>
        {track.previewUrl && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Play className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
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
            {album.totalTracks} tracks
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ArtistPage({ artistId, artistName, onBack }) {
  const [artist, setArtist] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

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
      const res = await fetch(`${API_URL}/api/artists/spotify/${artistId}/full`)
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
      // First search for the artist to get their Spotify ID
      const searchRes = await fetch(`${API_URL}/api/artists/search?q=${encodeURIComponent(artistName)}`)
      const searchData = await searchRes.json()

      if (searchData.results?.length > 0) {
        const spotifyArtist = searchData.results.find(a => a.spotifyId)
        if (spotifyArtist) {
          // Fetch full data with the Spotify ID
          const res = await fetch(`${API_URL}/api/artists/spotify/${spotifyArtist.spotifyId}/full`)
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
                  Tampa Bay Region
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
                    Play on Spotify
                  </Button>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Heart className="w-5 h-5" />
                    Follow
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
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="tracks" className="gap-2">
              <Music className="w-4 h-4" />
              All Songs
            </TabsTrigger>
            <TabsTrigger value="releases" className="gap-2">
              <Disc3 className="w-4 h-4" />
              Latest Releases
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
                      <TrackRow key={track.id || index} track={track} index={index} />
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
                {artist.latestReleases?.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {artist.latestReleases.map((album, index) => (
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
