import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth, APPROVAL_STATUS } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Trash2,
  Music,
  ExternalLink,
  BarChart3,
  Shield,
  MapPin,
  Mail,
  Calendar,
  Eye,
  AlertCircle,
  Loader2,
} from 'lucide-react'

export function AdminDashboard() {
  const navigate = useNavigate()
  const {
    creators,
    searchSpotifyArtists,
    isArtistRegistered,
    addCreatorByAdmin,
    updateCreatorByAdmin,
    deleteCreatorByAdmin,
    approveCreatorByAdmin,
    rejectCreatorByAdmin,
    spotifyToken,
    loginWithSpotify,
  } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddCreator, setShowAddCreator] = useState(false)
  const [showEditCreator, setShowEditCreator] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedCreator, setSelectedCreator] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Add creator form state
  const [newCreatorForm, setNewCreatorForm] = useState({
    artistName: '',
    email: '',
    city: 'Tampa',
    state: 'Florida',
    bio: '',
    genres: '',
    approvalStatus: APPROVAL_STATUS.APPROVED,
    isVerified: true,
    spotifyArtistId: null,
    profileImage: null,
  })

  // Spotify search state
  const [spotifyResults, setSpotifyResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSpotifyArtist, setSelectedSpotifyArtist] = useState(null)
  const [showSpotifyDropdown, setShowSpotifyDropdown] = useState(false)
  const searchTimeoutRef = useRef(null)
  const artistNameInputRef = useRef(null)

  // Debounced Spotify search as user types artist name
  const debouncedSpotifySearch = useCallback(async (query) => {
    if (!query || query.length < 2 || !spotifyToken) {
      setSpotifyResults([])
      setShowSpotifyDropdown(false)
      return
    }

    setIsSearching(true)
    try {
      const results = await searchSpotifyArtists(query)
      setSpotifyResults(results)
      setShowSpotifyDropdown(results.length > 0)
    } catch (err) {
      console.error('Spotify search error:', err)
    } finally {
      setIsSearching(false)
    }
  }, [spotifyToken, searchSpotifyArtists])

  // Handle artist name change with debounced search
  const handleArtistNameChange = (value) => {
    setNewCreatorForm({ ...newCreatorForm, artistName: value })

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Only search if not already selected from Spotify
    if (!selectedSpotifyArtist) {
      searchTimeoutRef.current = setTimeout(() => {
        debouncedSpotifySearch(value)
      }, 300)
    }
  }

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

  // Filter creators
  const filteredCreators = creators.filter(creator => {
    const matchesSearch =
      creator.artistName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || creator.approvalStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: creators.length,
    approved: creators.filter(c => c.approvalStatus === APPROVAL_STATUS.APPROVED).length,
    pending: creators.filter(c => c.approvalStatus === APPROVAL_STATUS.PENDING).length,
    rejected: creators.filter(c => c.approvalStatus === APPROVAL_STATUS.REJECTED).length,
  }

  // Select Spotify artist
  const handleSelectSpotifyArtist = (artist) => {
    // Check if already registered
    if (isArtistRegistered(artist.name, artist.id)) {
      setError('This artist is already registered on TampaMixtape')
      return
    }

    setSelectedSpotifyArtist(artist)
    setNewCreatorForm({
      ...newCreatorForm,
      artistName: artist.name,
      spotifyArtistId: artist.id,
      profileImage: artist.images?.[0]?.url || null,
      genres: artist.genres?.slice(0, 3).join(', ') || '',
    })
    setSpotifyResults([])
    setShowSpotifyDropdown(false)
  }

  // Clear Spotify selection
  const clearSpotifySelection = () => {
    setSelectedSpotifyArtist(null)
    setNewCreatorForm({
      ...newCreatorForm,
      artistName: '',
      spotifyArtistId: null,
      profileImage: null,
      genres: '',
    })
    setSpotifyResults([])
    setShowSpotifyDropdown(false)
    // Focus back on input
    setTimeout(() => artistNameInputRef.current?.focus(), 0)
  }

  // Add new creator
  const handleAddCreator = () => {
    if (!newCreatorForm.artistName || !newCreatorForm.email) {
      setError('Artist name and email are required')
      return
    }

    try {
      addCreatorByAdmin({
        ...newCreatorForm,
        genres: newCreatorForm.genres.split(',').map(g => g.trim()).filter(Boolean),
      })
      setSuccess(`${newCreatorForm.artistName} has been added successfully`)
      setShowAddCreator(false)
      resetNewCreatorForm()
    } catch (err) {
      setError(err.message)
    }
  }

  // Reset form
  const resetNewCreatorForm = () => {
    setNewCreatorForm({
      artistName: '',
      email: '',
      city: 'Tampa',
      state: 'Florida',
      bio: '',
      genres: '',
      approvalStatus: APPROVAL_STATUS.APPROVED,
      isVerified: true,
      spotifyArtistId: null,
      profileImage: null,
    })
    setSelectedSpotifyArtist(null)
    setSpotifyResults([])
    setShowSpotifyDropdown(false)
  }

  // Edit creator
  const handleEditCreator = (creator) => {
    setSelectedCreator(creator)
    setShowEditCreator(true)
  }

  // Update creator
  const handleUpdateCreator = () => {
    if (!selectedCreator) return
    try {
      updateCreatorByAdmin(selectedCreator.id, selectedCreator)
      setSuccess(`${selectedCreator.artistName} has been updated`)
      setShowEditCreator(false)
      setSelectedCreator(null)
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete creator
  const handleDeleteCreator = () => {
    if (!selectedCreator) return
    try {
      deleteCreatorByAdmin(selectedCreator.id)
      setSuccess(`${selectedCreator.artistName} has been removed`)
      setShowDeleteConfirm(false)
      setSelectedCreator(null)
    } catch (err) {
      setError(err.message)
    }
  }

  // Approve/Reject
  const handleApprove = (creatorId) => {
    const creator = creators.find(c => c.id === creatorId)
    approveCreatorByAdmin(creatorId)
    setSuccess(`${creator?.artistName} has been approved`)
  }

  const handleReject = (creatorId) => {
    const creator = creators.find(c => c.id === creatorId)
    rejectCreatorByAdmin(creatorId)
    setSuccess(`${creator?.artistName} has been rejected`)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case APPROVAL_STATUS.APPROVED:
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />Approved</Badge>
      case APPROVAL_STATUS.PENDING:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1"><Clock className="w-3 h-3" />Pending</Badge>
      case APPROVAL_STATUS.REJECTED:
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage creators and platform settings</p>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
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
            className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400"
          >
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Creators</p>
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
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
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
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="creators" className="space-y-6">
          <TabsList>
            <TabsTrigger value="creators" className="gap-2">
              <Users className="w-4 h-4" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({stats.pending})
            </TabsTrigger>
          </TabsList>

          {/* Creators Tab */}
          <TabsContent value="creators">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>All Creators</CardTitle>
                    <CardDescription>Manage registered creators on the platform</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddCreator(true)} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Add Creator
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
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
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value={APPROVAL_STATUS.APPROVED}>Approved</SelectItem>
                      <SelectItem value={APPROVAL_STATUS.PENDING}>Pending</SelectItem>
                      <SelectItem value={APPROVAL_STATUS.REJECTED}>Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Creators List */}
                <div className="space-y-3">
                  {filteredCreators.length > 0 ? (
                    filteredCreators.map((creator) => (
                      <div
                        key={creator.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors"
                      >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {creator.profileImage ? (
                            <img src={creator.profileImage} alt={creator.artistName} className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-6 h-6 text-primary" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold truncate">{creator.artistName}</h4>
                            {creator.isVerified && (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            )}
                            {getStatusBadge(creator.approvalStatus)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {creator.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {creator.city}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/u/${creator.profileSlug}`)}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCreator(creator)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedCreator(creator); setShowDeleteConfirm(true); }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No creators found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Review and approve creator applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {creators.filter(c => c.approvalStatus === APPROVAL_STATUS.PENDING).length > 0 ? (
                    creators
                      .filter(c => c.approvalStatus === APPROVAL_STATUS.PENDING)
                      .map((creator) => (
                        <div
                          key={creator.id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5"
                        >
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {creator.profileImage ? (
                              <img src={creator.profileImage} alt={creator.artistName} className="w-full h-full object-cover" />
                            ) : (
                              <Music className="w-6 h-6 text-primary" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{creator.artistName}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {creator.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {creator.city}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(creator.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(creator.id)}
                              className="gap-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(creator.id)}
                              className="gap-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending approvals</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Creator Dialog */}
        <Dialog open={showAddCreator} onOpenChange={(open) => { setShowAddCreator(open); if (!open) resetNewCreatorForm(); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Add New Creator
              </DialogTitle>
              <DialogDescription>
                Add a new creator to the platform. Search Spotify for artist info or enter manually.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Spotify Connection Notice */}
              {!spotifyToken && (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 border border-border rounded-lg">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Connect Spotify for artist autocomplete</p>
                    <p className="text-xs text-muted-foreground">Search will populate artist info automatically</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loginWithSpotify}
                    className="gap-2"
                  >
                    Connect
                  </Button>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Artist Name with Autocomplete */}
                  <div className="space-y-2 relative">
                    <Label>Artist Name *</Label>
                    {selectedSpotifyArtist ? (
                      /* Selected Spotify Artist Display */
                      <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-md">
                        <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                          {selectedSpotifyArtist.images?.[0] ? (
                            <img src={selectedSpotifyArtist.images[0].url} alt={selectedSpotifyArtist.name} className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-4 h-4 m-2 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedSpotifyArtist.name}</p>
                          <p className="text-xs text-green-400">From Spotify</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSpotifySelection}
                          className="h-6 w-6 p-0"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      /* Artist Name Input with Autocomplete */
                      <div className="relative">
                        <Input
                          ref={artistNameInputRef}
                          value={newCreatorForm.artistName}
                          onChange={(e) => handleArtistNameChange(e.target.value)}
                          onFocus={() => spotifyResults.length > 0 && setShowSpotifyDropdown(true)}
                          onBlur={() => setTimeout(() => setShowSpotifyDropdown(false), 200)}
                          placeholder={spotifyToken ? "Start typing to search Spotify..." : "Artist name"}
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                        )}

                        {/* Spotify Autocomplete Dropdown */}
                        {showSpotifyDropdown && spotifyResults.length > 0 && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-md shadow-lg">
                            {spotifyResults.map((artist) => {
                              const alreadyRegistered = isArtistRegistered(artist.name, artist.id)
                              return (
                                <button
                                  key={artist.id}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectSpotifyArtist(artist)}
                                  disabled={alreadyRegistered}
                                  className={`w-full flex items-center gap-2 p-2 text-left transition-colors ${
                                    alreadyRegistered
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'hover:bg-secondary/50'
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                                    {artist.images?.[0] ? (
                                      <img src={artist.images[0].url} alt={artist.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Music className="w-4 h-4 m-2 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{artist.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {artist.genres?.slice(0, 2).join(', ') || 'No genres'}
                                    </p>
                                  </div>
                                  {alreadyRegistered && (
                                    <Badge variant="secondary" className="text-xs">Registered</Badge>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newCreatorForm.email}
                      onChange={(e) => setNewCreatorForm({ ...newCreatorForm, email: e.target.value })}
                      placeholder="artist@email.com"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={newCreatorForm.city}
                      onChange={(e) => setNewCreatorForm({ ...newCreatorForm, city: e.target.value })}
                      placeholder="Tampa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={newCreatorForm.approvalStatus}
                      onValueChange={(value) => setNewCreatorForm({ ...newCreatorForm, approvalStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={APPROVAL_STATUS.APPROVED}>Approved</SelectItem>
                        <SelectItem value={APPROVAL_STATUS.PENDING}>Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Genres (comma separated)</Label>
                  <Input
                    value={newCreatorForm.genres}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, genres: e.target.value })}
                    placeholder="Hip-Hop, R&B, Electronic"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <textarea
                    value={newCreatorForm.bio}
                    onChange={(e) => setNewCreatorForm({ ...newCreatorForm, bio: e.target.value })}
                    placeholder="Short bio about the artist..."
                    className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddCreator(false); resetNewCreatorForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleAddCreator} className="gap-2">
                <UserPlus className="w-4 h-4" />
                Add Creator
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Creator Dialog */}
        <Dialog open={showEditCreator} onOpenChange={setShowEditCreator}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                Edit Creator
              </DialogTitle>
            </DialogHeader>

            {selectedCreator && (
              <div className="space-y-4 py-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Artist Name</Label>
                    <Input
                      value={selectedCreator.artistName}
                      onChange={(e) => setSelectedCreator({ ...selectedCreator, artistName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={selectedCreator.email}
                      onChange={(e) => setSelectedCreator({ ...selectedCreator, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={selectedCreator.city}
                      onChange={(e) => setSelectedCreator({ ...selectedCreator, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedCreator.approvalStatus}
                      onValueChange={(value) => setSelectedCreator({ ...selectedCreator, approvalStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={APPROVAL_STATUS.APPROVED}>Approved</SelectItem>
                        <SelectItem value={APPROVAL_STATUS.PENDING}>Pending</SelectItem>
                        <SelectItem value={APPROVAL_STATUS.REJECTED}>Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isVerified"
                    checked={selectedCreator.isVerified}
                    onChange={(e) => setSelectedCreator({ ...selectedCreator, isVerified: e.target.checked })}
                    className="rounded border-input"
                  />
                  <Label htmlFor="isVerified" className="cursor-pointer">Verified Tampa Artist</Label>
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <textarea
                    value={selectedCreator.bio || ''}
                    onChange={(e) => setSelectedCreator({ ...selectedCreator, bio: e.target.value })}
                    className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditCreator(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateCreator} className="gap-2">
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
                Delete Creator
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{selectedCreator?.artistName}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCreator} className="gap-2">
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
