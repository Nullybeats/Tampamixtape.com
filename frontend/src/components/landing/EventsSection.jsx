import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

// Sample events data - in production this would come from all artists
const upcomingEvents = [
  {
    id: 1,
    title: 'Live at The Ritz Ybor',
    artist: 'Demo Artist',
    artistImage: 'https://picsum.photos/seed/artist1/100/100',
    venue: 'The Ritz Ybor',
    address: '1503 E 7th Ave, Tampa, FL',
    date: '2025-12-28',
    time: '21:00',
    price: '$25',
    ticketUrl: '#',
  },
  {
    id: 2,
    title: 'New Year\'s Eve Bash',
    artist: 'Tampa Flow',
    artistImage: 'https://picsum.photos/seed/artist2/100/100',
    venue: 'Crowbar Tampa',
    address: '1812 N 17th St, Tampa, FL',
    date: '2025-12-31',
    time: '22:00',
    price: '$40',
    ticketUrl: '#',
  },
  {
    id: 3,
    title: 'Winter Showcase',
    artist: 'Bay City Beats',
    artistImage: 'https://picsum.photos/seed/artist3/100/100',
    venue: 'The Orpheum',
    address: '1902 Republica de Cuba, Tampa, FL',
    date: '2026-01-10',
    time: '20:00',
    price: '$20',
    ticketUrl: '#',
  },
  {
    id: 4,
    title: 'Hip-Hop Night',
    artist: 'Ybor Kings',
    artistImage: 'https://picsum.photos/seed/artist4/100/100',
    venue: 'The Attic',
    address: '1808 N 15th St, Tampa, FL',
    date: '2026-01-15',
    time: '21:30',
    price: '$15',
    ticketUrl: '#',
  },
]

function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

function EventCard({ event, index }) {
  const eventDate = new Date(event.date + 'T00:00:00')
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
  const day = eventDate.getDate()
  const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
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
                  <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </h4>
                  <p className="text-sm text-primary truncate">{event.artist}</p>
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
                {event.price && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Ticket className="w-3 h-3" />
                    {event.price}
                  </Badge>
                )}
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center pr-4">
              <Button variant="ghost" size="sm" className="gap-1 hidden sm:flex">
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

export function EventsSection() {
  return (
    <section id="events" className="py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">
            <Calendar className="w-4 h-4 mr-1" />
            Live Events
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Upcoming <span className="text-gradient">Shows</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Catch Tampa Bay's hottest artists live. Never miss a show in your area.
          </p>
        </motion.div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {upcomingEvents.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button variant="outline" size="lg" className="gap-2">
            View All Events
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        {/* CTA for Artists */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-card to-primary/10 border-primary/20">
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Are you an artist?</h3>
                  <p className="text-sm text-muted-foreground">
                    Add your upcoming shows to reach more fans in Tampa Bay.
                  </p>
                </div>
              </div>
              <Button className="gap-2 flex-shrink-0">
                <Calendar className="w-4 h-4" />
                Add Your Events
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
