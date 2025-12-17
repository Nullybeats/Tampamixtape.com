import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer
} from 'recharts'
import {
  Share2,
  Download,
  Code,
  Image,
  Sparkles,
  Copy,
  ExternalLink,
  Twitter,
  Instagram,
  TrendingUp
} from 'lucide-react'

const artistData = {
  name: 'Tampa Flow',
  handle: '@tampaflow',
  avatar: 'https://picsum.photos/seed/artist1/200/200',
  monthlyListeners: '245.8K',
  totalStreams: '12.4M',
  chartPosition: 7,
  positionChange: '+3',
  genre: 'Hip-Hop/Rap',
  topCities: ['Tampa', 'Orlando', 'Miami', 'Jacksonville', 'Atlanta']
}

const miniChartData = [
  { name: 'Mon', streams: 12 },
  { name: 'Tue', streams: 15 },
  { name: 'Wed', streams: 14 },
  { name: 'Thu', streams: 18 },
  { name: 'Fri', streams: 25 },
  { name: 'Sat', streams: 32 },
  { name: 'Sun', streams: 28 },
]

function ShareableCard() {
  return (
    <motion.div
      initial={{ rotateY: -10, rotateX: 5 }}
      whileHover={{ rotateY: 0, rotateX: 0, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      style={{ perspective: '1000px' }}
    >
      <Card className="w-full max-w-sm bg-gradient-to-br from-card via-card to-primary/10 border-primary/20 glow-green-sm overflow-hidden">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="text-xs">
              Tampa Mixtape
            </Badge>
            <Badge variant="success" className="text-xs gap-1">
              <TrendingUp className="w-3 h-3" />
              {artistData.positionChange}
            </Badge>
          </div>

          {/* Artist Info */}
          <div className="flex items-center gap-4 mb-6">
            <img
              src={artistData.avatar}
              alt={artistData.name}
              className="w-16 h-16 rounded-full border-2 border-primary"
            />
            <div>
              <h3 className="font-bold text-xl">{artistData.name}</h3>
              <p className="text-sm text-muted-foreground">{artistData.handle}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {artistData.genre}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">#{artistData.chartPosition}</div>
              <div className="text-xs text-muted-foreground">Hot 100</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{artistData.monthlyListeners}</div>
              <div className="text-xs text-muted-foreground">Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{artistData.totalStreams}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>

          {/* Mini Chart */}
          <div className="h-20 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={miniChartData}>
                <Bar dataKey="streams" fill="#22c55e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Cities */}
          <div className="flex flex-wrap gap-1">
            {artistData.topCities.map((city) => (
              <Badge key={city} variant="secondary" className="text-xs">
                {city}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function AnalyticsCards() {
  const shareOptions = [
    { icon: Twitter, label: 'Twitter/X', color: 'hover:text-sky-400' },
    { icon: Instagram, label: 'Instagram', color: 'hover:text-pink-400' },
    { icon: Copy, label: 'Copy Link', color: 'hover:text-primary' },
    { icon: Download, label: 'Download', color: 'hover:text-primary' },
  ]

  const embedFeatures = [
    {
      icon: Image,
      title: 'Social Cards',
      description: 'Auto-generated cards optimized for Twitter, Instagram, and Facebook.'
    },
    {
      icon: Code,
      title: 'Embed Widgets',
      description: 'Add live charts and stats to your website with a simple embed code.'
    },
    {
      icon: Share2,
      title: 'One-Click Share',
      description: 'Share artist stats and chart positions directly to any platform.'
    },
  ]

  return (
    <section id="share" className="py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            <Sparkles className="w-4 h-4 mr-1" />
            Share & Embed
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Shareable <span className="text-gradient">Analytics Cards</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Beautiful, auto-generated cards that make it easy to share artist stats, chart positions, and streaming milestones.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Card Preview */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative">
              <ShareableCard />
              {/* Share buttons */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {shareOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <Button
                      key={option.label}
                      variant="secondary"
                      size="icon"
                      className={`rounded-full ${option.color} transition-colors`}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  )
                })}
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-2xl font-bold mb-2">Share Your Success</h3>
              <p className="text-muted-foreground">
                Artists and fans can instantly share beautiful analytics cards across all social platforms.
              </p>
            </div>

            <div className="space-y-4">
              {embedFeatures.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:glow-green-sm transition-shadow">
                      <CardContent className="p-4 flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>

            <div className="flex gap-4">
              <Button size="lg" className="gap-2">
                <Code className="w-5 h-5" />
                Get Embed Code
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <ExternalLink className="w-5 h-5" />
                View Examples
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
