import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { useAudioPlayer } from '@/components/audio/AudioPlayer'
import { PersonalizedFeed, formatNumber } from '@/components/feed'
import { ClaimProfileModal } from './ClaimProfileModal'
import { Loader2, Rss, UserCheck } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
} from 'recharts'
import {
  MapPin,
  Settings,
  Music,
  Play,
  Pause,
  ExternalLink,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Link,
  Check,
  Users,
  Disc3,
  ListMusic,
  Share2,
  Edit3,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Ticket,
  TrendingUp,
  Image,
  Headphones,
  Heart,
  Album,
  Mic2,
  Trophy,
} from 'lucide-react'

// Social icons mapping
const socialIcons = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  soundcloud: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.185c-.041 0-.075.036-.084.087l-.175 1.072.18 1.081c.007.048.043.084.084.084.043 0 .075-.036.084-.085l.204-1.08-.204-1.072c-.01-.05-.041-.087-.089-.087zm1.775-.727c-.059 0-.104.052-.109.1l-.21 1.78.21 1.767c.005.058.05.104.109.104.059 0 .104-.046.11-.104l.237-1.767-.237-1.78c-.006-.06-.051-.1-.11-.1zm.867-.195c-.068 0-.117.059-.124.115l-.189 1.89.189 1.867c.007.06.056.115.124.115.065 0 .114-.055.123-.115l.213-1.867-.213-1.89c-.009-.065-.058-.115-.123-.115zm.875-.235c-.076 0-.131.062-.137.127l-.166 2.013.166 1.965c.006.065.061.127.137.127.074 0 .129-.062.136-.127l.189-1.965-.189-2.013c-.007-.065-.062-.127-.136-.127zm.875-.139c-.085 0-.145.072-.151.143l-.143 2.038.143 1.927c.006.07.066.141.151.141.085 0 .145-.072.151-.141l.162-1.927-.162-2.038c-.006-.07-.066-.143-.151-.143zm.879-.14c-.093 0-.157.078-.163.157l-.12 2.063.12 1.889c.006.079.07.157.163.157.092 0 .156-.078.162-.157l.137-1.889-.137-2.063c-.006-.079-.07-.157-.162-.157zm.872-.155c-.1 0-.17.084-.176.17l-.097 2.103.097 1.851c.006.087.076.17.176.17.099 0 .169-.083.176-.17l.111-1.851-.111-2.103c-.007-.086-.077-.17-.176-.17zm.895-.167c-.108 0-.182.09-.188.184l-.074 2.153.074 1.813c.006.094.08.184.188.184.107 0 .181-.09.188-.184l.084-1.813-.084-2.153c-.007-.094-.081-.184-.188-.184zm.873-.09c-.114 0-.193.096-.199.198l-.052 2.152.052 1.775c.006.1.085.197.199.197.114 0 .193-.097.2-.197l.059-1.775-.059-2.152c-.007-.102-.086-.198-.2-.198zm.931-.062c-.123 0-.208.102-.213.212l-.028 2.152.028 1.737c.005.109.09.212.213.212.121 0 .206-.103.212-.212l.033-1.737-.033-2.152c-.006-.11-.091-.212-.212-.212zm.868.037c-.121 0-.213.108-.213.224v3.85c0 .116.092.223.213.223.123 0 .213-.107.213-.223l.018-1.699-.018-2.152c0-.116-.09-.223-.213-.223zm3.023-.713c-.267 0-.522.044-.764.116-.161-1.825-1.703-3.262-3.578-3.262-.466 0-.92.092-1.338.257-.159.063-.212.126-.214.251v6.378c.002.129.096.237.223.249 0 0 5.659.003 5.671.003 1.337 0 2.423-1.086 2.423-2.423 0-1.338-1.086-2.424-2.423-2.424z"/>
    </svg>
  ),
  appleMusic: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.99c-.042.003-.083.01-.124.013-.5.032-.999.09-1.486.198a4.94 4.94 0 00-1.955.84C1.332 1.965.633 3.107.336 4.484a10.46 10.46 0 00-.18 1.622c-.003.04-.01.083-.013.124v11.54c.003.042.01.083.013.124.032.5.09.999.198 1.486.311 1.31 1.062 2.31 2.18 3.043.544.358 1.147.6 1.796.748.498.115 1.006.17 1.518.19.042.003.083.01.124.013h12.02c.042-.003.083-.01.124-.013a9.225 9.225 0 002.19-.24c1.31-.317 2.31-1.062 3.043-2.18a5.022 5.022 0 00.726-1.877c.115-.498.17-1.006.19-1.518.003-.042.01-.083.013-.124V6.248c-.003-.042-.01-.083-.013-.124zM17.997 11.462l-.006.017v5.075a2.153 2.153 0 01-.362 1.199 2.117 2.117 0 01-.96.805c-.376.178-.787.27-1.202.27-.26 0-.522-.033-.778-.1a2.823 2.823 0 01-.726-.3 2.142 2.142 0 01-.57-.496 2.167 2.167 0 01-.378-.66 2.153 2.153 0 01-.134-.737c0-.326.058-.643.174-.95.116-.306.28-.583.492-.828a2.33 2.33 0 01.756-.594c.29-.154.613-.257.968-.31.354-.052.688-.038 1.002.042V10.39l-5.44 1.2v6.076a2.153 2.153 0 01-.362 1.199 2.117 2.117 0 01-.96.805c-.376.178-.787.27-1.202.27-.26 0-.522-.033-.778-.1a2.823 2.823 0 01-.726-.3 2.142 2.142 0 01-.57-.496 2.167 2.167 0 01-.378-.66 2.153 2.153 0 01-.134-.737c0-.326.058-.643.174-.95.116-.306.28-.583.492-.828a2.33 2.33 0 01.756-.594c.29-.154.613-.257.968-.31.354-.052.688-.038 1.002.042V9.218c0-.138.027-.27.082-.395a.947.947 0 01.234-.331.949.949 0 01.345-.214l6.078-1.574a.945.945 0 01.246-.033.826.826 0 01.592.247.815.815 0 01.247.592v3.952z"/>
    </svg>
  ),
  website: Globe,
}

const socialLabels = {
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  youtube: 'YouTube',
  appleMusic: 'Apple Music',
  tiktok: 'TikTok',
  soundcloud: 'SoundCloud',
  appleMusic: 'Apple Music',
  website: 'Website',
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-primary">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Format duration from ms to mm:ss
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function UserProfilePage({ profileSlug, isOwnProfile = false }) {
  const navigate = useNavigate()
  const { user, featuredPlaylist, isApproved, isAuthenticated, followArtist, unfollowArtist, checkFollowStatus, likeTrack, unlikeTrack, checkTrackLikeStatus } = useAuth()
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer()
  const [copied, setCopied] = useState(false)
  const [fetchedProfile, setFetchedProfile] = useState(null)
  const [appleMusicData, setAppleMusicData] = useState(null)
  const [eventsData, setEventsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [singlesVisible, setSinglesVisible] = useState(12)
  const [rankingData, setRankingData] = useState({ rank: null, total: 0 })
  const [similarArtists, setSimilarArtists] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [platformFollowers, setPlatformFollowers] = useState(0)
  const [followLoading, setFollowLoading] = useState(false)
  const [likedTrackIds, setLikedTrackIds] = useState(new Set())
  const [trackLikeCounts, setTrackLikeCounts] = useState({})
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [isClaimableProfile, setIsClaimableProfile] = useState(false)

  // Fetch profile data for public profiles
  useEffect(() => {
    if (isOwnProfile || !profileSlug) {
      setFetchedProfile(null)
      setAppleMusicData(null)
      setEventsData([])
      setSinglesVisible(12)
      return
    }

    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      setSinglesVisible(12) // Reset lazy loading on new profile
      try {
        const response = await fetch(`${API_URL}/api/profile/${profileSlug}`)
        if (!response.ok) {
          throw new Error('Profile not found')
        }
        const data = await response.json()
        setFetchedProfile(data.profile)
        setAppleMusicData(data.artistData)
        setEventsData(data.events || [])
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [profileSlug, isOwnProfile])

  // Check if profile is claimable (admin-generated profiles)
  useEffect(() => {
    const checkClaimable = async () => {
      if (!fetchedProfile?.id || isOwnProfile) {
        setIsClaimableProfile(false)
        return
      }

      try {
        const response = await fetch(`${API_URL}/api/claims/check/${fetchedProfile.id}`)
        if (response.ok) {
          const data = await response.json()
          setIsClaimableProfile(data.isClaimable)
        }
      } catch (err) {
        console.error('Failed to check if profile is claimable:', err)
        setIsClaimableProfile(false)
      }
    }

    checkClaimable()
  }, [fetchedProfile?.id, isOwnProfile])

  // Fetch ranking data
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch(`${API_URL}/api/artists/hot100?limit=1000`)
        if (response.ok) {
          const data = await response.json()
          const artists = data.artists || []

          // Determine which profile to check
          const targetProfile = isOwnProfile ? user : fetchedProfile

          if (targetProfile?.appleMusicId) {
            const artistIndex = artists.findIndex(a => a.appleMusicId === targetProfile.appleMusicId)
            if (artistIndex !== -1) {
              setRankingData({
                rank: artistIndex + 1,
                total: artists.length,
              })
            }
          } else if (targetProfile?.id) {
            const artistIndex = artists.findIndex(a => a.id === targetProfile.id)
            if (artistIndex !== -1) {
              setRankingData({
                rank: artistIndex + 1,
                total: artists.length,
              })
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch ranking:', err)
      }
    }

    // Only fetch if we have profile data
    if ((isOwnProfile && user) || fetchedProfile) {
      fetchRanking()
    }
  }, [isOwnProfile, user, fetchedProfile])

  // Fetch similar artists based on genres
  useEffect(() => {
    const fetchSimilarArtists = async () => {
      // Determine which profile to check
      const targetProfile = isOwnProfile ? user : fetchedProfile
      const targetAppleMusicData = isOwnProfile ? null : appleMusicData

      // Get genres from profile or Apple Music data
      const profileGenres = targetProfile?.genres || []
      const appleMusicGenres = targetAppleMusicData?.genres || []
      const allGenres = [...new Set([...profileGenres, ...appleMusicGenres])]
        .map(g => g.toLowerCase())

      if (allGenres.length === 0 && !targetProfile?.appleMusicId) {
        setSimilarArtists([])
        return
      }

      try {
        const response = await fetch(`${API_URL}/api/artists/hot100?limit=100`)
        if (response.ok) {
          const data = await response.json()
          const artists = data.artists || []

          // Filter out current artist and find similar by genre overlap
          const similar = artists
            .filter(a => {
              // Exclude current artist
              if (a.appleMusicId && a.appleMusicId === targetProfile?.appleMusicId) return false
              if (a.id === targetProfile?.id) return false
              return true
            })
            .map(a => {
              const artistGenres = (a.genres || '').toLowerCase().split(',').map(g => g.trim())
              const genreOverlap = allGenres.filter(g =>
                artistGenres.some(ag => ag.includes(g) || g.includes(ag))
              ).length

              return { ...a, genreOverlap }
            })
            .filter(a => a.genreOverlap > 0)
            .sort((a, b) => b.genreOverlap - a.genreOverlap || b.popularity - a.popularity)
            .slice(0, 6)

          setSimilarArtists(similar)
        }
      } catch (err) {
        console.error('Failed to fetch similar artists:', err)
      }
    }

    // Only fetch if we have profile data
    if ((isOwnProfile && user) || (fetchedProfile && appleMusicData)) {
      fetchSimilarArtists()
    }
  }, [isOwnProfile, user, fetchedProfile, appleMusicData])

  // Check follow status for public profiles
  useEffect(() => {
    const checkFollow = async () => {
      if (isOwnProfile || !fetchedProfile?.id || !isAuthenticated) return

      try {
        const status = await checkFollowStatus(fetchedProfile.id)
        setIsFollowing(status.isFollowing)
        setPlatformFollowers(status.followerCount)
      } catch (err) {
        console.error('Error checking follow status:', err)
      }
    }

    checkFollow()
  }, [isOwnProfile, fetchedProfile?.id, isAuthenticated, checkFollowStatus])

  // Check like status for tracks when Apple Music data loads
  useEffect(() => {
    if (!appleMusicData?.topTracks?.length) return
    const checkLikes = async () => {
      const liked = new Set()
      const counts = {}
      await Promise.all(
        appleMusicData.topTracks.map(async (track) => {
          if (!track.id) return
          if (isAuthenticated) {
            const data = await checkTrackLikeStatus(track.id)
            if (data.isLiked) liked.add(track.id)
            counts[track.id] = data.likeCount || 0
          }
        })
      )
      setLikedTrackIds(liked)
      setTrackLikeCounts(counts)
    }
    checkLikes()
  }, [appleMusicData, isAuthenticated])

  // Handle track like/unlike
  const handleTrackLike = async (e, track) => {
    e.stopPropagation()
    if (!isAuthenticated || !track.id) return
    try {
      if (likedTrackIds.has(track.id)) {
        const result = await unlikeTrack(track.id)
        setLikedTrackIds(prev => {
          const next = new Set(prev)
          next.delete(track.id)
          return next
        })
        setTrackLikeCounts(prev => ({ ...prev, [track.id]: result.likeCount || 0 }))
        toast('Removed from liked tracks', { icon: '💔' })
      } else {
        const result = await likeTrack(track.id, {
          trackName: track.name,
          artistName: fetchedProfile?.artistName || '',
          albumImage: track.albumImage || null,
          trackUrl: track.url || null,
        })
        setLikedTrackIds(prev => new Set(prev).add(track.id))
        setTrackLikeCounts(prev => ({ ...prev, [track.id]: result.likeCount || 0 }))
        toast(`Liked "${track.name}"`, { icon: '❤️' })
      }
    } catch (err) {
      console.error('Track like error:', err)
      toast.error('Failed to update like')
    }
  }

  // Handle follow/unfollow
  const handleFollowClick = async () => {
    if (!isAuthenticated || !fetchedProfile?.id) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        const result = await unfollowArtist(fetchedProfile.id)
        setIsFollowing(false)
        setPlatformFollowers(result.followerCount)
      } else {
        const result = await followArtist(fetchedProfile.id)
        setIsFollowing(true)
        setPlatformFollowers(result.followerCount)
      }
    } catch (err) {
      console.error('Follow/unfollow error:', err)
    } finally {
      setFollowLoading(false)
    }
  }

  // Use own profile data or fetched profile data
  const profileData = isOwnProfile ? user : fetchedProfile

  // Set dynamic meta tags for SEO
  useDocumentMeta({
    title: profileData?.artistName
      ? `${profileData.artistName} — Tampa Mixtape`
      : 'Tampa Mixtape — Tampa Bay\'s Music Radar',
    description: profileData?.bio
      || `Discover ${profileData?.artistName || 'artists'} on Tampa Mixtape — Tampa Bay's Music Radar`,
    image: profileData?.avatar || 'https://tampamixtape.com/og-image.png',
    url: profileData?.profileSlug
      ? `https://tampamixtape.com/${profileData.profileSlug}`
      : 'https://tampamixtape.com/',
  })

  // Show loading state for public profiles
  if (!isOwnProfile && loading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profileData || error) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This profile doesn't exist or hasn't been approved yet.
          </p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    )
  }

  // Determine if this is a verified/approved artist
  const isVerifiedArtist = profileData.status === 'APPROVED'

  // Transform individual URL fields to socialLinks object for consistency
  const socialLinksFromProfile = {
    ...(profileData.instagramUrl && { instagram: profileData.instagramUrl }),
    ...(profileData.twitterUrl && { twitter: profileData.twitterUrl }),
    ...(profileData.websiteUrl && { website: profileData.websiteUrl }),
    ...(profileData.appleMusicUrl && { appleMusic: profileData.appleMusicUrl }),
  }

  // Use socialLinks from profile data or construct from individual fields
  const socialLinks = profileData.socialLinks || socialLinksFromProfile

  // Map avatar field (database uses 'avatar', component may expect 'profileImage')
  const profileImage = profileData.profileImage || profileData.avatar

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/${profileData.profileSlug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const activeSocialLinks = Object.entries(socialLinks)
    .filter(([, value]) => value && value.trim())

  // Dynamic artwork colors from Apple Music
  const artworkColors = appleMusicData?.artwork
  const heroBg = artworkColors?.bgColor ? `#${artworkColors.bgColor}` : null
  const heroAccent = artworkColors?.textColor3 ? `#${artworkColors.textColor3}` : null

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero Section */}
      <div className="relative">
        {/* Header Image / Gradient - Dynamic colors from artwork */}
        <div
          className="h-48 md:h-64 relative overflow-hidden"
          style={heroBg ? {
            background: `linear-gradient(135deg, ${heroBg}40 0%, ${heroAccent || heroBg}20 50%, transparent 100%)`,
          } : undefined}
        >
          {profileData.headerImage ? (
            <img
              src={profileData.headerImage}
              alt="Header"
              className="w-full h-full object-cover"
            />
          ) : appleMusicData?.latestReleases?.[0]?.image || profileImage ? (
            <>
              <img
                src={appleMusicData?.latestReleases?.[0]?.image || profileImage}
                alt="Header"
                className="w-full h-full object-cover scale-110 blur-2xl opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 -mt-24">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Profile Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-background flex-shrink-0 glow-green"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={profileData.artistName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Music className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </motion.div>

            {/* Profile Info */}
            <div className="flex-1 pb-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {profileData.region || 'Tampa Bay'}
                  </Badge>
                  {isVerifiedArtist && (
                    <Badge className="gap-1 bg-primary/20 text-primary border-primary/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Artist
                    </Badge>
                  )}
                </div>

                <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight mb-2">
                  {profileData.artistName}
                </h1>

                {(profileData.bio || appleMusicData?.editorialNotes?.standard) && (
                  <div className="max-w-xl mb-4">
                    <p className="text-muted-foreground">
                      {profileData.bio || appleMusicData.editorialNotes.standard.replace(/<[^>]*>/g, '').slice(0, 300)}
                      {!profileData.bio && appleMusicData.editorialNotes.standard.length > 300 && '...'}
                    </p>
                    {!profileData.bio && (
                      <span className="text-xs text-muted-foreground/50 mt-1 inline-block">via Apple Music</span>
                    )}
                  </div>
                )}

                {/* Genres - from Apple Music data */}
                {(appleMusicData?.genres?.length > 0 || profileData.genres?.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(appleMusicData?.genres || profileData.genres || []).map((genre) => (
                      <Badge key={genre} variant="secondary" className="capitalize">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pb-4">
              {isOwnProfile && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate('/settings')}
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </Button>
              )}
              {!isOwnProfile && isAuthenticated && (
                <Button
                  variant={isFollowing ? "secondary" : "default"}
                  className="gap-2"
                  onClick={handleFollowClick}
                  disabled={followLoading}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <Users className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              {/* Claim Profile Button - show for claimable profiles to non-owners */}
              {isClaimableProfile && !isOwnProfile && (
                <Button
                  variant="outline"
                  className="gap-2 border-primary/50 hover:border-primary hover:bg-primary/10"
                  onClick={() => setShowClaimModal(true)}
                >
                  <UserCheck className="w-4 h-4" />
                  Claim Profile
                </Button>
              )}
              {/* Share Dropdown */}
              <div className="relative group">
                <Button
                  variant="outline"
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-1">
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const url = `https://tampamixtape.com/${profileData.profileSlug}`
                        const text = `Check out ${profileData.artistName} on Tampa Mixtape!`
                        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      Share on X
                    </button>
                    <button
                      onClick={() => {
                        const url = `https://tampamixtape.com/${profileData.profileSlug}`
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Share on Facebook
                    </button>
                    {profileData.instagramUrl && (
                      <button
                        onClick={() => window.open(profileData.instagramUrl, '_blank')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                        View on Instagram
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {platformFollowers > 0 && !isOwnProfile && (
                <Badge variant="outline" className="h-9 px-3 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {platformFollowers} {platformFollowers === 1 ? 'follower' : 'followers'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="music" className="gap-2">
              <Music className="w-4 h-4" />
              Music
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <Image className="w-4 h-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2">
              <Globe className="w-4 h-4" />
              Links
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="analytics" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            )}
            {isOwnProfile && (
              <TabsTrigger value="activity" className="gap-2">
                <Rss className="w-4 h-4" />
                Activity
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-mono text-3xl font-bold text-primary">
                          {profileData.demandScore || 0}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">
                          {profileData.demandScoreTier ? (
                            <span className={
                              profileData.demandScoreTier === 'breakout' ? 'text-red-400' :
                              profileData.demandScoreTier === 'trending' ? 'text-orange-400' :
                              profileData.demandScoreTier === 'radar' ? 'text-yellow-400' :
                              profileData.demandScoreTier === 'building' ? 'text-blue-400' :
                              'text-muted-foreground'
                            }>
                              {profileData.demandScoreTier === 'breakout' ? '🔥 Breakout' :
                               profileData.demandScoreTier === 'trending' ? '📈 Trending' :
                               profileData.demandScoreTier === 'radar' ? '👀 On the Radar' :
                               profileData.demandScoreTier === 'building' ? '🧱 Building' : '🌱 Emerging'}
                            </span>
                          ) : 'Demand Score'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Album className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-mono text-3xl font-bold">
                          {appleMusicData?.totalAlbums || 0}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Albums</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mic2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-mono text-3xl font-bold">
                          {appleMusicData?.totalSingles || 0}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Singles</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-mono text-3xl font-bold">
                          {platformFollowers || 0}
                        </div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Followers</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Latest Release Highlight */}
            {appleMusicData?.latestReleases?.[0] && (
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Latest Release
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent cursor-pointer hover:from-primary/20 transition-colors"
                    onClick={() => window.open(appleMusicData.latestReleases[0].url, '_blank')}
                  >
                    <img
                      src={appleMusicData.latestReleases[0].image}
                      alt={appleMusicData.latestReleases[0].name}
                      className="w-40 h-40 rounded-lg shadow-2xl"
                    />
                    <div className="flex-1 text-center md:text-left">
                      <Badge variant="outline" className="mb-2 capitalize">
                        {appleMusicData.latestReleases[0].type}
                      </Badge>
                      <h3 className="text-2xl font-bold mb-2">{appleMusicData.latestReleases[0].name}</h3>
                      <p className="text-muted-foreground mb-4">
                        Released {new Date(appleMusicData.latestReleases[0].releaseDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center gap-4 justify-center md:justify-start">
                        <Badge variant="secondary">
                          {appleMusicData.latestReleases[0].totalTracks || appleMusicData.latestReleases[0].trackCount || 0} track{(appleMusicData.latestReleases[0].totalTracks || appleMusicData.latestReleases[0].trackCount || 0) !== 1 ? 's' : ''}
                        </Badge>
                        <Button size="sm" className="gap-2">
                          <Play className="w-4 h-4" />
                          Listen on Apple Music
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Artists — prefer Apple Music data, fallback to genre matching */}
            {(appleMusicData?.similarArtists?.length > 0 || similarArtists.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg uppercase tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Fans Also Like
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {(appleMusicData?.similarArtists?.length > 0
                      ? appleMusicData.similarArtists.slice(0, 6)
                      : similarArtists
                    ).map((artist, index) => {
                      // Apple Music similar artists have different field names
                      const name = artist.artistName || artist.name
                      const image = artist.avatar || artist.artwork
                      const genreText = artist.genres
                        ? (Array.isArray(artist.genres) ? artist.genres[0] : artist.genres.split(',')[0])
                        : 'Artist'
                      const linkUrl = artist.profileSlug ? `/${artist.profileSlug}` : artist.url

                      return (
                        <motion.div
                          key={artist.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="group cursor-pointer text-center"
                          onClick={() => {
                            if (artist.profileSlug) navigate(`/${artist.profileSlug}`)
                            else if (artist.url) window.open(artist.url, '_blank')
                          }}
                        >
                          <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-2">
                            {image ? (
                              <img
                                src={image}
                                alt={name}
                                className="w-full h-full rounded-lg object-cover group-hover:ring-2 ring-primary ring-offset-2 ring-offset-background transition-all"
                              />
                            ) : (
                              <div className="w-full h-full rounded-lg bg-secondary flex items-center justify-center group-hover:ring-2 ring-primary ring-offset-2 ring-offset-background transition-all">
                                <Music className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <h4 className="font-medium text-sm truncate">{name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{genreText}</p>
                        </motion.div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social Links Preview */}
            {activeSocialLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Connect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {activeSocialLinks.map(([platform, url]) => {
                      const Icon = socialIcons[platform] || Globe
                      return (
                        <Button
                          key={platform}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <Icon className="w-4 h-4" />
                          {socialLabels[platform] || platform}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Featured Playlists */}
            {appleMusicData?.featuredPlaylists?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg uppercase tracking-tight flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    Featured On
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                    {appleMusicData.featuredPlaylists.map((playlist) => (
                      <motion.div
                        key={playlist.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-shrink-0 w-40 cursor-pointer group"
                        onClick={() => window.open(playlist.url, '_blank')}
                      >
                        {playlist.artwork ? (
                          <img
                            src={playlist.artwork}
                            alt={playlist.name}
                            className="w-40 h-40 rounded-lg object-cover group-hover:ring-2 ring-primary transition-all"
                          />
                        ) : (
                          <div className="w-40 h-40 rounded-lg bg-secondary flex items-center justify-center">
                            <Music className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-sm font-medium mt-2 truncate">{playlist.name}</p>
                        <p className="text-xs text-muted-foreground">Apple Music Playlist</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Music Videos */}
            {appleMusicData?.musicVideos?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg uppercase tracking-tight flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    Music Videos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {appleMusicData.musicVideos.map((video) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group cursor-pointer"
                        onClick={() => window.open(video.url, '_blank')}
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
                          {video.artwork ? (
                            <img
                              src={video.artwork}
                              alt={video.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="w-10 h-10 text-white" />
                          </div>
                          {video.contentRating === 'explicit' && (
                            <Badge className="absolute top-2 left-2 bg-red-500/80 text-white text-[10px] px-1.5">E</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-2 truncate">{video.name}</p>
                        {video.durationMs && (
                          <p className="text-xs font-mono text-muted-foreground">
                            {Math.floor(video.durationMs / 60000)}:{String(Math.floor((video.durationMs % 60000) / 1000)).padStart(2, '0')}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Music Data Message */}
            {!appleMusicData && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-lg font-bold uppercase mb-2">No Music Data</h3>
                  <p className="text-muted-foreground">
                    This artist hasn't linked their Apple Music profile yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="space-y-6">
            {appleMusicData ? (
              <>
                {/* Top Tracks */}
                {appleMusicData.topTracks?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Headphones className="w-5 h-5 text-primary" />
                        Top Tracks
                        {appleMusicData.topTracks.some(t => t.previewUrl) && (
                          <Badge variant="secondary" className="text-[10px] ml-2">
                            30s Previews Available
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {appleMusicData.topTracks.map((track, index) => {
                          const isCurrentTrack = currentTrack?.id === track.id
                          const isTrackPlaying = isCurrentTrack && isPlaying

                          return (
                            <motion.div
                              key={track.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex items-center gap-4 p-3 rounded-lg transition-colors cursor-pointer group ${
                                isCurrentTrack ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-secondary/50'
                              }`}
                              onClick={() => {
                                if (track.previewUrl) {
                                  playTrack(track, appleMusicData.topTracks, index)
                                } else {
                                  window.open(track.url, '_blank')
                                }
                              }}
                            >
                              <span className={`w-6 text-center font-medium ${isCurrentTrack ? 'text-primary' : 'text-muted-foreground'}`}>
                                {isTrackPlaying ? (
                                  <span className="flex items-center justify-center gap-0.5">
                                    <span className="w-0.5 h-3 bg-primary rounded-full animate-pulse" />
                                    <span className="w-0.5 h-4 bg-primary rounded-full animate-pulse delay-75" />
                                    <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse delay-150" />
                                  </span>
                                ) : (
                                  index + 1
                                )}
                              </span>
                              <div className="relative">
                                <img
                                  src={track.albumImage}
                                  alt={track.albumName}
                                  className={`w-12 h-12 rounded ${isTrackPlaying ? 'ring-2 ring-primary' : ''}`}
                                />
                                {track.previewUrl && (
                                  <div className={`absolute inset-0 bg-black/50 rounded flex items-center justify-center ${
                                    isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                  } transition-opacity`}>
                                    {isTrackPlaying ? (
                                      <Pause className="w-5 h-5 text-white" />
                                    ) : (
                                      <Play className="w-5 h-5 text-white ml-0.5" />
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${isCurrentTrack ? 'text-primary' : ''}`}>
                                  {track.name}
                                  {track.contentRating === 'explicit' && (
                                    <span className="inline-flex items-center justify-center w-4 h-4 ml-1.5 text-[9px] font-bold bg-muted-foreground/20 text-muted-foreground rounded align-middle">E</span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground truncate">{track.albumName}</div>
                              </div>
                              <div className="hidden md:flex items-center gap-4">
                                <div className="w-24">
                                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full"
                                      style={{ width: `${track.popularity}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-sm text-muted-foreground w-12">
                                  {formatDuration(track.durationMs || track.duration)}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 flex-shrink-0"
                                onClick={(e) => handleTrackLike(e, track)}
                                title={isAuthenticated ? (likedTrackIds.has(track.id) ? 'Unlike' : 'Like') : 'Sign in to like tracks'}
                              >
                                <motion.div
                                  whileTap={{ scale: 0.75 }}
                                  animate={likedTrackIds.has(track.id) ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                  className="inline-flex"
                                >
                                  <Heart className={`w-5 h-5 transition-colors ${likedTrackIds.has(track.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground/60 hover:text-red-400'}`} />
                                </motion.div>
                              </Button>
                              {(trackLikeCounts[track.id] || 0) > 0 && (
                                <span className="text-xs text-muted-foreground min-w-[1ch]">{trackLikeCounts[track.id]}</span>
                              )}
                              {!track.previewUrl && (
                                <Badge variant="outline" className="text-[10px] opacity-0 group-hover:opacity-100">
                                  Open Apple Music
                                </Badge>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Albums */}
                {appleMusicData.discography?.albums?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Album className="w-5 h-5 text-primary" />
                        Albums
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {appleMusicData.discography.albums.map((album, index) => (
                          <motion.div
                            key={album.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group cursor-pointer"
                            onClick={() => window.open(album.url, '_blank')}
                          >
                            <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                              <img
                                src={album.image}
                                alt={album.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-12 h-12 text-white" />
                              </div>
                              {album.contentRating === 'explicit' && (
                                <Badge className="absolute top-2 left-2 bg-red-500/80 text-white text-[10px] px-1.5">E</Badge>
                              )}
                              {album.audioVariants?.includes('dolby-atmos') && (
                                <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5">Atmos</Badge>
                              )}
                            </div>
                            <h4 className="font-medium truncate">{album.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(album.releaseDate + 'T00:00:00').getFullYear()} · {album.totalTracks || album.trackCount || 0} tracks
                            </p>
                            {album.recordLabel && (
                              <p className="text-xs text-muted-foreground/60 truncate">{album.recordLabel}</p>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Singles & EPs */}
                {appleMusicData.discography?.singles?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Disc3 className="w-5 h-5 text-primary" />
                        Singles & EPs
                        <Badge variant="secondary" className="ml-2">
                          {appleMusicData.discography.singles.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {appleMusicData.discography.singles.slice(0, singlesVisible).map((single, index) => (
                          <motion.div
                            key={single.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(index, 11) * 0.03 }}
                            className="group cursor-pointer"
                            onClick={() => window.open(single.url, '_blank')}
                          >
                            <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                              <img
                                src={single.image}
                                alt={single.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                            </div>
                            <h4 className="font-medium text-sm truncate">{single.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(single.releaseDate).getFullYear()}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                      {appleMusicData.discography.singles.length > singlesVisible && (
                        <div className="flex justify-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setSinglesVisible(prev => prev + 12)}
                            className="gap-2"
                          >
                            <ListMusic className="w-4 h-4" />
                            Load More ({appleMusicData.discography.singles.length - singlesVisible} remaining)
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Disc3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Music Data</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect an Apple Music artist profile to display music here.
                  </p>
                  {isOwnProfile && (
                    <Button onClick={() => navigate('/settings')} className="gap-2">
                      <Settings className="w-4 h-4" />
                      Go to Settings
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            {appleMusicData?.latestReleases?.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Image className="w-5 h-5 text-primary" />
                    Album Artwork Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Collect all unique album art */}
                    {[
                      ...new Map(
                        [...(appleMusicData.discography?.albums || []), ...(appleMusicData.discography?.singles || [])]
                          .filter(item => item.image)
                          .map(item => [item.image, item])
                      ).values()
                    ].slice(0, 16).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group cursor-pointer relative aspect-square"
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-3">
                          <div>
                            <h4 className="font-medium text-white text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-white/70">{new Date(item.releaseDate).getFullYear()}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Gallery Images</h3>
                  <p className="text-muted-foreground">
                    Album artwork will appear here once Apple Music data is connected.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Events
                  {eventsData.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {eventsData.length} show{eventsData.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsData.length > 0 ? (
                  <div className="space-y-4">
                    {eventsData
                      .filter(event => event.date && new Date(event.date) >= new Date(new Date().toDateString()))
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((event, index) => (
                        <motion.div
                          key={event.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
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
                              {event.location && event.location !== event.venue && (
                                <span className="text-muted-foreground">
                                  {event.location}
                                </span>
                              )}
                              {event.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.time}
                                </span>
                              )}
                            </div>
                            {event.lineup && event.lineup.length > 1 && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Also featuring: {event.lineup.slice(1).join(', ')}
                              </p>
                            )}
                          </div>
                          {event.ticketUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(event.ticketUrl, '_blank')}
                              className="gap-1 flex-shrink-0"
                            >
                              <Ticket className="w-3 h-3" />
                              Tickets
                            </Button>
                          )}
                        </motion.div>
                      ))}
                  </div>
                ) : (profileData.events || []).length > 0 ? (
                  // Fallback to profile events (user-added)
                  <div className="space-y-4">
                    {profileData.events
                      .filter(event => new Date(event.date) >= new Date(new Date().toDateString()))
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
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
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Ticket className="w-3 h-3" />
                                  {event.price}
                                </Badge>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          {event.ticketUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(event.ticketUrl, '_blank')}
                              className="gap-1 flex-shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Tickets
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No upcoming events found.</p>
                    <p className="text-sm text-muted-foreground">
                      Events are automatically fetched from Bandsintown when available.
                    </p>
                    {isOwnProfile && (
                      <Button onClick={() => navigate('/settings')} variant="outline" className="gap-2 mt-4">
                        <Edit3 className="w-4 h-4" />
                        Add Events
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  All Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSocialLinks.length > 0 ? (
                  <div className="space-y-3">
                    {activeSocialLinks.map(([platform, url]) => {
                      const Icon = socialIcons[platform] || Globe
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{socialLabels[platform] || platform}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {url}
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </a>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Link className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No social links added yet.</p>
                    {isOwnProfile && (
                      <Button onClick={() => navigate('/settings')} variant="outline" className="gap-2">
                        <Edit3 className="w-4 h-4" />
                        Add Links
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab - Only for own profile */}
          {isOwnProfile && (
            <TabsContent value="analytics" className="space-y-6">
              {/* Analytics Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Your Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Track your performance on Tampa Mixtape. Data updates in real-time.
                  </p>
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        #{rankingData.rank || '—'}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Tampa Ranking</p>
                      <p className="text-xs text-muted-foreground">of {rankingData.total} artists</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {appleMusicData?.popularity || 0}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Popularity Score</p>
                      <p className="text-xs text-muted-foreground">out of 100</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {formatNumber(appleMusicData?.followers || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Followers</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {platformFollowers}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Platform Followers</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Popularity Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Popularity Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Popularity</span>
                          <span className="font-medium">{appleMusicData?.popularity || 0}/100</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${appleMusicData?.popularity || 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Tampa Rank Percentile</span>
                          <span className="font-medium">
                            {rankingData.rank && rankingData.total
                              ? `Top ${Math.round((rankingData.rank / rankingData.total) * 100)}%`
                              : '—'}
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{
                              width: rankingData.rank && rankingData.total
                                ? `${100 - ((rankingData.rank / rankingData.total) * 100)}%`
                                : '0%'
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Profile Completion</span>
                          <span className="font-medium">
                            {(() => {
                              let score = 0
                              if (profileData.artistName) score += 20
                              if (profileData.bio) score += 20
                              if (profileData.avatar) score += 20
                              if (profileData.appleMusicUrl) score += 20
                              if (profileData.instagramUrl) score += 20
                              return `${score}%`
                            })()}
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{
                              width: (() => {
                                let score = 0
                                if (profileData.artistName) score += 20
                                if (profileData.bio) score += 20
                                if (profileData.avatar) score += 20
                                if (profileData.appleMusicUrl) score += 20
                                if (profileData.instagramUrl) score += 20
                                return `${score}%`
                              })()
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Headphones className="w-5 h-5 text-primary" />
                          <span>Top Tracks</span>
                        </div>
                        <span className="font-bold">{appleMusicData?.topTracks?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Album className="w-5 h-5 text-primary" />
                          <span>Albums</span>
                        </div>
                        <span className="font-bold">{appleMusicData?.discography?.albums?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Disc3 className="w-5 h-5 text-primary" />
                          <span>Singles & EPs</span>
                        </div>
                        <span className="font-bold">{appleMusicData?.discography?.singles?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-primary" />
                          <span>Upcoming Events</span>
                        </div>
                        <span className="font-bold">{eventsData?.filter(e => new Date(e.date) > new Date()).length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tips Card */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Tips to Improve Your Ranking</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Release new music consistently to boost your popularity</li>
                        <li>• Share your Tampa Mixtape profile on social media</li>
                        <li>• Complete your profile with all social links</li>
                        <li>• Add upcoming events to engage with fans</li>
                        <li>• Encourage fans to follow you on the platform</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Activity Tab - Personalized Feed */}
          {isOwnProfile && (
            <TabsContent value="activity" className="space-y-6">
              <PersonalizedFeed />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Claim Profile Modal */}
      {isClaimableProfile && (
        <ClaimProfileModal
          open={showClaimModal}
          onOpenChange={setShowClaimModal}
          profile={fetchedProfile}
        />
      )}
    </div>
  )
}
