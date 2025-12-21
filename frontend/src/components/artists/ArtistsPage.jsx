import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Music,
  Search,
  Users,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Grid,
  List,
  TrendingUp,
  MapPin,
} from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

// Common genres for filtering
const GENRES = [
  'All Genres',
  'Hip Hop',
  'R&B',
  'Pop',
  'Rock',
  'Electronic',
  'Latin',
  'Country',
  'Jazz',
  'Soul',
  'Reggae',
  'Alternative',
]

const REGIONS = [
  { value: 'all', label: 'All Regions' },
  { value: 'Tampa Bay', label: 'Tampa Bay' },
  { value: 'St. Pete', label: 'St. Pete' },
]

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num?.toLocaleString() || '0'
}

function ArtistListItem({ artist, index }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden hover:glow-green-sm transition-all"
        onClick={() => navigate(`/${artist.profileSlug}`)}
      >
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            {/* Avatar */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-secondary">
              {artist.avatar ? (
                <img
                  src={artist.avatar}
                  alt={artist.artistName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {artist.artistName}
              </h3>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {artist.genres && (
                  <span className="text-sm text-muted-foreground truncate">
                    {artist.genres.split(',')[0]?.trim()}
                  </span>
                )}
                {artist.region && (
                  <Badge variant="secondary" className="text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {artist.region}
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
              {artist.popularity > 0 && (
                <div className="text-center">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    {artist.popularity}
                  </div>
                  <div className="text-xs">popularity</div>
                </div>
              )}
              {artist.followers > 0 && (
                <div className="text-center">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {formatNumber(artist.followers)}
                  </div>
                  <div className="text-xs">followers</div>
                </div>
              )}
            </div>

            {/* Action */}
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ArtistGridItem({ artist, index }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden hover:glow-green-sm transition-all"
        onClick={() => navigate(`/${artist.profileSlug}`)}
      >
        <CardContent className="p-0">
          <div className="relative aspect-square">
            {artist.avatar ? (
              <img
                src={artist.avatar}
                alt={artist.artistName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center">
                <Music className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
              <Button size="sm" className="w-full gap-2">
                <ExternalLink className="w-3 h-3" />
                View Profile
              </Button>
            </div>
            {/* Popularity badge */}
            {artist.popularity > 0 && (
              <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm">
                <TrendingUp className="w-3 h-3 mr-1" />
                {artist.popularity}
              </Badge>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {artist.artistName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {artist.genres && (
                <p className="text-xs text-muted-foreground truncate flex-1">
                  {artist.genres.split(',')[0]?.trim()}
                </p>
              )}
              {artist.region && (
                <Badge variant="outline" className="text-xs">
                  {artist.region}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ArtistsPage() {
  const navigate = useNavigate()
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [genre, setGenre] = useState('all')
  const [region, setRegion] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [pagination, setPagination] = useState({ page: 1, limit: 24, total: 0, pages: 0 })

  const fetchArtists = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
      })
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      if (genre !== 'all') {
        params.append('genre', genre)
      }
      if (region !== 'all') {
        params.append('region', region)
      }

      const response = await fetch(`${API_URL}/api/artists?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch artists')
      }
      const data = await response.json()
      setArtists(data.artists)
      setPagination(data.pagination)
    } catch (err) {
      console.error('Error fetching artists:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArtists(1)
  }, [sortBy, genre, region])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArtists(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 gap-2">
            <Users className="w-3 h-3" />
            Artist Directory
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Tampa Bay <span className="text-primary">Artists</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the talented artists making waves in Tampa Bay's music scene.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-4 mb-8"
        >
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="followers">Most Followers</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>

            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-[160px]">
                <Music className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => (
                  <SelectItem key={g} value={g === 'All Genres' ? 'all' : g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-[140px]">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {(genre !== 'all' || region !== 'all' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGenre('all')
                  setRegion('all')
                  setSearchQuery('')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </motion.div>

        {/* Results Count */}
        {!loading && !error && (
          <p className="text-sm text-muted-foreground mb-6">
            {pagination.total} artist{pagination.total !== 1 ? 's' : ''} found
            {genre !== 'all' && ` in ${genre}`}
            {region !== 'all' && ` from ${region}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        )}

        {/* Artists Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-red-400">{error}</p>
            <Button onClick={() => fetchArtists(1)} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-24">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Artists Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? `No artists match "${searchQuery}"` : 'No artists available with these filters.'}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setGenre('all')
                setRegion('all')
                setSearchQuery('')
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {artists.map((artist, index) => (
                <ArtistGridItem key={artist.id} artist={artist} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <Button
                  variant="outline"
                  onClick={() => fetchArtists(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => fetchArtists(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-3">
              {artists.map((artist, index) => (
                <ArtistListItem key={artist.id} artist={artist} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <Button
                  variant="outline"
                  onClick={() => fetchArtists(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => fetchArtists(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
