import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/context/AuthContext'
import {
  ArrowLeft,
  User,
  Globe,
  Settings,
  Music,
  Link,
  Save,
  Check,
  Instagram,
  Twitter,
  Youtube,
  ExternalLink,
  Bell,
  Eye,
  MessageSquare,
  Mail,
  Trash2,
  ListMusic,
  CheckCircle2,
  Plug,
  Unplug,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Plus,
  X,
  Loader2,
  Search,
} from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

// Social platform configurations
const socialPlatforms = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourprofile' },
  { key: 'twitter', label: 'X (Twitter)', icon: Twitter, placeholder: 'https://x.com/yourprofile' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@yourchannel' },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    placeholder: 'https://tiktok.com/@yourprofile'
  },
  {
    key: 'soundcloud',
    label: 'SoundCloud',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.185c-.041 0-.075.036-.084.087l-.175 1.072.18 1.081c.007.048.043.084.084.084.043 0 .075-.036.084-.085l.204-1.08-.204-1.072c-.01-.05-.041-.087-.089-.087zm1.775-.727c-.059 0-.104.052-.109.1l-.21 1.78.21 1.767c.005.058.05.104.109.104.059 0 .104-.046.11-.104l.237-1.767-.237-1.78c-.006-.06-.051-.1-.11-.1z"/>
      </svg>
    ),
    placeholder: 'https://soundcloud.com/yourprofile'
  },
  { key: 'appleMusic', label: 'Apple Music', icon: Music, placeholder: 'https://music.apple.com/artist/...' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
]

export function UserSettings() {
  const navigate = useNavigate()
  const {
    user,
    token,
    updateProfile,
    updateSocialLinks,
    updateSettings,
    updateUser,
    signOut,
    addEvent,
    deleteEvent,
  } = useAuth()

  const [profileForm, setProfileForm] = useState({
    artistName: user?.artistName || '',
    bio: user?.bio || '',
    genres: user?.genres?.join(', ') || '',
  })

  const [socialLinksForm, setSocialLinksForm] = useState(user?.socialLinks || {})
  const [settingsForm, setSettingsForm] = useState(user?.settings || {})
  const [saved, setSaved] = useState({})
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: '',
    venue: '',
    address: '',
    date: '',
    time: '',
    description: '',
    ticketUrl: '',
    price: '',
  })

  // Spotify URL linking state
  const [spotifyUrlInput, setSpotifyUrlInput] = useState('')
  const [spotifyLoading, setSpotifyLoading] = useState(false)
  const [spotifyData, setSpotifyData] = useState(null)
  const [spotifyPreview, setSpotifyPreview] = useState(null)

  // Fetch Spotify artist preview
  const handleSpotifyPreview = async () => {
    if (!spotifyUrlInput.trim()) {
      toast.error('Please enter a Spotify artist URL')
      return
    }

    setSpotifyLoading(true)
    setSpotifyPreview(null)

    try {
      const response = await fetch(`${API_URL}/api/spotify/artist?url=${encodeURIComponent(spotifyUrlInput)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch artist')
      }

      setSpotifyPreview(data)
    } catch (error) {
      toast.error('Could not find artist', {
        description: error.message || 'Please check the URL and try again',
      })
    } finally {
      setSpotifyLoading(false)
    }
  }

  // Link Spotify artist to profile
  const handleSpotifyLink = async () => {
    if (!spotifyPreview) return

    setSpotifyLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/spotify/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ spotifyUrl: spotifyUrlInput }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link Spotify')
      }

      // Update local user state
      updateUser(data.user)
      setSpotifyData(data.spotifyData)
      setSpotifyPreview(null)
      setSpotifyUrlInput('')

      toast.success('Spotify linked!', {
        description: `Connected as ${data.spotifyData.name}`,
      })
    } catch (error) {
      toast.error('Failed to link Spotify', {
        description: error.message,
      })
    } finally {
      setSpotifyLoading(false)
    }
  }

  // Unlink Spotify from profile
  const handleSpotifyUnlink = async () => {
    setSpotifyLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/spotify/link`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink Spotify')
      }

      updateUser(data.user)
      setSpotifyData(null)

      toast.success('Spotify unlinked')
    } catch (error) {
      toast.error('Failed to unlink Spotify', {
        description: error.message,
      })
    } finally {
      setSpotifyLoading(false)
    }
  }

  const handleProfileSave = () => {
    updateProfile({
      artistName: profileForm.artistName,
      bio: profileForm.bio,
      genres: profileForm.genres.split(',').map(g => g.trim()).filter(Boolean),
    })
    setSaved({ ...saved, profile: true })
    setTimeout(() => setSaved({ ...saved, profile: false }), 2000)
  }

  const handleSocialLinksSave = () => {
    updateSocialLinks(socialLinksForm)
    setSaved({ ...saved, social: true })
    setTimeout(() => setSaved({ ...saved, social: false }), 2000)
  }

  const handleSettingsSave = () => {
    updateSettings(settingsForm)
    setSaved({ ...saved, settings: true })
    setTimeout(() => setSaved({ ...saved, settings: false }), 2000)
  }

  const handleAddEvent = () => {
    if (!eventForm.title || !eventForm.date || !eventForm.venue) return
    addEvent(eventForm)
    setEventForm({
      title: '',
      venue: '',
      address: '',
      date: '',
      time: '',
      description: '',
      ticketUrl: '',
      price: '',
    })
    setShowEventForm(false)
  }

  const handleDeleteEvent = (eventId) => {
    deleteEvent(eventId)
  }

  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile, social links, and preferences.
          </p>
        </motion.div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="gap-2">
              <Plug className="w-4 h-4" />
              <span className="hidden sm:inline">Connect</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">Links</span>
            </TabsTrigger>
            <TabsTrigger value="playlist" className="gap-2">
              <ListMusic className="w-4 h-4" />
              <span className="hidden sm:inline">Playlist</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Prefs</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your public profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="artistName">Artist Name</Label>
                  <Input
                    id="artistName"
                    value={profileForm.artistName}
                    onChange={(e) => setProfileForm({ ...profileForm, artistName: e.target.value })}
                    placeholder="Your artist name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell your story..."
                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {profileForm.bio.length}/500
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genres">Genres</Label>
                  <Input
                    id="genres"
                    value={profileForm.genres}
                    onChange={(e) => setProfileForm({ ...profileForm, genres: e.target.value })}
                    placeholder="Hip-Hop, R&B, Pop (comma separated)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple genres with commas
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    Profile URL:
                    <button
                      onClick={() => navigate(`/u/${user?.profileSlug}`)}
                      className="text-primary hover:underline font-mono"
                    >
                      /u/{user?.profileSlug}
                    </button>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <Button onClick={handleProfileSave} className="gap-2">
                    {saved.profile ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Upcoming Events
                    </CardTitle>
                    <CardDescription>
                      Add your upcoming shows, performances, and appearances.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowEventForm(!showEventForm)} className="gap-2">
                    {showEventForm ? (
                      <>
                        <X className="w-4 h-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Event
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Add Event Form */}
                {showEventForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 border border-border rounded-lg bg-secondary/30"
                  >
                    <h4 className="font-semibold mb-4">New Event</h4>
                    <div className="grid gap-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="eventTitle">Event Title *</Label>
                          <Input
                            id="eventTitle"
                            value={eventForm.title}
                            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                            placeholder="Live at The Ritz"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventVenue">Venue *</Label>
                          <Input
                            id="eventVenue"
                            value={eventForm.venue}
                            onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                            placeholder="The Ritz Ybor"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="eventAddress">Address</Label>
                        <Input
                          id="eventAddress"
                          value={eventForm.address}
                          onChange={(e) => setEventForm({ ...eventForm, address: e.target.value })}
                          placeholder="1503 E 7th Ave, Tampa, FL"
                        />
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="eventDate">Date *</Label>
                          <Input
                            id="eventDate"
                            type="date"
                            value={eventForm.date}
                            onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventTime">Time</Label>
                          <Input
                            id="eventTime"
                            type="time"
                            value={eventForm.time}
                            onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventPrice">Price</Label>
                          <Input
                            id="eventPrice"
                            value={eventForm.price}
                            onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })}
                            placeholder="$25"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="eventDescription">Description</Label>
                        <textarea
                          id="eventDescription"
                          value={eventForm.description}
                          onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                          placeholder="Tell people about this event..."
                          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="eventTicketUrl">Ticket URL</Label>
                        <Input
                          id="eventTicketUrl"
                          value={eventForm.ticketUrl}
                          onChange={(e) => setEventForm({ ...eventForm, ticketUrl: e.target.value })}
                          placeholder="https://tickets.example.com/your-event"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={handleAddEvent} className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add Event
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Events List */}
                {(user?.events || []).length > 0 ? (
                  <div className="space-y-4">
                    {user.events
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card"
                        >
                          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-primary/10 flex-shrink-0">
                            <span className="text-xs text-muted-foreground uppercase">
                              {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-xl font-bold text-primary">
                              {new Date(event.date + 'T00:00:00').getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{event.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.venue}
                              </span>
                              {event.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.time}
                                </span>
                              )}
                              {event.price && (
                                <span className="flex items-center gap-1">
                                  <Ticket className="w-3 h-3" />
                                  {event.price}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {event.ticketUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(event.ticketUrl, '_blank')}
                                className="gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Tickets
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No upcoming events</p>
                    <p className="text-sm text-muted-foreground">
                      Add your shows and performances to let fans know where to find you.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="w-5 h-5 text-primary" />
                  Spotify Artist Profile
                </CardTitle>
                <CardDescription>
                  Link your Spotify artist profile to display your music, stats, and top tracks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Currently linked Spotify */}
                {user?.spotifyId ? (
                  <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#1DB954]/20 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="#1DB954" className="w-7 h-7">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">Spotify Connected</h4>
                            <Badge variant="outline" className="gap-1 text-green-400 border-green-400/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Linked
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Artist ID: {user.spotifyId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.spotifyUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(user.spotifyUrl, '_blank')}
                            className="gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSpotifyUnlink}
                          disabled={spotifyLoading}
                          className="text-red-400 hover:text-red-300"
                        >
                          {spotifyLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Unplug className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Spotify URL Input */}
                    <div className="space-y-3">
                      <Label htmlFor="spotifyUrl">Spotify Artist URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="spotifyUrl"
                          value={spotifyUrlInput}
                          onChange={(e) => setSpotifyUrlInput(e.target.value)}
                          placeholder="https://open.spotify.com/artist/..."
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSpotifyPreview}
                          disabled={spotifyLoading || !spotifyUrlInput.trim()}
                          className="gap-2"
                        >
                          {spotifyLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                          Find
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Paste your Spotify artist profile URL to link your music
                      </p>
                    </div>

                    {/* Spotify Preview */}
                    {spotifyPreview && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border border-border bg-secondary/30"
                      >
                        <div className="flex items-center gap-4">
                          {spotifyPreview.image ? (
                            <img
                              src={spotifyPreview.image}
                              alt={spotifyPreview.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                              <Music className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{spotifyPreview.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {spotifyPreview.followers?.toLocaleString()} followers
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {spotifyPreview.genres?.slice(0, 3).map((genre) => (
                                <Badge key={genre} variant="secondary" className="text-xs">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={handleSpotifyLink}
                            disabled={spotifyLoading}
                            className="gap-2 bg-[#1DB954] hover:bg-[#1ed760]"
                          >
                            {spotifyLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Plug className="w-4 h-4" />
                            )}
                            Link Profile
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                {/* Other Platforms - Coming Soon */}
                <div className="pt-4 border-t border-border space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">More platforms coming soon</h4>

                  {/* Apple Music - Coming Soon */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FA233B] to-[#FB5C74] flex items-center justify-center">
                        <Music className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Apple Music</h4>
                        <p className="text-sm text-muted-foreground">
                          Link your Apple Music artist profile
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>

                  {/* SoundCloud - Coming Soon */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#FF5500]/20 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="#FF5500" className="w-6 h-6">
                          <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.185c-.041 0-.075.036-.084.087l-.175 1.072.18 1.081c.007.048.043.084.084.084.043 0 .075-.036.084-.085l.204-1.08-.204-1.072c-.01-.05-.041-.087-.089-.087zm1.775-.727c-.059 0-.104.052-.109.1l-.21 1.78.21 1.767c.005.058.05.104.109.104.059 0 .104-.046.11-.104l.237-1.767-.237-1.78c-.006-.06-.051-.1-.11-.1z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold">SoundCloud</h4>
                        <p className="text-sm text-muted-foreground">
                          Link your SoundCloud profile
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>

                  {/* YouTube Music - Coming Soon */}
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#FF0000]/20 flex items-center justify-center">
                        <Youtube className="w-6 h-6 text-[#FF0000]" />
                      </div>
                      <div>
                        <h4 className="font-semibold">YouTube</h4>
                        <p className="text-sm text-muted-foreground">
                          Link your YouTube channel
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Links Tab */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Social Links
                </CardTitle>
                <CardDescription>
                  Add your social media profiles and website.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialPlatforms.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <div key={platform.key} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={platform.key} className="text-sm font-medium">
                          {platform.label}
                        </Label>
                        <Input
                          id={platform.key}
                          value={socialLinksForm[platform.key] || ''}
                          onChange={(e) =>
                            setSocialLinksForm({ ...socialLinksForm, [platform.key]: e.target.value })
                          }
                          placeholder={platform.placeholder}
                          className="mt-1"
                        />
                      </div>
                      {socialLinksForm[platform.key] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(socialLinksForm[platform.key], '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button onClick={handleSocialLinksSave} className="gap-2">
                    {saved.social ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Links
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playlist Tab */}
          <TabsContent value="playlist">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-primary" />
                  Featured Playlist
                </CardTitle>
                <CardDescription>
                  Choose a Spotify playlist to feature on your profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {playlists.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                          featuredPlaylist?.id === playlist.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-secondary/50 hover:bg-secondary/70'
                        }`}
                        onClick={() => setFeaturedPlaylistById(playlist.id)}
                      >
                        {playlist.images?.[0]?.url ? (
                          <img
                            src={playlist.images[0].url}
                            alt={playlist.name}
                            className="w-12 h-12 rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                            <ListMusic className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{playlist.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {playlist.tracks?.total || 0} tracks
                          </p>
                        </div>
                        {featuredPlaylist?.id === playlist.id && (
                          <Badge className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Connect your Spotify account to select a featured playlist.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to view your profile
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.profileVisible ?? true}
                    onCheckedChange={(checked) =>
                      setSettingsForm({ ...settingsForm, profileVisible: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Stats</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your streaming statistics publicly
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.showStats ?? true}
                    onCheckedChange={(checked) =>
                      setSettingsForm({ ...settingsForm, showStats: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Allow Messages
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Let other users send you messages
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.allowMessages ?? true}
                    onCheckedChange={(checked) =>
                      setSettingsForm({ ...settingsForm, allowMessages: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your profile and stats
                    </p>
                  </div>
                  <Switch
                    checked={settingsForm.emailNotifications ?? true}
                    onCheckedChange={(checked) =>
                      setSettingsForm({ ...settingsForm, emailNotifications: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end mb-6">
              <Button onClick={handleSettingsSave} className="gap-2">
                {saved.settings ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>

            {/* Danger Zone */}
            <Card className="border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sign Out</p>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account on this device
                    </p>
                  </div>
                  <Button variant="outline" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="font-medium text-red-400">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive" disabled>
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
