import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Play,
  ExternalLink,
  Calendar,
  Disc3,
  Sparkles,
  TrendingUp,
  Loader2,
  Music,
} from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

function formatRelativeDate(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return date.toLocaleDateString()
}

function ReleaseCard({ release, index }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="group hover:glow-green-sm transition-all duration-300 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Album Art */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
              {release.image ? (
                <img
                  src={release.image}
                  alt={release.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {release.url && (
                <a
                  href={release.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Play className="w-8 h-8 text-white fill-white" />
                </a>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold truncate">{release.name}</h4>
                  <button
                    onClick={() => navigate(`/${release.artistSlug}`)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    {release.artistName}
                  </button>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  {release.type}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatRelativeDate(release.releaseDate)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                {release.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    asChild
                  >
                    <a href={release.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Spotify
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => navigate(`/${release.artistSlug}`)}
                >
                  View Artist
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DiscoverySection() {
  const navigate = useNavigate()
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const response = await fetch(`${API_URL}/api/releases?limit=4`)
        if (!response.ok) {
          throw new Error('Failed to fetch releases')
        }
        const data = await response.json()
        setReleases(data.releases || [])
      } catch (err) {
        console.error('Error fetching releases:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReleases()
  }, [])

  return (
    <section id="discovery" className="py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            <Disc3 className="w-4 h-4 mr-1" />
            Discovery Feed
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Discover <span className="text-gradient">New Releases</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Be the first to know when Tampa artists drop new music. Fresh releases from the Bay's top talent.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Release Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Latest Drops
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/releases')}>
                View All
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Unable to load releases</p>
              </div>
            ) : releases.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No releases yet</p>
              </div>
            ) : (
              releases.map((release, index) => (
                <ReleaseCard key={release.id} release={release} index={index} />
              ))
            )}
          </div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-24"
          >
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6">Never Miss a Drop</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Real-Time Updates</h4>
                    <p className="text-sm text-muted-foreground">
                      See the latest releases from Tampa Bay artists as they drop.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Disc3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Powered by Spotify</h4>
                    <p className="text-sm text-muted-foreground">
                      Direct integration with Spotify for accurate release data and streaming links.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Local Talent First</h4>
                    <p className="text-sm text-muted-foreground">
                      Focused exclusively on artists from the Tampa Bay and St. Pete area.
                    </p>
                  </div>
                </div>

                <Button className="w-full mt-4" size="lg" onClick={() => navigate('/releases')}>
                  Browse All Releases
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
