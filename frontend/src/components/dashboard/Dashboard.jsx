import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Users,
  Play,
  Music,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Link2,
  Save,
  CheckCircle2,
  ExternalLink,
  Settings,
  LogOut,
  Sparkles,
  AlertCircle,
} from 'lucide-react'

const mockAnalyticsData = [
  { date: 'Mon', streams: 1200, listeners: 450 },
  { date: 'Tue', streams: 1350, listeners: 520 },
  { date: 'Wed', streams: 1180, listeners: 480 },
  { date: 'Thu', streams: 1520, listeners: 610 },
  { date: 'Fri', streams: 2100, listeners: 890 },
  { date: 'Sat', streams: 2450, listeners: 1020 },
  { date: 'Sun', streams: 2200, listeners: 950 },
]

const mockPlatformData = [
  { platform: 'Spotify', streams: 45000, color: '#1db954' },
  { platform: 'Apple', streams: 28000, color: '#fa243c' },
  { platform: 'YouTube', streams: 35000, color: '#ff0000' },
  { platform: 'SoundCloud', streams: 12000, color: '#ff5500' },
]

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Streams', value: '124.5K', change: '+12.3%', icon: Play },
          { label: 'Monthly Listeners', value: '8.2K', change: '+5.7%', icon: Users },
          { label: 'Chart Position', value: '#47', change: '+8', icon: TrendingUp },
          { label: 'Playlist Adds', value: '156', change: '+23', icon: Music },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <Badge variant="success" className="text-xs">{stat.change}</Badge>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Streams Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Streaming Performance
          </CardTitle>
          <CardDescription>Last 7 days across all platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAnalyticsData}>
                <defs>
                  <linearGradient id="streamGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="streams"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#streamGradient)"
                  name="Streams"
                />
                <Line
                  type="monotone"
                  dataKey="listeners"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Listeners"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Breakdown</CardTitle>
          <CardDescription>Streams by platform this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockPlatformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={12} />
                <YAxis type="category" dataKey="platform" stroke="#71717a" fontSize={12} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="streams"
                  radius={[0, 4, 4, 0]}
                  name="Streams"
                >
                  {mockPlatformData.map((entry, index) => (
                    <motion.rect
                      key={index}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      fill={entry.color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SocialLinksTab() {
  const { user, updateSocialLinks } = useAuth()
  const [links, setLinks] = useState(user?.socialLinks || {})
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    updateSocialLinks(links)
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const socialPlatforms = [
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@username', prefix: 'instagram.com/' },
    { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: '@username', prefix: 'twitter.com/' },
    { key: 'tiktok', label: 'TikTok', icon: Music, placeholder: '@username', prefix: 'tiktok.com/@' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'channel/username', prefix: 'youtube.com/' },
    { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yoursite.com', prefix: '' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Social Links
          </CardTitle>
          <CardDescription>
            Connect your social profiles to display on your artist card
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialPlatforms.map((platform) => {
            const Icon = platform.icon
            return (
              <div key={platform.key} className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {platform.label}
                </Label>
                <div className="flex gap-2">
                  {platform.prefix && (
                    <div className="flex items-center px-3 bg-secondary rounded-l-lg border border-r-0 border-border text-sm text-muted-foreground">
                      {platform.prefix}
                    </div>
                  )}
                  <Input
                    placeholder={platform.placeholder}
                    value={links[platform.key] || ''}
                    onChange={(e) => setLinks({ ...links, [platform.key]: e.target.value })}
                    className={platform.prefix ? 'rounded-l-none' : ''}
                  />
                </div>
              </div>
            )
          })}

          <Separator className="my-6" />

          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved!
              </>
            ) : isSaving ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function PlaylistsTab() {
  const { playlists, featuredPlaylist, setFeaturedPlaylistById, spotifyUser, loginWithSpotify } = useAuth()

  if (!spotifyUser) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#1db954]/20 flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-[#1db954]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Connect Spotify</h3>
          <p className="text-muted-foreground mb-4">
            Connect your Spotify account to select a featured playlist
          </p>
          <Button onClick={loginWithSpotify} className="gap-2 bg-[#1db954] hover:bg-[#1db954]/90">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connect Spotify
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Featured Playlist */}
      {featuredPlaylist && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle>Featured Playlist</CardTitle>
            </div>
            <CardDescription>This playlist is displayed on your artist profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {featuredPlaylist.images?.[0] && (
                <img
                  src={featuredPlaylist.images[0].url}
                  alt={featuredPlaylist.name}
                  className="w-20 h-20 rounded-lg"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold">{featuredPlaylist.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {featuredPlaylist.tracks?.total || 0} tracks
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(featuredPlaylist.external_urls?.spotify, '_blank')}
                className="gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Playlist Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Your Playlists</CardTitle>
          <CardDescription>Select a playlist to feature on your profile</CardDescription>
        </CardHeader>
        <CardContent>
          {playlists.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No playlists found. Create a playlist on Spotify to feature it here.
            </p>
          ) : (
            <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
              {playlists.map((playlist) => (
                <motion.div
                  key={playlist.id}
                  whileHover={{ scale: 1.01 }}
                  className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                    featuredPlaylist?.id === playlist.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                  }`}
                  onClick={() => setFeaturedPlaylistById(playlist.id)}
                >
                  {playlist.images?.[0] ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-12 h-12 rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                      <Music className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{playlist.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {playlist.tracks?.total || 0} tracks
                    </p>
                  </div>
                  {featuredPlaylist?.id === playlist.id && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Featured
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function Dashboard({ onClose }) {
  const { user, signOut, isVerified } = useAuth()

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Verification Required</h2>
              <p className="text-muted-foreground mb-4">
                Only Florida residents can access the full artist dashboard.
                Update your profile to verify your Florida residency.
              </p>
              <Button variant="outline" onClick={onClose}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-gradient">{user?.artistName}</span>
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              {user?.city}, {user?.state}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-red-400 hover:text-red-300">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Link2 className="w-4 h-4" />
              Social Links
            </TabsTrigger>
            <TabsTrigger value="playlists" className="gap-2">
              <Music className="w-4 h-4" />
              Playlists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="social">
            <SocialLinksTab />
          </TabsContent>

          <TabsContent value="playlists">
            <PlaylistsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
