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
  Disc3,
  Search,
  Loader2,
  Play,
  ExternalLink,
  Calendar,
  Music,
  Filter,
} from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export function ReleasesPage() {
  const navigate = useNavigate()
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchReleases = async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '24',
      })
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }

      const response = await fetch(`${API_URL}/api/releases?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch releases')
      }
      const data = await response.json()

      if (append) {
        setReleases(prev => [...prev, ...data.releases])
      } else {
        setReleases(data.releases)
      }
      setHasMore(data.releases.length === 24)
      setPage(pageNum)
    } catch (err) {
      console.error('Error fetching releases:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchReleases(1)
  }, [typeFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReleases(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchReleases(page + 1, true)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'album':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'single':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'ep':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

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
            <Disc3 className="w-3 h-3" />
            New Music
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Latest <span className="text-primary">Releases</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Fresh tracks and albums from Tampa Bay artists. Stay up to date with the latest drops.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search releases or artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="album">Albums</SelectItem>
              <SelectItem value="single">Singles</SelectItem>
              <SelectItem value="ep">EPs</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Releases Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-24">
            <p className="text-red-400">{error}</p>
            <Button onClick={() => fetchReleases(1)} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-24">
            <Disc3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Releases Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? `No releases match "${searchQuery}"` : 'No releases available yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {releases.map((release, index) => (
                <motion.div
                  key={release.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(index, 23) * 0.02 }}
                >
                  <Card className="group cursor-pointer overflow-hidden hover:glow-green-sm transition-all">
                    <CardContent className="p-0">
                      <div
                        className="relative aspect-square"
                        onClick={() => release.url && window.open(release.url, '_blank')}
                      >
                        {release.image ? (
                          <img
                            src={release.image}
                            alt={release.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-secondary flex items-center justify-center">
                            <Music className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                        <Badge className={`absolute top-2 right-2 ${getTypeColor(release.type)}`}>
                          {release.type || 'Release'}
                        </Badge>
                      </div>
                      <div className="p-3">
                        <h3
                          className="font-semibold truncate group-hover:text-primary transition-colors cursor-pointer"
                          onClick={() => release.url && window.open(release.url, '_blank')}
                        >
                          {release.name}
                        </h3>
                        <button
                          className="text-sm text-muted-foreground truncate hover:text-primary transition-colors block w-full text-left"
                          onClick={() => release.artistSlug && navigate(`/${release.artistSlug}`)}
                        >
                          {release.artistName}
                        </button>
                        {release.releaseDate && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(release.releaseDate)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="gap-2"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Releases
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
