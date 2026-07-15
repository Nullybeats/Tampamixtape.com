import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TiltCard } from '@/components/ui/tilt-card'
import {
  Disc3,
  Sparkles,
  TrendingUp,
  Loader2,
  Music,
  Play,
} from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

function ReleaseTile({ release, className, featured = false }) {
  const navigate = useNavigate()

  const open = () => {
    if (release.url) {
      window.open(release.url, '_blank', 'noopener,noreferrer')
    } else if (release.artistSlug) {
      navigate(`/${release.artistSlug}`)
    }
  }

  return (
    <TiltCard className={className}>
      <div
        onClick={open}
        className="group relative h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-card elev-1 transition-shadow duration-300 hover:elev-3"
      >
        {release.image ? (
          <img
            src={release.image}
            alt={release.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <Music className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        {/* Legibility scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Play affordance */}
        {release.url && (
          <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full glass opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Play className="h-4 w-4 fill-white text-white" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <Badge variant="secondary" className="mb-2 text-[10px] uppercase tracking-wider">
            {release.type}
          </Badge>
          <h4 className={`truncate font-semibold ${featured ? 'text-xl' : 'text-sm'}`}>
            {release.name}
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (release.artistSlug) navigate(`/${release.artistSlug}`)
            }}
            className="truncate text-left text-xs text-white/70 transition-colors hover:text-primary"
          >
            {release.artistName}
          </button>
        </div>
      </div>
    </TiltCard>
  )
}

export function DiscoverySection({ releases: propReleases }) {
  const navigate = useNavigate()
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (propReleases) {
      setReleases(propReleases)
      setLoading(false)
      return
    }

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
  }, [propReleases])

  const featured = releases[0]
  const rest = releases.slice(1)

  return (
    <section id="discovery" className="relative py-24">
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
          <h2 className="font-display text-4xl sm:text-6xl font-extrabold mb-4 tracking-[-0.02em]">
            Discover <span className="text-gradient">new releases</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Be the first to know when Tampa artists drop new music. Fresh releases from the Bay's top talent.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Release bento */}
          <div>
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-4"
              >
                {featured && (
                  <ReleaseTile
                    release={featured}
                    featured
                    className="col-span-2 aspect-[16/10]"
                  />
                )}
                {rest.map((release, i) => {
                  const wide = i === rest.length - 1 && rest.length % 2 === 1
                  return (
                    <ReleaseTile
                      key={release.id}
                      release={release}
                      className={wide ? 'col-span-2 aspect-[16/7]' : 'col-span-1 aspect-square'}
                    />
                  )
                })}
              </motion.div>
            )}
          </div>

          {/* Features Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-28"
          >
            <div className="relative overflow-hidden rounded-2xl glass">
              {/* Decorative wash */}
              <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative p-8">
                <h3 className="font-display text-3xl font-extrabold tracking-[-0.02em] mb-2">
                  Never miss<br />a drop
                </h3>
                <p className="text-sm text-muted-foreground mb-8">
                  Stay locked in with Tampa Bay's music scene.
                </p>

                {/* Feature pills */}
                <div className="space-y-3 mb-8">
                  {[
                    { icon: TrendingUp, label: 'Real-time release tracking' },
                    { icon: Disc3, label: 'Powered by Apple Music' },
                    { icon: Sparkles, label: 'Tampa & St. Pete artists only' },
                  ].map((feature, i) => {
                    const Icon = feature.icon
                    return (
                      <motion.div
                        key={feature.label}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{feature.label}</span>
                      </motion.div>
                    )
                  })}
                </div>

                <Button className="w-full gap-2" size="lg" onClick={() => navigate('/releases')}>
                  <Disc3 className="w-4 h-4" />
                  Browse All Releases
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
