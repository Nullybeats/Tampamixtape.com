import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your_spotify_client_id'
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/callback'
const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-top-read',
  'user-read-recently-played',
].join(' ')

// Approval status types
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

// User roles
export const USER_ROLES = {
  CREATOR: 'creator',
  ADMIN: 'admin',
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
  const [isLoading, setIsLoading] = useState(true)
  const [spotifyToken, setSpotifyToken] = useState(null)
  const [spotifyUser, setSpotifyUser] = useState(null)
  const [playlists, setPlaylists] = useState([])
  const [featuredPlaylist, setFeaturedPlaylist] = useState(null)
  const [creators, setCreators] = useState([])

  // Load user and creators from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('tampamixtape_user')
    const savedSpotifyToken = localStorage.getItem('spotify_access_token')
    const savedCreators = localStorage.getItem('tampamixtape_creators')

    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedSpotifyToken) {
      setSpotifyToken(savedSpotifyToken)
      fetchSpotifyUser(savedSpotifyToken)
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
  }, [])

  // Handle Spotify callback
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      if (accessToken) {
        setSpotifyToken(accessToken)
        localStorage.setItem('spotify_access_token', accessToken)
        fetchSpotifyUser(accessToken)
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }, [])

  // Load featured playlist when user and playlists are available
  useEffect(() => {
    if (user?.featuredPlaylistId && playlists.length > 0) {
      const playlist = playlists.find(p => p.id === user.featuredPlaylistId)
      if (playlist) {
        setFeaturedPlaylist(playlist)
      }
    }
  }, [user?.featuredPlaylistId, playlists])

  const fetchSpotifyUser = async (token) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSpotifyUser(data)
        fetchPlaylists(token)
      }
    } catch (error) {
      console.error('Error fetching Spotify user:', error)
    }
  }

  const fetchPlaylists = async (token) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching playlists:', error)
    }
  }

  const loginWithSpotify = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&show_dialog=true`
    window.location.href = authUrl
  }

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

  // Search Spotify for artists
  const searchSpotifyArtists = async (query, token = spotifyToken) => {
    if (!token || !query) return []
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        const data = await response.json()
        return data.artists?.items || []
      }
    } catch (error) {
      console.error('Error searching Spotify artists:', error)
    }
    return []
  }

  // Save creators to localStorage
  const saveCreators = (updatedCreators) => {
    setCreators(updatedCreators)
    localStorage.setItem('tampamixtape_creators', JSON.stringify(updatedCreators))
  }

  const signUp = async (userData) => {
    // Check for duplicate artist
    if (isArtistRegistered(userData.artistName, userData.spotifyArtistId)) {
      throw new Error('This artist is already registered on TampaMixtape')
    }

    // Create user with pending approval status
    const profileSlug = generateProfileSlug(userData.artistName)

    const newUser = {
      id: crypto.randomUUID(),
      ...userData,
      profileSlug,
      role: USER_ROLES.CREATOR,
      approvalStatus: APPROVAL_STATUS.PENDING,
      isVerified: userData.city === 'Tampa',
      createdAt: new Date().toISOString(),
      // Profile info
      bio: '',
      profileImage: spotifyUser?.images?.[0]?.url || null,
      headerImage: null,
      region: 'Tampa Bay',
      genres: [],
      // Social links
      socialLinks: {
        instagram: '',
        twitter: '',
        tiktok: '',
        youtube: '',
        soundcloud: '',
        appleMusic: '',
        website: '',
      },
      // Connected platforms
      connectedPlatforms: {
        spotify: !!spotifyUser,
        apple: false,
        soundcloud: false,
        youtube: false,
      },
      // Spotify data
      spotifyId: spotifyUser?.id || null,
      spotifyArtistId: userData.spotifyArtistId || null,
      spotifyProfile: spotifyUser || null,
      // Settings
      settings: {
        profileVisible: true,
        showStats: true,
        allowMessages: true,
        emailNotifications: true,
      },
      // Events
      events: [],
    }

    // Add to creators list
    const updatedCreators = [...creators, newUser]
    saveCreators(updatedCreators)

    setUser(newUser)
    localStorage.setItem('tampamixtape_user', JSON.stringify(newUser))
    return newUser
  }

  const signIn = async (email, password) => {
    // Simulate API call - in production this would authenticate against your backend
    const savedUser = localStorage.getItem('tampamixtape_user')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      if (user.email === email) {
        setUser(user)
        return user
      }
    }
    throw new Error('Invalid credentials')
  }

  const signOut = () => {
    setUser(null)
    setSpotifyToken(null)
    setSpotifyUser(null)
    setPlaylists([])
    setFeaturedPlaylist(null)
    localStorage.removeItem('tampamixtape_user')
    localStorage.removeItem('spotify_access_token')
  }

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('tampamixtape_user', JSON.stringify(updatedUser))
    return updatedUser
  }

  const updateProfile = (profileData) => {
    return updateUser({
      ...profileData,
      updatedAt: new Date().toISOString(),
    })
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

  const setFeaturedPlaylistById = (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId)
    if (playlist) {
      setFeaturedPlaylist(playlist)
      updateUser({ featuredPlaylistId: playlistId })
    }
  }

  // For demo purposes - approve user (in production this would be admin action)
  const approveUser = () => {
    return updateUser({ approvalStatus: APPROVAL_STATUS.APPROVED })
  }

  // Test user login for development/demo purposes
  const loginAsTestUser = () => {
    const testUser = {
      id: 'test-user-001',
      artistName: 'Demo Artist',
      email: 'demo@tampamixtape.com',
      profileSlug: 'demo-artist',
      approvalStatus: APPROVAL_STATUS.APPROVED,
      isVerified: true,
      city: 'Tampa',
      state: 'Florida',
      region: 'Tampa Bay',
      createdAt: new Date().toISOString(),
      bio: 'Tampa Bay artist bringing the heat with fresh beats and authentic Florida vibes.',
      profileImage: 'https://picsum.photos/seed/demoartist/400/400',
      headerImage: 'https://picsum.photos/seed/demoheader/1200/400',
      genres: ['Hip-Hop', 'R&B', 'Florida Rap'],
      socialLinks: {
        instagram: 'https://instagram.com/demoartist',
        twitter: 'https://x.com/demoartist',
        tiktok: 'https://tiktok.com/@demoartist',
        youtube: 'https://youtube.com/@demoartist',
        soundcloud: '',
        appleMusic: '',
        website: 'https://demoartist.com',
      },
      connectedPlatforms: {
        spotify: false,
        apple: false,
        soundcloud: false,
        youtube: false,
      },
      spotifyId: null,
      spotifyProfile: null,
      settings: {
        profileVisible: true,
        showStats: true,
        allowMessages: true,
        emailNotifications: true,
      },
      events: [
        {
          id: 'demo-event-1',
          title: 'Live at The Ritz Ybor',
          venue: 'The Ritz Ybor',
          address: '1503 E 7th Ave, Tampa, FL',
          date: '2025-12-28',
          time: '21:00',
          description: 'End of year showcase featuring Tampa Bay\'s hottest artists.',
          ticketUrl: 'https://example.com/tickets',
          price: '$25',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'demo-event-2',
          title: 'New Year\'s Eve Bash',
          venue: 'Crowbar Tampa',
          address: '1812 N 17th St, Tampa, FL',
          date: '2025-12-31',
          time: '22:00',
          description: 'Ring in 2026 with live performances and DJ sets all night.',
          ticketUrl: 'https://example.com/tickets',
          price: '$40',
          createdAt: new Date().toISOString(),
        },
      ],
    }

    setUser(testUser)
    localStorage.setItem('tampamixtape_user', JSON.stringify(testUser))
    return testUser
  }

  // Admin test user login
  const loginAsAdmin = () => {
    const adminUser = {
      id: 'admin-001',
      artistName: 'Admin',
      email: 'admin@tampamixtape.com',
      profileSlug: 'admin',
      role: USER_ROLES.ADMIN,
      approvalStatus: APPROVAL_STATUS.APPROVED,
      isVerified: true,
      city: 'Tampa',
      state: 'Florida',
      region: 'Tampa Bay',
      createdAt: new Date().toISOString(),
      bio: 'TampaMixtape Administrator',
      profileImage: null,
      headerImage: null,
      genres: [],
      socialLinks: {},
      connectedPlatforms: {},
      spotifyId: null,
      spotifyProfile: null,
      settings: {
        profileVisible: false,
        showStats: false,
        allowMessages: true,
        emailNotifications: true,
      },
      events: [],
    }

    setUser(adminUser)
    localStorage.setItem('tampamixtape_user', JSON.stringify(adminUser))
    return adminUser
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

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isVerified: user?.isVerified || false,
    isApproved: user?.approvalStatus === APPROVAL_STATUS.APPROVED,
    isPending: user?.approvalStatus === APPROVAL_STATUS.PENDING,
    isAdmin: user?.role === USER_ROLES.ADMIN,
    isCreator: user?.role === USER_ROLES.CREATOR,
    spotifyToken,
    spotifyUser,
    playlists,
    featuredPlaylist,
    creators,
    signUp,
    signIn,
    signOut,
    updateUser,
    updateProfile,
    updateSocialLinks,
    updateSettings,
    loginWithSpotify,
    setFeaturedPlaylistById,
    approveUser, // For demo
    loginAsTestUser, // For demo/testing
    loginAsAdmin, // For demo/testing admin
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
