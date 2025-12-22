import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Trash2,
  Music,
  BarChart3,
  Shield,
  MapPin,
  Mail,
  Calendar,
  Eye,
  AlertCircle,
  Loader2,
  Settings,
  TrendingUp,
  UserCog,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
  Globe,
  Lock,
  Bell,
  Palette,
  Database,
  Plug,
  Unplug,
  ExternalLink,
  UserPlus,
  Instagram,
  Youtube,
  Twitter,
  Link,
} from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export function AdminDashboard() {
  const navigate = useNavigate()
  const { token, user } = useAuth()

  // Users state
  const [users, setUsers] = useState([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    artists: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Dialog state
  const [showEditUser, setShowEditUser] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showAddArtist, setShowAddArtist] = useState(false)

  // Add Artist state
  const [addArtistUrl, setAddArtistUrl] = useState('')
  const [addArtistLoading, setAddArtistLoading] = useState(false)
  const [addArtistPreview, setAddArtistPreview] = useState(null)

  // Messages
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFixingSlugs, setIsFixingSlugs] = useState(false)
  const [isRefreshingArtists, setIsRefreshingArtists] = useState(false)
  const [isSyncingReleases, setIsSyncingReleases] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    allowRegistration: true,
    requireApproval: true,
    allowSpotifyConnect: true,
    maintenanceMode: false,
    siteName: 'TampaMixtape',
    siteDescription: 'Tampa Bay Music Analytics Platform',
    contactEmail: '',
    maxUploadSize: '10',
    defaultUserRole: 'USER',
  })

  // Spotify linking state for edit user dialog
  const [spotifyUrlInput, setSpotifyUrlInput] = useState('')
  const [spotifyLoading, setSpotifyLoading] = useState(false)
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

  // Link Spotify to user (admin action) - stages change for save
  const handleAdminSpotifyLink = async () => {
    if (!spotifyPreview || !selectedUser) return

    setSpotifyLoading(true)
    try {
      // Stage the changes locally - will be saved when "Save Changes" is clicked
      const updatedUser = {
        ...selectedUser,
        spotifyId: spotifyPreview.id,
        spotifyUrl: spotifyPreview.url,
      }
      setSelectedUser(updatedUser)
      setSpotifyPreview(null)
      setSpotifyUrlInput('')

      toast.info('Spotify linked', {
        description: 'Click "Save Changes" to apply.',
      })
    } catch (error) {
      toast.error('Failed to link Spotify', {
        description: error.message,
      })
    } finally {
      setSpotifyLoading(false)
    }
  }

  // Clear Spotify from user (admin action) - stages change for save
  const handleAdminSpotifyUnlink = () => {
    if (!selectedUser) return
    const updatedUser = {
      ...selectedUser,
      spotifyId: null,
      spotifyUrl: null,
    }
    setSelectedUser(updatedUser)
    toast.info('Spotify unlinked', {
      description: 'Click "Save Changes" to apply.',
    })
  }

  // Fix all profile slugs (remove hyphens)
  const handleFixSlugs = async () => {
    setIsFixingSlugs(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/fix-slugs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix slugs')
      }

      if (data.updated === 0) {
        toast.info('No slugs to fix', {
          description: 'All profile URLs are already clean.',
        })
      } else {
        toast.success(`Fixed ${data.updated} profile URL${data.updated > 1 ? 's' : ''}`, {
          description: 'Hyphens have been removed from profile slugs.',
        })
        // Refresh users list to see updated slugs
        fetchUsers(pagination.page)
      }
    } catch (error) {
      toast.error('Failed to fix slugs', {
        description: error.message,
      })
    } finally {
      setIsFixingSlugs(false)
    }
  }

  // Refresh all artist data from Spotify (popularity, followers, genres)
  const handleRefreshArtistData = async () => {
    setIsRefreshingArtists(true)
    try {
      const response = await fetch(`${API_URL}/api/artists/hot100/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh artist data')
      }

      if (data.updated === 0) {
        toast.info('No artists to update', {
          description: 'No artists with Spotify IDs found.',
        })
      } else {
        toast.success(`Updated ${data.updated} artist${data.updated > 1 ? 's' : ''}`, {
          description: `Popularity, followers, and genres refreshed from Spotify.${data.failed > 0 ? ` (${data.failed} failed)` : ''}`,
        })
        // Refresh users list to see updated data
        fetchUsers(pagination.page)
      }
    } catch (error) {
      toast.error('Failed to refresh artist data', {
        description: error.message,
      })
    } finally {
      setIsRefreshingArtists(false)
    }
  }

  // Sync releases from Spotify to database
  const handleSyncReleases = async () => {
    setIsSyncingReleases(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/sync-releases`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync releases')
      }

      toast.success(`Synced ${data.processed} releases`, {
        description: `${data.totalReleases} total releases in database.${data.failed > 0 ? ` (${data.failed} artists failed)` : ''}`,
      })
    } catch (error) {
      toast.error('Failed to sync releases', {
        description: error.message,
      })
    } finally {
      setIsSyncingReleases(false)
    }
  }

  // Reset Spotify state when dialog closes
  const handleEditDialogChange = (open) => {
    setShowEditUser(open)
    if (!open) {
      setSpotifyUrlInput('')
      setSpotifyPreview(null)
    }
  }

  // Reset Add Artist dialog state
  const handleAddArtistDialogChange = (open) => {
    setShowAddArtist(open)
    if (!open) {
      setAddArtistUrl('')
      setAddArtistPreview(null)
    }
  }

  // Preview artist for Add Artist dialog
  const handleAddArtistPreview = async () => {
    if (!addArtistUrl.trim()) {
      toast.error('Please enter a Spotify artist URL')
      return
    }

    setAddArtistLoading(true)
    setAddArtistPreview(null)

    try {
      const response = await fetch(`${API_URL}/api/spotify/artist?url=${encodeURIComponent(addArtistUrl)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch artist')
      }

      setAddArtistPreview(data)
    } catch (error) {
      toast.error('Could not find artist', {
        description: error.message || 'Please check the URL and try again',
      })
    } finally {
      setAddArtistLoading(false)
    }
  }

  // Create artist from Spotify URL
  const handleCreateArtistFromSpotify = async () => {
    if (!addArtistPreview) return

    setAddArtistLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/users/create-from-spotify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ spotifyUrl: addArtistUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('Artist already exists', {
            description: `${data.existingUser?.artistName} is already on TampaMixtape`,
          })
        } else {
          throw new Error(data.error || 'Failed to create artist')
        }
        return
      }

      toast.success('Artist profile created!', {
        description: `${data.user.artistName} added to TampaMixtape`,
      })

      // Update stats
      setStats(s => ({
        ...s,
        totalUsers: s.totalUsers + 1,
        approvedUsers: s.approvedUsers + 1,
        artists: s.artists + 1,
      }))

      // Close dialog and refresh users list
      handleAddArtistDialogChange(false)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to create artist', {
        description: error.message,
      })
    } finally {
      setAddArtistLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    if (!token) return
    setIsLoadingStats(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Fetch users
  const fetchUsers = async (page = 1) => {
    if (!token) return
    setIsLoadingUsers(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
      })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (searchQuery.trim()) params.append('search', searchQuery.trim())

      const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users')
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchStats()
    fetchUsers()
  }, [token])

  // Refetch when filters change
  useEffect(() => {
    fetchUsers(1)
  }, [statusFilter, roleFilter, sortBy])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Clear messages after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Users are now filtered server-side
  const filteredUsers = users

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchStats(), fetchUsers(pagination.page)])
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  // Approve user
  const handleApprove = async (userId) => {
    const targetUser = users.find(u => u.id === userId)
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: 'APPROVED' } : u))
        setStats(s => ({ ...s, pendingUsers: s.pendingUsers - 1, approvedUsers: s.approvedUsers + 1 }))
        toast.success('User approved', {
          description: `${targetUser?.artistName || 'User'} has been approved.`,
        })
      } else {
        const data = await response.json()
        toast.error('Failed to approve user', {
          description: data.error || 'Please try again.',
        })
      }
    } catch (err) {
      toast.error('Failed to approve user')
    }
  }

  // Reject user
  const handleReject = async (userId) => {
    const targetUser = users.find(u => u.id === userId)
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: 'REJECTED' } : u))
        setStats(s => ({ ...s, pendingUsers: s.pendingUsers - 1 }))
        toast.success('User rejected', {
          description: `${targetUser?.artistName || 'User'} has been rejected.`,
        })
      } else {
        const data = await response.json()
        toast.error('Failed to reject user', {
          description: data.error || 'Please try again.',
        })
      }
    } catch (err) {
      toast.error('Failed to reject user')
    }
  }

  // Update user role
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        toast.success('Role updated', {
          description: `User role has been changed to ${newRole}.`,
        })
        setShowEditUser(false)
      } else {
        const data = await response.json()
        toast.error('Failed to update role', {
          description: data.error || 'Please try again.',
        })
      }
    } catch (err) {
      toast.error('Failed to update role')
    }
  }

  // Save all user changes (role, status, spotify)
  const handleSaveUser = async () => {
    if (!selectedUser) return

    // Find original user to detect changes
    const originalUser = users.find(u => u.id === selectedUser.id)
    if (!originalUser) return

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          role: selectedUser.role,
          status: selectedUser.status,
          spotifyId: selectedUser.spotifyId,
          spotifyUrl: selectedUser.spotifyUrl,
          region: selectedUser.region,
          genres: selectedUser.genres,
          instagramUrl: selectedUser.instagramUrl,
          twitterUrl: selectedUser.twitterUrl,
          youtubeUrl: selectedUser.youtubeUrl,
          tiktokUrl: selectedUser.tiktokUrl,
          websiteUrl: selectedUser.websiteUrl,
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Update users list
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...data.user } : u))

        // Update stats if status changed
        if (originalUser.status !== selectedUser.status) {
          setStats(s => {
            const newStats = { ...s }
            // Decrement old status count
            if (originalUser.status === 'PENDING') newStats.pendingUsers--
            if (originalUser.status === 'APPROVED') newStats.approvedUsers--
            // Increment new status count
            if (selectedUser.status === 'PENDING') newStats.pendingUsers++
            if (selectedUser.status === 'APPROVED') newStats.approvedUsers++
            return newStats
          })
        }

        // Build success message
        const changes = []
        if (originalUser.role !== selectedUser.role) changes.push(`role → ${selectedUser.role}`)
        if (originalUser.status !== selectedUser.status) changes.push(`status → ${selectedUser.status}`)
        if (originalUser.spotifyId !== selectedUser.spotifyId) {
          changes.push(selectedUser.spotifyId ? 'Spotify linked' : 'Spotify unlinked')
        }
        if (originalUser.region !== selectedUser.region) changes.push(`region → ${selectedUser.region}`)
        if (originalUser.genres !== selectedUser.genres) changes.push('genres updated')
        if (originalUser.instagramUrl !== selectedUser.instagramUrl) changes.push('Instagram updated')
        if (originalUser.twitterUrl !== selectedUser.twitterUrl) changes.push('Twitter updated')
        if (originalUser.youtubeUrl !== selectedUser.youtubeUrl) changes.push('YouTube updated')
        if (originalUser.tiktokUrl !== selectedUser.tiktokUrl) changes.push('TikTok updated')
        if (originalUser.websiteUrl !== selectedUser.websiteUrl) changes.push('Website updated')

        toast.success('User updated', {
          description: changes.length > 0 ? changes.join(', ') : 'Changes saved successfully.',
        })
        handleEditDialogChange(false)
      } else {
        const data = await response.json()
        toast.error('Failed to update user', {
          description: data.error || 'Please try again.',
        })
      }
    } catch (err) {
      console.error('Save user error:', err)
      toast.error('Failed to update user')
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const deletedName = selectedUser.artistName || selectedUser.name
        setUsers(users.filter(u => u.id !== selectedUser.id))
        setStats(s => ({ ...s, totalUsers: s.totalUsers - 1 }))
        toast.success('User deleted', {
          description: `${deletedName} has been removed.`,
        })
        setShowDeleteConfirm(false)
        setSelectedUser(null)
      } else {
        const data = await response.json()
        toast.error('Failed to delete user', {
          description: data.error || 'Please try again.',
        })
      }
    } catch (err) {
      toast.error('Failed to delete user')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />Approved</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1"><Clock className="w-3 h-3" />Pending</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>
      default:
        return null
    }
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 gap-1"><Shield className="w-3 h-3" />Admin</Badge>
      case 'ARTIST':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 gap-1"><Music className="w-3 h-3" />Artist</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 gap-1"><Users className="w-3 h-3" />User</Badge>
    }
  }

  const pendingUsers = users.filter(u => u.status === 'PENDING')

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage users, settings, and platform analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowAddArtist(true)}
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Artist
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400"
            >
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalUsers}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.pendingUsers}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.approvedUsers}
                  </p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Music className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.artists}
                  </p>
                  <p className="text-sm text-muted-foreground">Artists</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Pending</span>
              {stats.pendingUsers > 0 && (
                <Badge variant="secondary" className="ml-1">{stats.pendingUsers}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage all registered users</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ARTIST">Artist</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                      <SelectItem value="email">Email (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users List */}
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
                        >
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.artistName || u.name} className="w-full h-full object-cover" />
                            ) : (
                              <Music className="w-6 h-6 text-primary" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold truncate">{u.artistName || u.name || 'No name'}</h4>
                              {getStatusBadge(u.status)}
                              {getRoleBadge(u.role)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                {u.email}
                              </span>
                              {u.createdAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(u.createdAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {u.profileSlug && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/${u.profileSlug}`)}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedUser(u); setShowEditUser(true); }}
                            >
                              <UserCog className="w-4 h-4" />
                            </Button>
                            {u.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedUser(u); setShowDeleteConfirm(true); }}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.pages} ({pagination.total} users)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUsers(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUsers(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Review and approve user applications</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : pendingUsers.length > 0 ? (
                  <div className="space-y-3">
                    {pendingUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5"
                      >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <Music className="w-6 h-6 text-primary" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{u.artistName || u.name || 'No name'}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {u.email}
                            </span>
                            {u.createdAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(u.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(u.id)}
                            className="gap-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(u.id)}
                            className="gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-1">All caught up!</p>
                    <p className="text-muted-foreground">No pending approvals at this time</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Platform Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <span>Total Users</span>
                      </div>
                      <span className="font-bold text-xl">{stats.totalUsers}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Music className="w-5 h-5 text-muted-foreground" />
                        <span>Artists</span>
                      </div>
                      <span className="font-bold text-xl">{stats.artists}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span>Approved</span>
                      </div>
                      <span className="font-bold text-xl">{stats.approvedUsers}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span>Pending</span>
                      </div>
                      <span className="font-bold text-xl">{stats.pendingUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Approval Rate</span>
                        <span className="font-medium">
                          {stats.totalUsers > 0 ? Math.round((stats.approvedUsers / stats.totalUsers) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${stats.totalUsers > 0 ? (stats.approvedUsers / stats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Artists vs Users</span>
                        <span className="font-medium">
                          {stats.totalUsers > 0 ? Math.round((stats.artists / stats.totalUsers) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${stats.totalUsers > 0 ? (stats.artists / stats.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">User Growth</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">+{stats.pendingUsers} pending</span>
                        <span className="text-muted-foreground">this period</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <div>
                        <p className="font-medium">Database</p>
                        <p className="text-sm text-muted-foreground">Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <div>
                        <p className="font-medium">API</p>
                        <p className="text-sm text-muted-foreground">Operational</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <div>
                        <p className="font-medium">Auth</p>
                        <p className="text-sm text-muted-foreground">Active</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6 md:grid-cols-2">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    General Settings
                  </CardTitle>
                  <CardDescription>Basic platform configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Site Description</Label>
                    <Input
                      value={settings.siteDescription}
                      onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      placeholder="admin@tampamixtape.com"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Registration Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Registration Settings
                  </CardTitle>
                  <CardDescription>Control user registration behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">Allow Registration</p>
                      <p className="text-sm text-muted-foreground">Enable new user signups</p>
                    </div>
                    <Switch
                      checked={settings.allowRegistration}
                      onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">Require Approval</p>
                      <p className="text-sm text-muted-foreground">New users need admin approval</p>
                    </div>
                    <Switch
                      checked={settings.requireApproval}
                      onCheckedChange={(checked) => setSettings({ ...settings, requireApproval: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">Spotify Connect</p>
                      <p className="text-sm text-muted-foreground">Allow Spotify OAuth</p>
                    </div>
                    <Switch
                      checked={settings.allowSpotifyConnect}
                      onCheckedChange={(checked) => setSettings({ ...settings, allowSpotifyConnect: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default User Role</Label>
                    <Select
                      value={settings.defaultUserRole}
                      onValueChange={(value) => setSettings({ ...settings, defaultUserRole: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="ARTIST">Artist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Maintenance
                  </CardTitle>
                  <CardDescription>System maintenance options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Disable site for maintenance</p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Upload Size (MB)</Label>
                    <Input
                      type="number"
                      value={settings.maxUploadSize}
                      onChange={(e) => setSettings({ ...settings, maxUploadSize: e.target.value })}
                    />
                  </div>

                  {/* Refresh Artist Data from Spotify */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Refresh Artist Data</p>
                        <p className="text-sm text-muted-foreground">
                          Update popularity, followers, genres & avatars from Spotify for all artists
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleRefreshArtistData}
                        disabled={isRefreshingArtists}
                        className="gap-2"
                      >
                        {isRefreshingArtists ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            Refresh Data
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Fix Profile Slugs */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Fix Profile URLs</p>
                        <p className="text-sm text-muted-foreground">
                          Remove hyphens from all profile slugs (e.g., artist-name → artistname)
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleFixSlugs}
                        disabled={isFixingSlugs}
                        className="gap-2"
                      >
                        {isFixingSlugs ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Fixing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Fix Slugs
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Sync Releases to Database */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Sync Releases</p>
                        <p className="text-sm text-muted-foreground">
                          Fetch all releases from Spotify and store in database (survives server restarts)
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleSyncReleases}
                        disabled={isSyncingReleases}
                        className="gap-2"
                      >
                        {isSyncingReleases ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Sync Releases
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Admin Account
                  </CardTitle>
                  <CardDescription>Your admin account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user?.name || 'Admin'}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Settings changes are stored locally. For production, connect to your backend settings API.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => {
                  localStorage.setItem('tampamixtape_admin_settings', JSON.stringify(settings))
                  toast.success('Settings saved', {
                    description: 'Your settings have been saved locally.',
                  })
                }}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={showEditUser} onOpenChange={handleEditDialogChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-primary" />
                Edit User
              </DialogTitle>
              <DialogDescription>
                Update user role, status, region, genres, links, and Spotify profile
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedUser.artistName || selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ARTIST">Artist</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedUser.status === 'APPROVED' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedUser({ ...selectedUser, status: 'APPROVED' })}
                      className="flex-1"
                    >
                      Approved
                    </Button>
                    <Button
                      variant={selectedUser.status === 'PENDING' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedUser({ ...selectedUser, status: 'PENDING' })}
                      className="flex-1"
                    >
                      Pending
                    </Button>
                    <Button
                      variant={selectedUser.status === 'REJECTED' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedUser({ ...selectedUser, status: 'REJECTED' })}
                      className="flex-1"
                    >
                      Rejected
                    </Button>
                  </div>
                </div>

                {/* Region Section */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Region
                  </Label>
                  <Select
                    value={selectedUser.region || 'Tampa Bay'}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tampa Bay">Tampa Bay</SelectItem>
                      <SelectItem value="St. Pete">St. Pete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Genres Section */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-muted-foreground" />
                    Genres
                  </Label>
                  <Input
                    value={selectedUser.genres || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, genres: e.target.value })}
                    placeholder="Hip Hop, R&B, Pop (comma-separated)"
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple genres with commas</p>
                </div>

                {/* Social Links Section */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-muted-foreground" />
                    Social Links
                  </Label>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-500 flex-shrink-0" />
                      <Input
                        value={selectedUser.instagramUrl || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, instagramUrl: e.target.value })}
                        placeholder="https://instagram.com/..."
                        className="flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Twitter className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <Input
                        value={selectedUser.twitterUrl || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, twitterUrl: e.target.value })}
                        placeholder="https://twitter.com/..."
                        className="flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <Input
                        value={selectedUser.youtubeUrl || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, youtubeUrl: e.target.value })}
                        placeholder="https://youtube.com/..."
                        className="flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      <Input
                        value={selectedUser.tiktokUrl || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, tiktokUrl: e.target.value })}
                        placeholder="https://tiktok.com/@..."
                        className="flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <Input
                        value={selectedUser.websiteUrl || ''}
                        onChange={(e) => setSelectedUser({ ...selectedUser, websiteUrl: e.target.value })}
                        placeholder="https://..."
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Spotify Profile Section */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="#1DB954" className="w-4 h-4">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Spotify Artist Profile
                  </Label>

                  {selectedUser.spotifyId ? (
                    <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-sm">Linked: {selectedUser.spotifyId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedUser.spotifyUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(selectedUser.spotifyUrl, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAdminSpotifyUnlink}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          >
                            <Unplug className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Input
                          value={spotifyUrlInput}
                          onChange={(e) => setSpotifyUrlInput(e.target.value)}
                          placeholder="https://open.spotify.com/artist/..."
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSpotifyPreview}
                          disabled={spotifyLoading || !spotifyUrlInput.trim()}
                          size="sm"
                        >
                          {spotifyLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {spotifyPreview && (
                        <div className="p-3 rounded-lg border border-border bg-secondary/30">
                          <div className="flex items-center gap-3">
                            {spotifyPreview.image ? (
                              <img
                                src={spotifyPreview.image}
                                alt={spotifyPreview.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                                <Music className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{spotifyPreview.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {spotifyPreview.followers?.toLocaleString()} followers
                              </p>
                            </div>
                            <Button
                              onClick={handleAdminSpotifyLink}
                              disabled={spotifyLoading}
                              size="sm"
                              className="gap-1 bg-[#1DB954] hover:bg-[#1ed760]"
                            >
                              <Plug className="w-3 h-3" />
                              Link
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleEditDialogChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveUser}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-5 h-5" />
                Delete User
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedUser?.artistName || selectedUser?.name}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Artist from Spotify Dialog */}
        <Dialog open={showAddArtist} onOpenChange={handleAddArtistDialogChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Add Artist from Spotify
              </DialogTitle>
              <DialogDescription>
                Create a new artist profile by entering their Spotify URL. The profile will be auto-populated with their Spotify data.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Spotify URL Input */}
              <div className="space-y-2">
                <Label htmlFor="addArtistUrl">Spotify Artist URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="addArtistUrl"
                    value={addArtistUrl}
                    onChange={(e) => setAddArtistUrl(e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddArtistPreview}
                    disabled={addArtistLoading || !addArtistUrl.trim()}
                    className="gap-2"
                  >
                    {addArtistLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Find
                  </Button>
                </div>
              </div>

              {/* Artist Preview */}
              {addArtistPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border border-border bg-secondary/30"
                >
                  <div className="flex items-center gap-4">
                    {addArtistPreview.image ? (
                      <img
                        src={addArtistPreview.image}
                        alt={addArtistPreview.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                        <Music className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{addArtistPreview.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {addArtistPreview.followers?.toLocaleString()} followers
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {addArtistPreview.genres?.slice(0, 3).map((genre) => (
                          <Badge key={genre} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* What will be created */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">This will create:</p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        Artist profile: <strong>/{addArtistPreview.name?.toLowerCase().replace(/[^a-z0-9]/g, '')}</strong>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        Status: <Badge variant="secondary" className="text-xs">APPROVED</Badge>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                        Role: <Badge variant="secondary" className="text-xs">ARTIST</Badge>
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleAddArtistDialogChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateArtistFromSpotify}
                disabled={!addArtistPreview || addArtistLoading}
                className="gap-2 bg-[#1DB954] hover:bg-[#1ed760]"
              >
                {addArtistLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Create Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
