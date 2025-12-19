import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ExternalLink,
  Search,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Music,
  Users,
  Star,
  Zap,
} from 'lucide-react'

// Sample events data - in production this would come from API/database
const allEvents = [
  {
    id: 1,
    title: 'Live at The Ritz Ybor',
    artist: 'Demo Artist',
    artistSlug: 'demo-artist',
    artistImage: 'https://picsum.photos/seed/artist1/100/100',
    venue: 'The Ritz Ybor',
    address: '1503 E 7th Ave, Tampa, FL',
    date: '2025-12-28',
    time: '21:00',
    price: '$25',
    ticketUrl: '#',
    category: 'Hip-Hop',
    featured: true,
    description: 'End of year showcase featuring Tampa Bay\'s hottest artists.',
  },
  {
    id: 2,
    title: 'New Year\'s Eve Bash',
    artist: 'Tampa Flow',
    artistSlug: 'tampa-flow',
    artistImage: 'https://picsum.photos/seed/artist2/100/100',
    venue: 'Crowbar Tampa',
    address: '1812 N 17th St, Tampa, FL',
    date: '2025-12-31',
    time: '22:00',
    price: '$40',
    ticketUrl: '#',
    category: 'Hip-Hop',
    featured: true,
    description: 'Ring in 2026 with live performances and DJ sets all night.',
  },
  {
    id: 3,
    title: 'Winter Showcase',
    artist: 'Bay City Beats',
    artistSlug: 'bay-city-beats',
    artistImage: 'https://picsum.photos/seed/artist3/100/100',
    venue: 'The Orpheum',
    address: '1902 Republica de Cuba, Tampa, FL',
    date: '2026-01-10',
    time: '20:00',
    price: '$20',
    ticketUrl: '#',
    category: 'R&B',
    featured: false,
    description: 'Smooth R&B vibes to warm up your winter.',
  },
  {
    id: 4,
    title: 'Hip-Hop Night',
    artist: 'Ybor Kings',
    artistSlug: 'ybor-kings',
    artistImage: 'https://picsum.photos/seed/artist4/100/100',
    venue: 'The Attic',
    address: '1808 N 15th St, Tampa, FL',
    date: '2026-01-15',
    time: '21:30',
    price: '$15',
    ticketUrl: '#',
    category: 'Hip-Hop',
    featured: false,
    description: 'Weekly hip-hop showcase featuring local talent.',
  },
  {
    id: 5,
    title: 'Acoustic Sessions',
    artist: 'Tampa Strings',
    artistSlug: 'tampa-strings',
    artistImage: 'https://picsum.photos/seed/artist5/100/100',
    venue: 'The Independent',
    address: '5016 N Florida Ave, Tampa, FL',
    date: '2026-01-18',
    time: '19:00',
    price: '$10',
    ticketUrl: '#',
    category: 'Acoustic',
    featured: false,
    description: 'Intimate acoustic performances in a cozy setting.',
  },
  {
    id: 6,
    title: 'Latin Nights',
    artist: 'Fuego Tampa',
    artistSlug: 'fuego-tampa',
    artistImage: 'https://picsum.photos/seed/artist6/100/100',
    venue: 'Centro Asturiano',
    address: '1913 N Nebraska Ave, Tampa, FL',
    date: '2026-01-22',
    time: '21:00',
    price: '$30',
    ticketUrl: '#',
    category: 'Latin',
    featured: true,
    description: 'Hot Latin rhythms and live performances.',
  },
  {
    id: 7,
    title: 'Rock the Bay',
    artist: 'Coastline',
    artistSlug: 'coastline',
    artistImage: 'https://picsum.photos/seed/artist7/100/100',
    venue: 'Jannus Live',
    address: '200 1st Ave N, St. Petersburg, FL',
    date: '2026-01-25',
    time: '20:00',
    price: '$35',
    ticketUrl: '#',
    category: 'Rock',
    featured: false,
    description: 'Tampa Bay\'s best rock bands take the stage.',
  },
  {
    id: 8,
    title: 'Electronic Vibes',
    artist: 'DJ Sunset',
    artistSlug: 'dj-sunset',
    artistImage: 'https://picsum.photos/seed/artist8/100/100',
    venue: 'The RITZ Ybor',
    address: '1503 E 7th Ave, Tampa, FL',
    date: '2026-02-01',
    time: '22:00',
    price: '$25',
    ticketUrl: '#',
    category: 'Electronic',
    featured: false,
    description: 'EDM night with Tampa\'s top DJs.',
  },
]

const categories = ['All', 'Hip-Hop', 'R&B', 'Rock', 'Latin', 'Electronic', 'Acoustic']

const venues = [
  { name: 'All Venues', count: allEvents.length },
  { name: 'The Ritz Ybor', count: 2 },
  { name: 'Crowbar Tampa', count: 1 },
  { name: 'The Orpheum', count: 1 },
  { name: 'Jannus Live', count: 1 },
]

function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function FeaturedEventCard({ event }) {
  const navigate = useNavigate()
  const eventDate = new Date(event.date + 'T00:00:00')
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
  const day = eventDate.getDate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card border-primary/20 glow-green-sm h-full">
        <CardContent className="p-0">
          <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/5 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Music className="w-16 h-16 text-primary/20" />
            </div>
            <Badge className="absolute top-3 left-3 gap-1 bg-primary/90">
              <Star className="w-3 h-3" />
              Featured
            </Badge>
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <img
                src={event.artistImage}
                alt={event.artist}
                className="w-10 h-10 rounded-full border-2 border-background"
              />
            </div>
          </div>
          <div className="p-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 flex-shrink-0">
                <span className="text-xs text-muted-foreground uppercase">{month}</span>
                <span className="text-xl font-bold text-primary">{day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{event.title}</h3>
                <button
                  onClick={() => navigate(`/${event.artistSlug}`)}
                  className="text-sm text-primary hover:underline truncate block"
                >
                  {event.artist}
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{event.venue}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(event.time)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {event.price}
                </Badge>
              </div>
            </div>
            <Button className="w-full mt-4 gap-2" size="sm">
              <Ticket className="w-4 h-4" />
              Get Tickets
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function EventListItem({ event, index }) {
  const navigate = useNavigate()
  const eventDate = new Date(event.date + 'T00:00:00')
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
  const day = eventDate.getDate()
  const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' })

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden hover:glow-green-sm transition-all group">
        <CardContent className="p-0">
          <div className="flex">
            {/* Date Column */}
            <div className="flex flex-col items-center justify-center w-20 sm:w-24 py-4 bg-primary/10 border-r border-border flex-shrink-0">
              <span className="text-xs text-muted-foreground uppercase">{weekday}</span>
              <span className="text-2xl sm:text-3xl font-bold text-primary">{day}</span>
              <span className="text-xs text-muted-foreground uppercase">{month}</span>
            </div>

            {/* Event Info */}
            <div className="flex-1 p-4">
              <div className="flex items-start gap-3">
                <img
                  src={event.artistImage}
                  alt={event.artist}
                  className="w-10 h-10 rounded-full border border-border flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {event.title}
                    </h4>
                    {event.featured && (
                      <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                        <Star className="w-3 h-3" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/${event.artistSlug}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    {event.artist}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.venue}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(event.time)}
                </span>
                <Badge variant="secondary" className="text-xs gap-1">
                  <Ticket className="w-3 h-3" />
                  {event.price}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {event.category}
                </Badge>
              </div>

              {event.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                  {event.description}
                </p>
              )}
            </div>

            {/* Action */}
            <div className="flex items-center pr-4">
              <Button variant="outline" size="sm" className="gap-1 hidden sm:flex">
                <ExternalLink className="w-4 h-4" />
                Tickets
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function EventsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isApproved } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState('list')

  const featuredEvents = allEvents.filter(e => e.featured)

  const filteredEvents = allEvents.filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory

    return matchesSearch && matchesCategory
  }).sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge variant="outline" className="mb-4">
              <Calendar className="w-4 h-4 mr-1" />
              Tampa Bay Events
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Upcoming <span className="text-gradient">Shows</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Discover live music events from Tampa Bay's hottest artists. Never miss a show in your area.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search events, artists, or venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{allEvents.length}</div>
              <div className="text-sm text-muted-foreground">Upcoming Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{new Set(allEvents.map(e => e.artist)).size}</div>
              <div className="text-sm text-muted-foreground">Artists</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{new Set(allEvents.map(e => e.venue)).size}</div>
              <div className="text-sm text-muted-foreground">Venues</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{categories.length - 1}</div>
              <div className="text-sm text-muted-foreground">Genres</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Featured Events
              </h2>
              <p className="text-muted-foreground">Don't miss these highlighted shows</p>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <FeaturedEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* All Events */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="flex-wrap h-auto gap-1">
                  {categories.map((cat) => (
                    <TabsTrigger key={cat} value={cat} className="text-sm">
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Events List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Calendar className="w-6 h-6 text-primary" />
              All Upcoming Events
            </h2>
            <p className="text-muted-foreground">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </motion.div>

          {filteredEvents.length > 0 ? (
            viewMode === 'list' ? (
              <div className="space-y-4">
                {filteredEvents.map((event, index) => (
                  <EventListItem key={event.id} event={event} index={index} />
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <FeaturedEventCard key={event.id} event={event} />
                ))}
              </div>
            )
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Venue Spotlight */}
      <section className="py-12 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold mb-2">Popular Venues</h2>
            <p className="text-muted-foreground">Tampa Bay's best spots for live music</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {venues.slice(1).map((venue, index) => (
              <motion.div
                key={venue.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:glow-green-sm transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{venue.name}</h4>
                      <p className="text-sm text-muted-foreground">{venue.count} upcoming events</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary/20 via-card to-primary/10 border-primary/20 overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge variant="outline" className="mb-4">
                    <Sparkles className="w-4 h-4 mr-1" />
                    For Artists
                  </Badge>
                  <h2 className="text-3xl font-bold mb-4">
                    Promote Your Shows to<br />
                    <span className="text-gradient">Tampa Bay</span>
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Join TampaMixtape to add your upcoming events and reach thousands of local music fans.
                    Get featured placement and boost your visibility.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {isAuthenticated && isApproved ? (
                      <Button size="lg" className="gap-2" onClick={() => navigate('/settings')}>
                        <Calendar className="w-5 h-5" />
                        Add Your Events
                      </Button>
                    ) : (
                      <Button size="lg" className="gap-2" onClick={() => navigate('/')}>
                        <Zap className="w-5 h-5" />
                        Join TampaMixtape
                      </Button>
                    )}
                    <Button variant="outline" size="lg" className="gap-2">
                      <Users className="w-5 h-5" />
                      Learn More
                    </Button>
                  </div>
                </div>
                <div className="hidden lg:flex justify-center">
                  <div className="relative">
                    <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center animate-float">
                      <div className="w-36 h-36 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/30 flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
