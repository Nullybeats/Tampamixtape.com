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

  // Messages
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

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
      })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (roleFilter !== 'all') params.append('role', roleFilter)

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
  }, [statusFilter, roleFilter])

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

  // Filter users by search (client-side for quick filtering)
  const filteredUsers = users.filter(u =>
    u.artistName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                                onClick={() => navigate(`/u/${u.profileSlug}`)}
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
        <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-primary" />
                Edit User
              </DialogTitle>
              <DialogDescription>
                Update user role and status
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 py-4">
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
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditUser(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdateRole(selectedUser.id, selectedUser.role)}
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
      </div>
    </div>
  )
}
