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
import { AvatarCropModal } from './AvatarCropModal'
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
  Lock,
  Camera,
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

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [cropImage, setCropImage] = useState(null)

  const [profileForm, setProfileForm] = useState({
    artistName: user?.artistName || '',
    bio: user?.bio || '',
    genres: user?.genres?.join(', ') || '',
    region: user?.region || 'Tampa Bay',
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

  // Apple Music URL linking state
  const [appleMusicUrlInput, setAppleMusicUrlInput] = useState('')
  const [appleMusicLoading, setAppleMusicLoading] = useState(false)
  const [appleMusicData, setAppleMusicData] = useState(null)
  const [appleMusicPreview, setAppleMusicPreview] = useState(null)

  // Fetch Apple Music artist preview
  const handleAppleMusicPreview = async () => {
    if (!appleMusicUrlInput.trim()) {
      toast.error('Please enter an Apple Music artist URL')
      return
    }

    setAppleMusicLoading(true)
    setAppleMusicPreview(null)

    try {
      const response = await fetch(`${API_URL}/api/music/artist?url=${encodeURIComponent(appleMusicUrlInput)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch artist')
      }

      setAppleMusicPreview(data)
    } catch (error) {
      toast.error('Could not find artist', {
        description: error.message || 'Please check the URL and try again',
      })
    } finally {
      setAppleMusicLoading(false)
    }
  }

  // Link Apple Music artist to profile
  const handleAppleMusicLink = async () => {
    if (!appleMusicPreview) return

    setAppleMusicLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/music/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appleMusicUrl: appleMusicUrlInput }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link Apple Music')
      }

      // Update local user state
      updateUser(data.user)
      setAppleMusicData(data.artistData)
      setAppleMusicPreview(null)
      setAppleMusicUrlInput('')

      toast.success('Apple Music linked!', {
        description: `Connected as ${data.artistData.name}`,
      })
    } catch (error) {
      toast.error('Failed to link Apple Music', {
        description: error.message,
      })
    } finally {
      setAppleMusicLoading(false)
    }
  }

  // Unlink Apple Music from profile
  const handleAppleMusicUnlink = async () => {
    setAppleMusicLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/music/link`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink Apple Music')
      }

      updateUser(data.user)
      setAppleMusicData(null)

      toast.success('Apple Music unlinked')
    } catch (error) {
      toast.error('Failed to unlink Apple Music', {
        description: error.message,
      })
    } finally {
      setAppleMusicLoading(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => setCropImage(ev.target.result)
    reader.onerror = () => toast.error('Failed to read image file')
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropSave = (croppedDataUri) => {
    setAvatarPreview(croppedDataUri)
    setAvatarFile(true) // flag that avatar changed
  }

  const handleProfileSave = async () => {
    setAvatarUploading(true)
    try {
      const profileData = {
        artistName: profileForm.artistName,
        bio: profileForm.bio,
        genres: profileForm.genres.split(',').map(g => g.trim()).filter(Boolean),
        region: profileForm.region,
      }

      // Include avatar if a new file was selected
      if (avatarFile) {
        profileData.avatar = avatarPreview // base64 data URI
      }

      await updateProfile(profileData)
      setAvatarFile(null) // clear pending file
      setSaved({ ...saved, profile: true })
      setTimeout(() => setSaved({ ...saved, profile: false }), 2000)
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setAvatarUploading(false)
    }
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
                {/* Profile Photo */}
                <div className="space-y-2">
                  <Label>Profile Photo</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera className="w-5 h-5 text-white" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="avatar-upload" className="text-sm text-primary hover:underline cursor-pointer">
                        {avatarPreview ? 'Change photo' : 'Upload photo'}
                      </label>
                      <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Max 1.5MB.</p>
                    </div>
                  </div>
                </div>

                {user?.role === 'ARTIST' && (
                  <>
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
                      <Label htmlFor="genres" className="flex items-center gap-2">
                        Genres
                        {user?.genresLocked && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            <Lock className="w-3 h-3 mr-1" />
                            Protected
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="genres"
                        value={profileForm.genres}
                        onChange={(e) => setProfileForm({ ...profileForm, genres: e.target.value })}
                        placeholder="Hip-Hop, R&B, Pop (comma separated)"
                      />
                      <p className="text-xs text-muted-foreground">
                        {user?.genresLocked
                          ? "Your custom genres are protected from auto-sync updates"
                          : "Separate multiple genres with commas. Once edited, your genres will be protected from auto-sync."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <select
                          id="region"
                          value={profileForm.region}
                          onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                          className="flex-1 h-10 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="Tampa Bay">Tampa Bay</option>
                          <option value="St. Pete">St. Pete</option>
                        </select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your location in the Tampa Bay area
                      </p>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    Profile URL:
                    <button
                      onClick={() => navigate(`/${user?.profileSlug}`)}
                      className="text-primary hover:underline font-mono"
                    >
                      /{user?.profileSlug}
                    </button>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <Button onClick={handleProfileSave} disabled={avatarUploading} className="gap-2">
                    {avatarUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : saved.profile ? (
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
                  Apple Music Artist Profile
                </CardTitle>
                <CardDescription>
                  Link your Apple Music artist profile to display your music, stats, and top tracks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Currently linked Apple Music */}
                {user?.appleMusicId ? (
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FA233B] to-[#FB5C74] flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">Apple Music Connected</h4>
                            <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Linked
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Artist ID: {user.appleMusicId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.appleMusicUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(user.appleMusicUrl, '_blank')}
                            className="gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleAppleMusicUnlink}
                          disabled={appleMusicLoading}
                          className="text-red-400 hover:text-red-300"
                        >
                          {appleMusicLoading ? (
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
                    {/* Apple Music URL Input */}
                    <div className="space-y-3">
                      <Label htmlFor="appleMusicUrl">Apple Music Artist URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="appleMusicUrl"
                          value={appleMusicUrlInput}
                          onChange={(e) => setAppleMusicUrlInput(e.target.value)}
                          placeholder="https://music.apple.com/artist/..."
                          className="flex-1"
                        />
                        <Button
                          onClick={handleAppleMusicPreview}
                          disabled={appleMusicLoading || !appleMusicUrlInput.trim()}
                          className="gap-2"
                        >
                          {appleMusicLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                          Find
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Paste your Apple Music artist profile URL to link your music
                      </p>
                    </div>

                    {/* Apple Music Preview */}
                    {appleMusicPreview && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border border-border bg-secondary/30"
                      >
                        <div className="flex items-center gap-4">
                          {appleMusicPreview.image ? (
                            <img
                              src={appleMusicPreview.image}
                              alt={appleMusicPreview.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                              <Music className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{appleMusicPreview.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {appleMusicPreview.followers?.toLocaleString()} followers
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {appleMusicPreview.genres?.slice(0, 3).map((genre) => (
                                <Badge key={genre} variant="secondary" className="text-xs">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            onClick={handleAppleMusicLink}
                            disabled={appleMusicLoading}
                            className="gap-2"
                          >
                            {appleMusicLoading ? (
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

      <AvatarCropModal
        imageSrc={cropImage}
        isOpen={!!cropImage}
        onClose={() => setCropImage(null)}
        onSave={handleCropSave}
      />
    </div>
  )
}
