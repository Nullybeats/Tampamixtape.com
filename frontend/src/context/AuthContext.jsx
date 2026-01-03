import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

// Approval status types (matches backend/Prisma values)
export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

// User roles (matches backend/Prisma values)
export const USER_ROLES = {
  USER: 'USER',
  ARTIST: 'ARTIST',
  ADMIN: 'ADMIN',
  // Legacy alias
  CREATOR: 'ARTIST',
}

// Sample creators for demo
const getSampleCreators = () => [
  {
    id: 'creator-001',
    artistName: 'DJ Suncoast',
    email: 'djsuncoast@email.com',
    profileSlug: 'dj-suncoast',
    role: USER_ROLES.CREATOR,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isVerified: true,
    city: 'Tampa',
    state: 'Florida',
    region: 'Tampa Bay',
    createdAt: '2025-01-15T10:00:00Z',
    bio: 'Electronic music producer bringing Tampa Bay vibes to the world.',
    profileImage: 'https://picsum.photos/seed/suncoast/400/400',
    headerImage: 'https://picsum.photos/seed/suncoastheader/1200/400',
    genres: ['Electronic', 'House', 'EDM'],
    socialLinks: {
      instagram: 'https://instagram.com/djsuncoast',
      twitter: '',
      tiktok: '',
      youtube: 'https://youtube.com/@djsuncoast',
      soundcloud: 'https://soundcloud.com/djsuncoast',
      appleMusic: '',
      website: '',
    },
    connectedPlatforms: { spotify: true, apple: false, soundcloud: true, youtube: true },
    spotifyArtistId: null,
    events: [],
  },
  {
    id: 'creator-002',
    artistName: 'Bay City Beats',
    email: 'baycitybeats@email.com',
    profileSlug: 'bay-city-beats',
    role: USER_ROLES.CREATOR,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isVerified: true,
    city: 'St. Petersburg',
    state: 'Florida',
    region: 'Tampa Bay',
    createdAt: '2025-02-01T14:30:00Z',
    bio: 'Hip-hop collective from the Bay Area representing Tampa sound.',
    profileImage: 'https://picsum.photos/seed/baycity/400/400',
    headerImage: 'https://picsum.photos/seed/baycityheader/1200/400',
    genres: ['Hip-Hop', 'Rap', 'R&B'],
    socialLinks: {
      instagram: 'https://instagram.com/baycitybeats',
      twitter: 'https://x.com/baycitybeats',
      tiktok: 'https://tiktok.com/@baycitybeats',
      youtube: '',
      soundcloud: '',
      appleMusic: '',
      website: 'https://baycitybeats.com',
    },
    connectedPlatforms: { spotify: true, apple: true, soundcloud: false, youtube: false },
    spotifyArtistId: null,
    events: [
      {
        id: 'event-bcb-1',
        title: 'Bay City Live',
        venue: 'The Orpheum',
        address: '1915 E 7th Ave, Tampa, FL',
        date: '2025-12-20',
        time: '20:00',
        description: 'Live hip-hop showcase',
        ticketUrl: 'https://example.com/tickets',
        price: '$30',
      },
    ],
  },
  {
    id: 'creator-003',
    artistName: 'Marina Sound',
    email: 'marinasound@email.com',
    profileSlug: 'marina-sound',
    role: USER_ROLES.CREATOR,
    approvalStatus: APPROVAL_STATUS.PENDING,
    isVerified: false,
    city: 'Clearwater',
    state: 'Florida',
    region: 'Tampa Bay',
    createdAt: '2025-12-10T09:15:00Z',
    bio: 'Indie rock band from Clearwater Beach.',
    profileImage: 'https://picsum.photos/seed/marina/400/400',
    headerImage: null,
    genres: ['Indie Rock', 'Alternative'],
    socialLinks: {
      instagram: 'https://instagram.com/marinasound',
      twitter: '',
      tiktok: '',
      youtube: '',
      soundcloud: '',
      appleMusic: '',
      website: '',
    },
    connectedPlatforms: { spotify: false, apple: false, soundcloud: false, youtube: false },
    spotifyArtistId: null,
    events: [],
  },
  {
    id: 'creator-004',
    artistName: 'Ybor Nights',
    email: 'ybornights@email.com',
    profileSlug: 'ybor-nights',
    role: USER_ROLES.CREATOR,
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isVerified: true,
    city: 'Tampa',
    state: 'Florida',
    region: 'Tampa Bay',
    createdAt: '2025-03-20T16:45:00Z',
    bio: 'Latin fusion DJ bringing Ybor City nightlife to your speakers.',
    profileImage: 'https://picsum.photos/seed/ybor/400/400',
    headerImage: 'https://picsum.photos/seed/yborheader/1200/400',
    genres: ['Latin', 'Reggaeton', 'Dance'],
    socialLinks: {
      instagram: 'https://instagram.com/ybornights',
      twitter: '',
      tiktok: 'https://tiktok.com/@ybornights',
      youtube: '',
      soundcloud: '',
      appleMusic: '',
      website: '',
    },
    connectedPlatforms: { spotify: true, apple: false, soundcloud: false, youtube: false },
    spotifyArtistId: null,
    events: [],
  },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [creators, setCreators] = useState([])
  // Spotify OAuth state
  const [spotifyUser, setSpotifyUser] = useState(null)
  const [spotifyArtist, setSpotifyArtist] = useState(null)
  const [spotifyConnecting, setSpotifyConnecting] = useState(false)

  // Fetch current user from API using token
  const fetchCurrentUser = async (authToken) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        localStorage.setItem('tampamixtape_user', JSON.stringify(data.user))
        return data.user
      } else {
        // Token invalid, clear it
        localStorage.removeItem('tampamixtape_token')
        localStorage.removeItem('tampamixtape_user')
        setToken(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
    return null
  }

  // Load user and creators from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('tampamixtape_token')
      const savedCreators = localStorage.getItem('tampamixtape_creators')

      if (savedToken) {
        setToken(savedToken)
        await fetchCurrentUser(savedToken)
      }
      if (savedCreators) {
        setCreators(JSON.parse(savedCreators))
      } else {
        // Initialize with sample creators for demo
        const sampleCreators = getSampleCreators()
        setCreators(sampleCreators)
        localStorage.setItem('tampamixtape_creators', JSON.stringify(sampleCreators))
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const generateProfileSlug = (artistName) => {
    return artistName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Check if artist already exists
  const isArtistRegistered = (artistName, spotifyArtistId = null) => {
    const normalizedName = artistName.toLowerCase().trim()
    return creators.some(creator => {
      // Check by Spotify ID if available
      if (spotifyArtistId && creator.spotifyArtistId === spotifyArtistId) {
        return true
      }
      // Check by name (case-insensitive)
      return creator.artistName.toLowerCase().trim() === normalizedName
    })
  }

  // Search Spotify for artists via backend
  const searchSpotifyArtists = async (query) => {
    if (!query) return []
    try {
      const response = await fetch(`${API_URL}/api/spotify/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        console.error('Spotify search failed:', response.status)
        return []
      }
      const data = await response.json()
      return data.artists || []
    } catch (error) {
      console.error('Error searching Spotify artists:', error)
      return []
    }
  }

  // Save creators to localStorage
  const saveCreators = (updatedCreators) => {
    setCreators(updatedCreators)
    localStorage.setItem('tampamixtape_creators', JSON.stringify(updatedCreators))
  }

  const signUp = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          artistName: userData.artistName,
          // Include Spotify data if provided
          ...(userData.spotifyId && { spotifyId: userData.spotifyId }),
          ...(userData.spotifyUrl && { spotifyUrl: userData.spotifyUrl }),
          ...(userData.avatar && { avatar: userData.avatar }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Store token and user
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('tampamixtape_token', data.token)
      localStorage.setItem('tampamixtape_user', JSON.stringify(data.user))

      return data.user
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store token and user
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('tampamixtape_token', data.token)
      localStorage.setItem('tampamixtape_user', JSON.stringify(data.user))

      return data.user
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const adminSignIn = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Admin login failed')
      }

      // Store token and user
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('tampamixtape_token', data.token)
      localStorage.setItem('tampamixtape_user', JSON.stringify(data.user))

      return data.user
    } catch (error) {
      console.error('Admin sign in error:', error)
      throw error
    }
  }

  const signOut = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('tampamixtape_token')
    localStorage.removeItem('tampamixtape_user')
  }

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('tampamixtape_user', JSON.stringify(updatedUser))
    return updatedUser
  }

  const updateProfile = async (profileData) => {
    // Update local state immediately for responsiveness
    const localUpdate = updateUser({
      ...profileData,
      updatedAt: new Date().toISOString(),
    })

    // If we have a token, also persist to backend
    if (token) {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        })

        if (!response.ok) {
          const data = await response.json()
          console.error('Failed to update profile on server:', data.error)
        }
      } catch (error) {
        console.error('Failed to sync profile update:', error)
      }
    }

    return localUpdate
  }

  const updateSocialLinks = (links) => {
    return updateUser({ socialLinks: { ...user.socialLinks, ...links } })
  }

  const updateSettings = (settings) => {
    return updateUser({ settings: { ...user.settings, ...settings } })
  }

  // Event management
  const addEvent = (eventData) => {
    const newEvent = {
      id: crypto.randomUUID(),
      ...eventData,
      createdAt: new Date().toISOString(),
    }
    const updatedEvents = [...(user.events || []), newEvent]
    return updateUser({ events: updatedEvents })
  }

  const updateEvent = (eventId, eventData) => {
    const updatedEvents = (user.events || []).map(event =>
      event.id === eventId ? { ...event, ...eventData, updatedAt: new Date().toISOString() } : event
    )
    return updateUser({ events: updatedEvents })
  }

  const deleteEvent = (eventId) => {
    const updatedEvents = (user.events || []).filter(event => event.id !== eventId)
    return updateUser({ events: updatedEvents })
  }


  // For demo purposes - approve user (in production this would be admin action)
  const approveUser = () => {
    return updateUser({ approvalStatus: APPROVAL_STATUS.APPROVED })
  }

  // Admin: Add a new creator
  const addCreatorByAdmin = (creatorData) => {
    // Check for duplicate
    if (isArtistRegistered(creatorData.artistName, creatorData.spotifyArtistId)) {
      throw new Error('This artist is already registered on TampaMixtape')
    }

    const profileSlug = generateProfileSlug(creatorData.artistName)
    const newCreator = {
      id: crypto.randomUUID(),
      ...creatorData,
      profileSlug,
      role: USER_ROLES.CREATOR,
      approvalStatus: creatorData.approvalStatus || APPROVAL_STATUS.APPROVED,
      isVerified: creatorData.isVerified ?? true,
      createdAt: new Date().toISOString(),
      bio: creatorData.bio || '',
      profileImage: creatorData.profileImage || null,
      headerImage: creatorData.headerImage || null,
      region: creatorData.region || 'Tampa Bay',
      genres: creatorData.genres || [],
      socialLinks: creatorData.socialLinks || {
        instagram: '',
        twitter: '',
        tiktok: '',
        youtube: '',
        soundcloud: '',
        appleMusic: '',
        website: '',
      },
      connectedPlatforms: {
        spotify: !!creatorData.spotifyArtistId,
        apple: false,
        soundcloud: false,
        youtube: false,
      },
      spotifyId: null,
      spotifyArtistId: creatorData.spotifyArtistId || null,
      spotifyProfile: null,
      settings: {
        profileVisible: true,
        showStats: true,
        allowMessages: true,
        emailNotifications: true,
      },
      events: creatorData.events || [],
      addedByAdmin: true,
    }

    const updatedCreators = [...creators, newCreator]
    saveCreators(updatedCreators)
    return newCreator
  }

  // Admin: Update a creator
  const updateCreatorByAdmin = (creatorId, updates) => {
    const updatedCreators = creators.map(creator =>
      creator.id === creatorId
        ? { ...creator, ...updates, updatedAt: new Date().toISOString() }
        : creator
    )
    saveCreators(updatedCreators)

    // If updating the current user, update their session too
    if (user?.id === creatorId) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() }
      setUser(updatedUser)
      localStorage.setItem('tampamixtape_user', JSON.stringify(updatedUser))
    }

    return updatedCreators.find(c => c.id === creatorId)
  }

  // Admin: Delete a creator
  const deleteCreatorByAdmin = (creatorId) => {
    const updatedCreators = creators.filter(creator => creator.id !== creatorId)
    saveCreators(updatedCreators)
  }

  // Admin: Approve a creator
  const approveCreatorByAdmin = (creatorId) => {
    return updateCreatorByAdmin(creatorId, { approvalStatus: APPROVAL_STATUS.APPROVED })
  }

  // Admin: Reject a creator
  const rejectCreatorByAdmin = (creatorId) => {
    return updateCreatorByAdmin(creatorId, { approvalStatus: APPROVAL_STATUS.REJECTED })
  }

  // Get a creator by profile slug (for public profiles)
  const getCreatorBySlug = (slug) => {
    return creators.find(creator => creator.profileSlug === slug)
  }

  // ===========================================
  // Spotify OAuth Methods
  // ===========================================

  // Initiate Spotify OAuth login flow
  const loginWithSpotify = async (returnTo = '/') => {
    try {
      setSpotifyConnecting(true)
      const redirectUri = `${window.location.origin}/callback`
      const response = await fetch(
        `${API_URL}/api/spotify/auth/login?redirect_uri=${encodeURIComponent(redirectUri)}&return_to=${encodeURIComponent(returnTo)}`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to initiate Spotify login')
      }

      const data = await response.json()

      if (data.authUrl) {
        // Store state in sessionStorage for validation
        sessionStorage.setItem('spotify_oauth_state', data.state)
        // Redirect to Spotify
        window.location.href = data.authUrl
      } else {
        throw new Error('Failed to get authorization URL')
      }
    } catch (error) {
      console.error('Spotify login error:', error)
      setSpotifyConnecting(false)
      throw error
    }
  }

  // Handle Spotify callback data (called from SpotifyCallback page)
  const handleSpotifyCallback = (spotifyData) => {
    if (spotifyData.spotifyProfile) {
      setSpotifyUser(spotifyData.spotifyProfile)
    }
    if (spotifyData.artistData) {
      setSpotifyArtist(spotifyData.artistData)
    }
    setSpotifyConnecting(false)
    return spotifyData
  }

  // Clear Spotify connection state
  const clearSpotifyConnection = () => {
    setSpotifyUser(null)
    setSpotifyArtist(null)
    setSpotifyConnecting(false)
    sessionStorage.removeItem('spotify_oauth_state')
  }

  // Get avatar URL from Spotify data (artist image preferred, then user profile)
  const getSpotifyAvatar = () => {
    if (spotifyArtist?.image) {
      return spotifyArtist.image
    }
    if (spotifyUser?.images?.[0]?.url) {
      return spotifyUser.images[0].url
    }
    return null
  }

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    isVerified: user?.isVerified || false,
    // Check both 'status' (from API) and 'approvalStatus' (legacy/local) for compatibility
    isApproved: user?.status === APPROVAL_STATUS.APPROVED || user?.approvalStatus === APPROVAL_STATUS.APPROVED,
    isPending: user?.status === APPROVAL_STATUS.PENDING || user?.approvalStatus === APPROVAL_STATUS.PENDING,
    isRejected: user?.status === APPROVAL_STATUS.REJECTED || user?.approvalStatus === APPROVAL_STATUS.REJECTED,
    isAdmin: user?.role === USER_ROLES.ADMIN,
    isCreator: user?.role === USER_ROLES.CREATOR || user?.role === USER_ROLES.ARTIST,
    creators,
    signUp,
    signIn,
    signOut,
    updateUser,
    updateProfile,
    updateSocialLinks,
    updateSettings,
    approveUser, // For demo
    addEvent,
    updateEvent,
    deleteEvent,
    // Admin functions
    searchSpotifyArtists,
    isArtistRegistered,
    addCreatorByAdmin,
    updateCreatorByAdmin,
    deleteCreatorByAdmin,
    approveCreatorByAdmin,
    rejectCreatorByAdmin,
    getCreatorBySlug,
    // Spotify OAuth
    spotifyUser,
    spotifyArtist,
    spotifyConnecting,
    loginWithSpotify,
    handleSpotifyCallback,
    clearSpotifyConnection,
    getSpotifyAvatar,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
