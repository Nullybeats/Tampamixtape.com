import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Disc3,
  Sparkles,
  TrendingUp,
  Loader2,
  Music,
} from 'lucide-react'
import { ReleaseCard } from '@/components/feed'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

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
          <h2 className="font-display text-5xl sm:text-6xl font-bold mb-4 uppercase tracking-tight">
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

          {/* Features Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-24"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5">
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative p-8">
                <h3 className="font-display text-3xl font-bold uppercase tracking-tight mb-2">
                  Never Miss<br />a Drop
                </h3>
                <p className="text-sm text-muted-foreground mb-8">
                  Stay locked in with Tampa Bay's music scene.
                </p>

                {/* Feature pills */}
                <div className="space-y-3 mb-8">
                  {[
                    { icon: TrendingUp, label: 'Real-time release tracking', color: 'text-primary' },
                    { icon: Disc3, label: 'Powered by Apple Music', color: 'text-primary' },
                    { icon: Sparkles, label: 'Tampa & St. Pete artists only', color: 'text-primary' },
                  ].map((feature, i) => {
                    const Icon = feature.icon
                    return (
                      <motion.div
                        key={feature.label}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className={`w-4 h-4 ${feature.color}`} />
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
