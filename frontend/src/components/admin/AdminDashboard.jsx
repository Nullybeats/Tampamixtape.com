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
  FileQuestion,
  UserCheck,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

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

  // Auto-sync state
  const [autoSyncSettings, setAutoSyncSettings] = useState({
    enabled: false,
    intervalMins: 60,
    lastSyncAt: null,
    lastSyncStatus: null,
    lastSyncMessage: null,
    isRunning: false,
  })
  const [isLoadingAutoSync, setIsLoadingAutoSync] = useState(true)
  const [isSavingAutoSync, setIsSavingAutoSync] = useState(false)

  // Sync health state
  const [syncHealth, setSyncHealth] = useState(null)
  const [syncLogs, setSyncLogs] = useState([])
  const [isLoadingSyncHealth, setIsLoadingSyncHealth] = useState(false)

  // Pending users state (independent of Users tab filters) - fixes pending tab bug
  const [pendingUsersList, setPendingUsersList] = useState([])
  const [isLoadingPending, setIsLoadingPending] = useState(true)

  // Claims state
  const [claims, setClaims] = useState([])
  const [isLoadingClaims, setIsLoadingClaims] = useState(true)
  const [claimsFilter, setClaimsFilter] = useState('PENDING')
  const [claimsPagination, setClaimsPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [claimStats, setClaimStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [showClaimDetail, setShowClaimDetail] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessingClaim, setIsProcessingClaim] = useState(false)

  // Pending user detail state
  const [selectedPendingUser, setSelectedPendingUser] = useState(null)
  const [showPendingDetail, setShowPendingDetail] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    allowRegistration: true,
    requireApproval: true,
    allowAppleMusicConnect: true,
    maintenanceMode: false,
    siteName: 'TampaMixtape',
    siteDescription: 'Tampa Bay Music Analytics Platform',
    contactEmail: '',
    maxUploadSize: '10',
    defaultUserRole: 'USER',
  })

  // Apple Music linking state for edit user dialog
  const [appleMusicUrlInput, setAppleMusicUrlInput] = useState('')
  const [appleMusicLoading, setAppleMusicLoading] = useState(false)
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

  // Link Apple Music to user (admin action) - stages change for save
  const handleAdminAppleMusicLink = async () => {
    if (!appleMusicPreview || !selectedUser) return

    setAppleMusicLoading(true)
    try {
      // Stage the changes locally - will be saved when "Save Changes" is clicked
      const updatedUser = {
        ...selectedUser,
        appleMusicId: appleMusicPreview.id,
        appleMusicUrl: appleMusicPreview.url,
      }
      setSelectedUser(updatedUser)
      setAppleMusicPreview(null)
      setAppleMusicUrlInput('')

      toast.info('Apple Music linked', {
        description: 'Click "Save Changes" to apply.',
      })
    } catch (error) {
      toast.error('Failed to link Apple Music', {
        description: error.message,
      })
    } finally {
      setAppleMusicLoading(false)
    }
  }

  // Clear Apple Music from user (admin action) - stages change for save
  const handleAdminAppleMusicUnlink = () => {
    if (!selectedUser) return
    const updatedUser = {
      ...selectedUser,
      appleMusicId: null,
      appleMusicUrl: null,
    }
    setSelectedUser(updatedUser)
    toast.info('Apple Music unlinked', {
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

  // Refresh all artist data from Apple Music (popularity, followers, genres)
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
          description: 'No artists with Apple Music IDs found.',
        })
      } else {
        toast.success(`Updated ${data.updated} artist${data.updated > 1 ? 's' : ''}`, {
          description: `Popularity, followers, and genres refreshed from Apple Music.${data.failed > 0 ? ` (${data.failed} failed)` : ''}`,
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

  // Sync releases from Apple Music to database
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

      // Build description based on results
      let description = `${data.totalReleases} total releases in database.`
      if (data.skipped > 0) {
        description += ` ${data.skipped} artists skipped (rate limited).`
      }
      if (data.failed > 0) {
        description += ` ${data.failed} artists failed.`
      }

      // Show appropriate toast based on results
      if (data.skipped > 0 || data.failed > 0) {
        toast.warning(`Synced ${data.processed} releases`, {
          description: data.rateLimitMessage || description,
          duration: 8000,
        })
      } else {
        toast.success(`Synced ${data.processed} releases`, {
          description,
        })
      }
    } catch (error) {
      toast.error('Failed to sync releases', {
        description: error.message,
      })
    } finally {
      setIsSyncingReleases(false)
    }
  }

  // Reset Apple Music state when dialog closes
  const handleEditDialogChange = (open) => {
    setShowEditUser(open)
    if (!open) {
      setAppleMusicUrlInput('')
      setAppleMusicPreview(null)
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
      toast.error('Please enter an Apple Music artist URL')
      return
    }

    setAddArtistLoading(true)
    setAddArtistPreview(null)

    try {
      const response = await fetch(`${API_URL}/api/music/artist?url=${encodeURIComponent(addArtistUrl)}`)
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

  // Create artist from Apple Music URL
  const handleCreateArtistFromAppleMusic = async () => {
    if (!addArtistPreview) return

    setAddArtistLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/users/create-from-apple-music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appleMusicUrl: addArtistUrl }),
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

  // Fetch auto-sync settings
  const fetchAutoSyncSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/settings/auto-sync`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setAutoSyncSettings(data)
      }
    } catch (err) {
      console.error('Error fetching auto-sync settings:', err)
    } finally {
      setIsLoadingAutoSync(false)
    }
  }

  // Fetch sync health data
  const fetchSyncHealth = async () => {
    setIsLoadingSyncHealth(true)
    try {
      const [statusRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/artists/sync-status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/sync-logs?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      if (statusRes.ok) {
        const data = await statusRes.json()
        setSyncHealth(data.summary)
      }
      if (logsRes.ok) {
        const data = await logsRes.json()
        setSyncLogs(data.logs || [])
      }
    } catch (err) {
      console.error('Error fetching sync health:', err)
    } finally {
      setIsLoadingSyncHealth(false)
    }
  }

  // Reset sync for a quarantined artist
  const handleResetArtistSync = async (artistId, artistName) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/artists/${artistId}/reset-sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        toast.success(`Sync re-enabled for ${artistName}`)
        fetchSyncHealth()
      }
    } catch (err) {
      toast.error('Failed to reset sync')
    }
  }

  // Fetch pending users (independent of Users tab filters) - fixes pending tab bug
  const fetchPendingUsers = async () => {
    if (!token) return
    setIsLoadingPending(true)
    try {
      const params = new URLSearchParams({
        status: 'PENDING',
        limit: '100',
        sortBy: 'oldest',
      })
      const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPendingUsersList(data.users)
      }
    } catch (err) {
      console.error('Error fetching pending users:', err)
    } finally {
      setIsLoadingPending(false)
    }
  }

  // Fetch claims
  const fetchClaims = async () => {
    if (!token) return
    setIsLoadingClaims(true)
    try {
      const response = await fetch(
        `${API_URL}/api/admin/claims?page=${claimsPagination.page}&limit=${claimsPagination.limit}&status=${claimsFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setClaims(data.claims)
        setClaimsPagination(prev => ({ ...prev, ...data.pagination }))
      }
    } catch (err) {
      console.error('Error fetching claims:', err)
    } finally {
      setIsLoadingClaims(false)
    }
  }

  // Fetch claim stats
  const fetchClaimStats = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/api/admin/claims/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setClaimStats(data)
      }
    } catch (err) {
      console.error('Error fetching claim stats:', err)
    }
  }

  // Approve claim
  const handleApproveClaim = async () => {
    if (!selectedClaim) return
    setIsProcessingClaim(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/claims/${selectedClaim.id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Claim approved', {
          description: `Profile transferred to ${selectedClaim.claimantEmail}. Temporary password: ${data.temporaryPassword}`,
        })
        fetchClaims()
        fetchClaimStats()
        setShowApproveConfirm(false)
        setShowClaimDetail(false)
        setSelectedClaim(null)
      } else {
        toast.error('Failed to approve claim', { description: data.error })
      }
    } catch (err) {
      toast.error('Failed to approve claim')
    } finally {
      setIsProcessingClaim(false)
    }
  }

  // Reject claim
  const handleRejectClaim = async () => {
    if (!selectedClaim) return
    setIsProcessingClaim(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/claims/${selectedClaim.id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      })
      const data = await response.json()
      if (response.ok) {
        toast.success('Claim rejected')
        fetchClaims()
        fetchClaimStats()
        setShowRejectConfirm(false)
        setShowClaimDetail(false)
        setSelectedClaim(null)
        setRejectReason('')
      } else {
        toast.error('Failed to reject claim', { description: data.error })
      }
    } catch (err) {
      toast.error('Failed to reject claim')
    } finally {
      setIsProcessingClaim(false)
    }
  }

  // Save auto-sync settings
  const handleSaveAutoSync = async (updates) => {
    setIsSavingAutoSync(true)
    try {
      const response = await fetch(`${API_URL}/api/admin/settings/auto-sync`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      setAutoSyncSettings(prev => ({ ...prev, ...updates }))
      toast.success('Auto-sync settings saved', {
        description: updates.enabled ? `Will sync every ${updates.intervalMins || autoSyncSettings.intervalMins} minutes` : 'Auto-sync disabled',
      })
    } catch (error) {
      toast.error('Failed to save settings', {
        description: error.message,
      })
    } finally {
      setIsSavingAutoSync(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchStats()
    fetchUsers()
    fetchAutoSyncSettings()
    fetchSyncHealth()
    fetchPendingUsers()
    fetchClaims()
    fetchClaimStats()
  }, [token])

  // Refetch claims when filter changes
  useEffect(() => {
    fetchClaims()
  }, [claimsFilter, claimsPagination.page])

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
    await Promise.all([fetchStats(), fetchUsers(pagination.page), fetchPendingUsers(), fetchClaims(), fetchClaimStats()])
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  // Approve user
  const handleApprove = async (userId) => {
    const targetUser = users.find(u => u.id === userId) || pendingUsersList.find(u => u.id === userId)
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: 'APPROVED' } : u))
        setPendingUsersList(pendingUsersList.filter(u => u.id !== userId))
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
    const targetUser = users.find(u => u.id === userId) || pendingUsersList.find(u => u.id === userId)
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: 'REJECTED' } : u))
        setPendingUsersList(pendingUsersList.filter(u => u.id !== userId))
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

  // Save all user changes (role, status, apple music)
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
          appleMusicId: selectedUser.appleMusicId,
          appleMusicUrl: selectedUser.appleMusicUrl,
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
        if (originalUser.appleMusicId !== selectedUser.appleMusicId) {
          changes.push(selectedUser.appleMusicId ? 'Apple Music linked' : 'Apple Music unlinked')
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
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
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
            <TabsTrigger value="claims" className="gap-2">
              <FileQuestion className="w-4 h-4" />
              <span className="hidden sm:inline">Claims</span>
              {claimStats.pending > 0 && (
                <Badge variant="secondary" className="ml-1">{claimStats.pending}</Badge>
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
                {isLoadingPending ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : pendingUsersList.length > 0 ? (
                  <div className="space-y-4">
                    {pendingUsersList.map((u) => (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Avatar & Info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.artistName}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <Music className="w-6 h-6 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold">{u.artistName || u.name || 'No name'}</h4>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                                {u.createdAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(u.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                                {u.genres && (
                                  <span className="text-primary">{u.genres}</span>
                                )}
                                {u.region && u.region !== 'Tampa Bay' && (
                                  <span>{u.region}</span>
                                )}
                              </div>
                              {/* Social Links Preview */}
                              <div className="flex items-center gap-2 mt-2">
                                {u.appleMusicUrl && (
                                  <a
                                    href={u.appleMusicUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-pink-400 hover:text-pink-300 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Apple Music"
                                  >
                                    <Music className="w-4 h-4" />
                                  </a>
                                )}
                                {u.instagramUrl && (
                                  <a
                                    href={u.instagramUrl.startsWith('http') ? u.instagramUrl : `https://instagram.com/${u.instagramUrl.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-pink-400 hover:text-pink-300 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Instagram"
                                  >
                                    <Instagram className="w-4 h-4" />
                                  </a>
                                )}
                                {u.twitterUrl && (
                                  <a
                                    href={u.twitterUrl.startsWith('http') ? u.twitterUrl : `https://twitter.com/${u.twitterUrl.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Twitter/X"
                                  >
                                    <Twitter className="w-4 h-4" />
                                  </a>
                                )}
                                {u.youtubeUrl && (
                                  <a
                                    href={u.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                    title="YouTube"
                                  >
                                    <Youtube className="w-4 h-4" />
                                  </a>
                                )}
                                {u.websiteUrl && (
                                  <a
                                    href={u.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Website"
                                  >
                                    <Globe className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPendingUser(u)
                                setShowPendingDetail(true)
                              }}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(u.id)}
                              className="gap-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="hidden sm:inline">Approve</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(u.id)}
                              className="gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">Reject</span>
                            </Button>
                          </div>
                        </div>

                        {/* Bio Preview */}
                        {u.bio && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{u.bio}</p>
                        )}
                      </motion.div>
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

          {/* Claims Tab */}
          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Profile Claims</CardTitle>
                    <CardDescription>
                      Review and process profile ownership claims
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={claimsFilter} onValueChange={setClaimsFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending ({claimStats.pending})</SelectItem>
                        <SelectItem value="APPROVED">Approved ({claimStats.approved})</SelectItem>
                        <SelectItem value="REJECTED">Rejected ({claimStats.rejected})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingClaims ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : claims.length === 0 ? (
                  <div className="text-center py-12">
                    <FileQuestion className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No {claimsFilter.toLowerCase()} claims</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {claims.map((claim) => (
                      <motion.div
                        key={claim.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {claim.profile?.avatar ? (
                              <img
                                src={claim.profile.avatar}
                                alt={claim.profile.artistName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                                <Music className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium">{claim.profile?.artistName || 'Unknown Profile'}</h4>
                              <p className="text-sm text-muted-foreground">{claim.claimantEmail}</p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {new Date(claim.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {claim.status === 'PENDING' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedClaim(claim)
                                    setShowClaimDetail(true)
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedClaim(claim)
                                    setShowApproveConfirm(true)
                                  }}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedClaim(claim)
                                    setShowRejectConfirm(true)
                                  }}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Badge className={
                                claim.status === 'APPROVED'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                              }>
                                {claim.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
                      <p className="font-medium">Apple Music Connect</p>
                      <p className="text-sm text-muted-foreground">Allow Apple Music OAuth</p>
                    </div>
                    <Switch
                      checked={settings.allowAppleMusicConnect}
                      onCheckedChange={(checked) => setSettings({ ...settings, allowAppleMusicConnect: checked })}
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

                  {/* Refresh Artist Data from Apple Music */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Refresh Artist Data</p>
                        <p className="text-sm text-muted-foreground">
                          Update popularity, followers, genres & avatars from Apple Music for all artists
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
                          Fetch all releases from Apple Music and store in database (survives server restarts)
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

                  {/* Auto-Sync Settings */}
                  <div className="pt-4 border-t border-border">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Auto-Sync Apple Music</p>
                          <p className="text-sm text-muted-foreground">
                            Automatically sync artist data and releases from Apple Music
                          </p>
                        </div>
                        <Switch
                          checked={autoSyncSettings.enabled}
                          onCheckedChange={(checked) => handleSaveAutoSync({ enabled: checked })}
                          disabled={isSavingAutoSync || isLoadingAutoSync}
                        />
                      </div>

                      {autoSyncSettings.enabled && (
                        <div className="pl-4 border-l-2 border-primary/20 space-y-3">
                          <div className="flex items-center gap-3">
                            <Label htmlFor="sync-interval" className="text-sm whitespace-nowrap">
                              Sync every:
                            </Label>
                            <Select
                              value={String(autoSyncSettings.intervalMins)}
                              onValueChange={(value) => handleSaveAutoSync({ intervalMins: parseInt(value) })}
                              disabled={isSavingAutoSync}
                            >
                              <SelectTrigger id="sync-interval" className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="120">2 hours</SelectItem>
                                <SelectItem value="180">3 hours</SelectItem>
                                <SelectItem value="360">6 hours</SelectItem>
                                <SelectItem value="720">12 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {autoSyncSettings.lastSyncAt && (
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Last sync: {new Date(autoSyncSettings.lastSyncAt).toLocaleString()}
                              </p>
                              {autoSyncSettings.lastSyncStatus && (
                                <p className="flex items-center gap-2">
                                  {autoSyncSettings.lastSyncStatus === 'success' ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  ) : autoSyncSettings.lastSyncStatus === 'partial' ? (
                                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  {autoSyncSettings.lastSyncMessage}
                                </p>
                              )}
                              {autoSyncSettings.isRunning && (
                                <p className="flex items-center gap-2 text-primary">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Sync in progress...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sync Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Sync Health
                  </CardTitle>
                  <CardDescription>Artist sync status and recent sync history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {syncHealth && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-green-500/10 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-500">{syncHealth.healthy}</p>
                        <p className="text-xs text-muted-foreground">Healthy</p>
                      </div>
                      <div className="p-3 bg-yellow-500/10 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-500">{syncHealth.stale}</p>
                        <p className="text-xs text-muted-foreground">Stale (&gt;24h)</p>
                      </div>
                      <div className="p-3 bg-orange-500/10 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-500">{syncHealth.failing}</p>
                        <p className="text-xs text-muted-foreground">Failing</p>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-500">{syncHealth.quarantined}</p>
                        <p className="text-xs text-muted-foreground">Quarantined</p>
                      </div>
                    </div>
                  )}

                  {/* Recent Sync Logs */}
                  {syncLogs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recent Syncs</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {syncLogs.slice(0, 5).map((log) => (
                          <div key={log.id} className="flex items-center justify-between text-xs p-2 bg-secondary/30 rounded">
                            <div className="flex items-center gap-2">
                              {log.status === 'success' ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                              ) : log.status === 'partial' ? (
                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500" />
                              )}
                              <span className="text-muted-foreground">{log.message}</span>
                            </div>
                            <span className="text-muted-foreground whitespace-nowrap ml-2">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSyncHealth}
                    disabled={isLoadingSyncHealth}
                  >
                    Refresh Sync Health
                  </Button>
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
                Update user role, status, region, genres, links, and Apple Music profile
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

                {/* Apple Music Profile Section */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <Label className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-pink-500" />
                    Apple Music Artist Profile
                  </Label>

                  {selectedUser.appleMusicId ? (
                    <div className="p-3 rounded-lg border border-pink-500/30 bg-pink-500/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-pink-400" />
                          <span className="text-sm">Linked: {selectedUser.appleMusicId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedUser.appleMusicUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(selectedUser.appleMusicUrl, '_blank')}
                              className="h-8 w-8 p-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAdminAppleMusicUnlink}
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
                          value={appleMusicUrlInput}
                          onChange={(e) => setAppleMusicUrlInput(e.target.value)}
                          placeholder="https://music.apple.com/artist/..."
                          className="flex-1"
                        />
                        <Button
                          onClick={handleAppleMusicPreview}
                          disabled={appleMusicLoading || !appleMusicUrlInput.trim()}
                          size="sm"
                        >
                          {appleMusicLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {appleMusicPreview && (
                        <div className="p-3 rounded-lg border border-border bg-secondary/30">
                          <div className="flex items-center gap-3">
                            {appleMusicPreview.image ? (
                              <img
                                src={appleMusicPreview.image}
                                alt={appleMusicPreview.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                                <Music className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{appleMusicPreview.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {appleMusicPreview.followers?.toLocaleString()} followers
                              </p>
                            </div>
                            <Button
                              onClick={handleAdminAppleMusicLink}
                              disabled={appleMusicLoading}
                              size="sm"
                              className="gap-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
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

        {/* Add Artist from Apple Music Dialog */}
        <Dialog open={showAddArtist} onOpenChange={handleAddArtistDialogChange}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Add Artist from Apple Music
              </DialogTitle>
              <DialogDescription>
                Create a new artist profile by entering their Apple Music URL. The profile will be auto-populated with their Apple Music data.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Apple Music URL Input */}
              <div className="space-y-2">
                <Label htmlFor="addArtistUrl">Apple Music Artist URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="addArtistUrl"
                    value={addArtistUrl}
                    onChange={(e) => setAddArtistUrl(e.target.value)}
                    placeholder="https://music.apple.com/artist/..."
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
                onClick={handleCreateArtistFromAppleMusic}
                disabled={!addArtistPreview || addArtistLoading}
                className="gap-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
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

        {/* Claim Detail Dialog */}
        <Dialog open={showClaimDetail} onOpenChange={setShowClaimDetail}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-primary" />
                Claim Details
              </DialogTitle>
            </DialogHeader>
            {selectedClaim && (
              <div className="space-y-4 py-4">
                {/* Profile being claimed */}
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Profile Being Claimed</p>
                  <div className="flex items-center gap-3">
                    {selectedClaim.profile?.avatar ? (
                      <img
                        src={selectedClaim.profile.avatar}
                        alt={selectedClaim.profile.artistName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{selectedClaim.profile?.artistName}</p>
                      <p className="text-xs text-muted-foreground">/{selectedClaim.profile?.profileSlug}</p>
                    </div>
                  </div>
                </div>

                {/* Claimant info */}
                <div>
                  <Label>Claimant Email</Label>
                  <p className="text-sm mt-1">{selectedClaim.claimantEmail}</p>
                </div>

                {/* Social links */}
                <div>
                  <Label>Social Links</Label>
                  <div className="mt-2 space-y-2">
                    {/* Instagram */}
                    <div className="flex items-center gap-2 text-sm">
                      <Instagram className="w-4 h-4 text-muted-foreground" />
                      {selectedClaim.instagramUrl ? (
                        <a href={selectedClaim.instagramUrl.startsWith('http') ? selectedClaim.instagramUrl : `https://instagram.com/${selectedClaim.instagramUrl.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                           className="text-primary hover:underline">
                          {selectedClaim.instagramUrl}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </div>
                    {/* Twitter/X */}
                    <div className="flex items-center gap-2 text-sm">
                      <Twitter className="w-4 h-4 text-muted-foreground" />
                      {selectedClaim.twitterUrl ? (
                        <a href={selectedClaim.twitterUrl.startsWith('http') ? selectedClaim.twitterUrl : `https://twitter.com/${selectedClaim.twitterUrl.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                           className="text-primary hover:underline">
                          {selectedClaim.twitterUrl}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </div>
                    {/* TikTok */}
                    <div className="flex items-center gap-2 text-sm">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-muted-foreground">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      {selectedClaim.tiktokUrl ? (
                        <a href={selectedClaim.tiktokUrl.startsWith('http') ? selectedClaim.tiktokUrl : `https://tiktok.com/@${selectedClaim.tiktokUrl.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                           className="text-primary hover:underline">
                          {selectedClaim.tiktokUrl}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </div>
                    {/* YouTube */}
                    <div className="flex items-center gap-2 text-sm">
                      <Youtube className="w-4 h-4 text-muted-foreground" />
                      {selectedClaim.youtubeUrl ? (
                        <a href={selectedClaim.youtubeUrl} target="_blank" rel="noopener noreferrer"
                           className="text-primary hover:underline">
                          {selectedClaim.youtubeUrl}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </div>
                    {/* Website */}
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      {selectedClaim.websiteUrl ? (
                        <a href={selectedClaim.websiteUrl} target="_blank" rel="noopener noreferrer"
                           className="text-primary hover:underline">
                          {selectedClaim.websiteUrl}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Proof text */}
                <div>
                  <Label>Proof of Identity</Label>
                  <p className="text-sm mt-1 p-2 bg-secondary/30 rounded-lg whitespace-pre-wrap">
                    {selectedClaim.proofText}
                  </p>
                </div>

                {/* Optional message */}
                {selectedClaim.message && (
                  <div>
                    <Label>Additional Message</Label>
                    <p className="text-sm mt-1 p-2 bg-secondary/30 rounded-lg">
                      {selectedClaim.message}
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Submitted: {new Date(selectedClaim.createdAt).toLocaleString()}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClaimDetail(false)}>
                Close
              </Button>
              {selectedClaim?.status === 'PENDING' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowClaimDetail(false)
                      setShowRejectConfirm(true)
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setShowClaimDetail(false)
                      setShowApproveConfirm(true)
                    }}
                  >
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pending User Detail Dialog */}
        <Dialog open={showPendingDetail} onOpenChange={setShowPendingDetail}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedPendingUser && (
              <>
                <DialogHeader>
                  <DialogTitle>Application Details</DialogTitle>
                  <DialogDescription>
                    Review the artist application details below
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4">
                    {selectedPendingUser.avatar ? (
                      <img
                        src={selectedPendingUser.avatar}
                        alt={selectedPendingUser.artistName}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Music className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{selectedPendingUser.artistName || selectedPendingUser.name || 'No name'}</h3>
                      <p className="text-sm text-muted-foreground">{selectedPendingUser.email}</p>
                      {selectedPendingUser.profileSlug && (
                        <p className="text-xs text-muted-foreground">/{selectedPendingUser.profileSlug}</p>
                      )}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Region</p>
                      <p className="text-sm font-medium">{selectedPendingUser.region || 'Tampa Bay'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Applied</p>
                      <p className="text-sm font-medium">{new Date(selectedPendingUser.createdAt).toLocaleDateString()}</p>
                    </div>
                    {selectedPendingUser.genres && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Genres</p>
                        <p className="text-sm font-medium text-primary">{selectedPendingUser.genres}</p>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {selectedPendingUser.bio && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Bio</p>
                      <p className="text-sm bg-secondary/30 p-3 rounded-lg">{selectedPendingUser.bio}</p>
                    </div>
                  )}

                  {/* Social Links */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Social Links</p>
                    <div className="space-y-2">
                      {selectedPendingUser.appleMusicUrl && (
                        <a
                          href={selectedPendingUser.appleMusicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300 transition-colors"
                        >
                          <Music className="w-4 h-4" />
                          Apple Music Profile
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedPendingUser.instagramUrl && (
                        <a
                          href={selectedPendingUser.instagramUrl.startsWith('http') ? selectedPendingUser.instagramUrl : `https://instagram.com/${selectedPendingUser.instagramUrl.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300 transition-colors"
                        >
                          <Instagram className="w-4 h-4" />
                          {selectedPendingUser.instagramUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedPendingUser.twitterUrl && (
                        <a
                          href={selectedPendingUser.twitterUrl.startsWith('http') ? selectedPendingUser.twitterUrl : `https://twitter.com/${selectedPendingUser.twitterUrl.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Twitter className="w-4 h-4" />
                          {selectedPendingUser.twitterUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedPendingUser.youtubeUrl && (
                        <a
                          href={selectedPendingUser.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Youtube className="w-4 h-4" />
                          YouTube Channel
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedPendingUser.tiktokUrl && (
                        <a
                          href={selectedPendingUser.tiktokUrl.startsWith('http') ? selectedPendingUser.tiktokUrl : `https://tiktok.com/@${selectedPendingUser.tiktokUrl.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                          {selectedPendingUser.tiktokUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedPendingUser.websiteUrl && (
                        <a
                          href={selectedPendingUser.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          {selectedPendingUser.websiteUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {!selectedPendingUser.appleMusicUrl && !selectedPendingUser.instagramUrl && !selectedPendingUser.twitterUrl && !selectedPendingUser.youtubeUrl && !selectedPendingUser.tiktokUrl && !selectedPendingUser.websiteUrl && (
                        <p className="text-sm text-muted-foreground italic">No social links provided</p>
                      )}
                    </div>
                  </div>

                  {/* Apple Music Stats */}
                  {(selectedPendingUser.followers > 0 || selectedPendingUser.popularity > 0) && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      {selectedPendingUser.followers > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Apple Music Followers</p>
                          <p className="text-sm font-medium text-green-400">{selectedPendingUser.followers.toLocaleString()}</p>
                        </div>
                      )}
                      {selectedPendingUser.popularity > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Popularity Score</p>
                          <p className="text-sm font-medium text-green-400">{selectedPendingUser.popularity}/100</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPendingDetail(false)}>
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowPendingDetail(false)
                      handleReject(selectedPendingUser.id)
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setShowPendingDetail(false)
                      handleApprove(selectedPendingUser.id)
                    }}
                  >
                    Approve
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Approve Confirmation Dialog */}
        <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                Approve Claim
              </DialogTitle>
              <DialogDescription>
                This will transfer ownership of <strong>{selectedClaim?.profile?.artistName}</strong> to{' '}
                <strong>{selectedClaim?.claimantEmail}</strong>. A temporary password will be generated.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApproveConfirm(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApproveClaim}
                disabled={isProcessingClaim}
              >
                {isProcessingClaim ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Approve & Transfer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Confirmation Dialog */}
        <Dialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <XCircle className="w-5 h-5" />
                Reject Claim
              </DialogTitle>
              <DialogDescription>
                Reject the claim from <strong>{selectedClaim?.claimantEmail}</strong> for{' '}
                <strong>{selectedClaim?.profile?.artistName}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="rejectReason">Reason (optional)</Label>
              <Textarea
                id="rejectReason"
                placeholder="Provide a reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectClaim}
                disabled={isProcessingClaim}
              >
                {isProcessingClaim ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject Claim'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
