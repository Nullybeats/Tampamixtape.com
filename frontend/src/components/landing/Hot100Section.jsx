import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Share2,
  Crown,
  Medal,
  Award,
  ExternalLink
} from 'lucide-react'

const hot100Data = [
  {
    rank: 1,
    previousRank: 1,
    title: 'Tampa Dreams',
    artist: 'Tom Petty',
    spotifyId: '2UZMlIwnkgAEDBsw1Rejkn',
    cover: 'https://picsum.photos/seed/hot1/100/100',
    streams: '2.4M',
    weeksOnChart: 12,
    peak: 1
  },
  {
    rank: 2,
    previousRank: 4,
    title: 'Sunshine State',
    artist: 'Flo Rida',
    spotifyId: '0jnsk9HBra6NMjO2oANoPY',
    cover: 'https://picsum.photos/seed/hot2/100/100',
    streams: '1.8M',
    weeksOnChart: 8,
    peak: 2
  },
  {
    rank: 3,
    previousRank: 2,
    title: 'Downtown Vibes',
    artist: 'Rick Ross',
    spotifyId: '1sBkRIssrMs1AbVkOJbc7a',
    cover: 'https://picsum.photos/seed/hot3/100/100',
    streams: '1.6M',
    weeksOnChart: 15,
    peak: 1
  },
  {
    rank: 4,
    previousRank: 6,
    title: 'Gulf Coast Anthem',
    artist: 'Pitbull',
    spotifyId: '0TnOYISbd1XYRBk9myaseg',
    cover: 'https://picsum.photos/seed/hot4/100/100',
    streams: '1.2M',
    weeksOnChart: 6,
    peak: 4
  },
  {
    rank: 5,
    previousRank: 3,
    title: 'Ybor Nights',
    artist: 'Trick Daddy',
    spotifyId: '5gAT3wNqPbHYgxyarLkpbj',
    cover: 'https://picsum.photos/seed/hot5/100/100',
    streams: '1.1M',
    weeksOnChart: 20,
    peak: 1
  },
]

function getRankIcon(rank) {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400" />
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />
    default:
      return null
  }
}

function getMovement(current, previous) {
  const diff = previous - current
  if (diff > 0) {
    return (
      <span className="flex items-center gap-1 text-green-400 text-sm">
        <TrendingUp className="w-4 h-4" />
        +{diff}
      </span>
    )
  } else if (diff < 0) {
    return (
      <span className="flex items-center gap-1 text-red-400 text-sm">
        <TrendingDown className="w-4 h-4" />
        {diff}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-muted-foreground text-sm">
      <Minus className="w-4 h-4" />
    </span>
  )
}

function ChartRow({ item, index, onArtistClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={`group flex items-center gap-4 p-4 rounded-xl transition-all ${
        item.rank <= 3 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/50'
      }`}
    >
      {/* Rank */}
      <div className="w-12 text-center">
        <div className="flex items-center justify-center gap-1">
          {getRankIcon(item.rank)}
          <span className={`text-2xl font-bold ${item.rank <= 3 ? 'text-gradient-gold' : ''}`}>
            {item.rank}
          </span>
        </div>
        {getMovement(item.rank, item.previousRank)}
      </div>

      {/* Album Art */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={item.cover}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-6 h-6 text-white fill-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold truncate">{item.title}</h4>
        <button
          onClick={() => onArtistClick?.(item.spotifyId, item.artist)}
          className="text-sm text-muted-foreground truncate hover:text-primary hover:underline transition-colors text-left"
        >
          {item.artist}
        </button>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <div className="text-center">
          <div className="font-semibold text-foreground">{item.streams}</div>
          <div className="text-xs">streams</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-foreground">{item.weeksOnChart}</div>
          <div className="text-xs">weeks</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-foreground">#{item.peak}</div>
          <div className="text-xs">peak</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Share2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export function Hot100Section({ onArtistClick }) {
  return (
    <section id="hot100" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            <Trophy className="w-4 h-4 mr-1" />
            Weekly Charts
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Tampa <span className="text-gradient-gold">Hot 100</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The definitive ranking of Tampa Bay's top 100 songs, updated every Sunday based on streaming data, radio airplay, and social engagement.
          </p>
        </motion.div>

        {/* Chart Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  This Week's Chart
                </CardTitle>
                <Badge variant="secondary">Updated Dec 15, 2025</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {hot100Data.map((item, index) => (
                <ChartRow key={item.rank} item={item} index={index} onArtistClick={onArtistClick} />
              ))}

              <div className="pt-4 text-center">
                <Button variant="outline" size="lg" className="gap-2">
                  View Full Hot 100
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Additional Charts */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { title: 'Biggest Gainers', icon: TrendingUp, color: 'text-green-400' },
            { title: 'New Entries', icon: Award, color: 'text-primary' },
            { title: 'All-Time Legends', icon: Crown, color: 'text-yellow-400' },
          ].map((chart, index) => {
            const Icon = chart.icon
            return (
              <motion.div
                key={chart.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:glow-green-sm transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className={`w-6 h-6 ${chart.color}`} />
                      <h3 className="font-semibold">{chart.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      See who's making moves on this week's chart.
                    </p>
                    <Button variant="ghost" size="sm" className="group-hover:text-primary transition-colors">
                      Explore
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
