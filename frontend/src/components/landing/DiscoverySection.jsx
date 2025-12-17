import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Play,
  Heart,
  Share2,
  ExternalLink,
  Clock,
  TrendingUp,
  Disc3,
  Sparkles
} from 'lucide-react'

const newReleases = [
  {
    id: 1,
    title: 'Midnight in Ybor',
    artist: 'Tampa Flow',
    cover: 'https://picsum.photos/seed/release1/300/300',
    releaseDate: '2 hours ago',
    streams: '12.4K',
    trending: true,
    platforms: ['spotify', 'apple', 'youtube']
  },
  {
    id: 2,
    title: 'Bay Life',
    artist: 'ClearWater Kid',
    cover: 'https://picsum.photos/seed/release2/300/300',
    releaseDate: '5 hours ago',
    streams: '8.2K',
    trending: true,
    platforms: ['spotify', 'soundcloud']
  },
  {
    id: 3,
    title: 'Summer on the Strip',
    artist: 'St. Pete Dreamer',
    cover: 'https://picsum.photos/seed/release3/300/300',
    releaseDate: '8 hours ago',
    streams: '5.7K',
    trending: false,
    platforms: ['spotify', 'apple', 'youtube', 'deezer']
  },
  {
    id: 4,
    title: 'Florida State of Mind',
    artist: 'Brandon Heights',
    cover: 'https://picsum.photos/seed/release4/300/300',
    releaseDate: '12 hours ago',
    streams: '4.1K',
    trending: false,
    platforms: ['spotify', 'apple']
  },
]

function ReleaseCard({ release, index }) {
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
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={release.cover}
                alt={release.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
              {release.trending && (
                <div className="absolute top-1 right-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold truncate">{release.title}</h4>
                  <p className="text-sm text-muted-foreground">{release.artist}</p>
                </div>
                {release.trending && (
                  <Badge variant="success" className="text-xs">Hot</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {release.releaseDate}
                </span>
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  {release.streams}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Heart className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Share2 className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <ExternalLink className="w-3 h-3" />
                </Button>

                {/* Platform Indicators */}
                <div className="flex gap-1 ml-auto">
                  {release.platforms.includes('spotify') && (
                    <div className="w-4 h-4 rounded-full bg-[#1db954]/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#1db954]" />
                    </div>
                  )}
                  {release.platforms.includes('apple') && (
                    <div className="w-4 h-4 rounded-full bg-[#fa243c]/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#fa243c]" />
                    </div>
                  )}
                  {release.platforms.includes('youtube') && (
                    <div className="w-4 h-4 rounded-full bg-[#ff0000]/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#ff0000]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DiscoverySection() {
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
            Be the first to know when Tampa artists drop new music. Our discovery feed updates in real-time across all platforms.
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
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            {newReleases.map((release, index) => (
              <ReleaseCard key={release.id} release={release} index={index} />
            ))}
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
                    <h4 className="font-semibold mb-1">Trending Detection</h4>
                    <p className="text-sm text-muted-foreground">
                      Our algorithm identifies viral potential within the first hour of release.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Disc3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Multi-Platform Sync</h4>
                    <p className="text-sm text-muted-foreground">
                      Track releases across Spotify, Apple Music, YouTube, SoundCloud, and more.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Personalized Feed</h4>
                    <p className="text-sm text-muted-foreground">
                      Customize your discovery feed based on genre, neighborhood, or favorite artists.
                    </p>
                  </div>
                </div>

                <Button className="w-full mt-4" size="lg">
                  Start Discovering
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
