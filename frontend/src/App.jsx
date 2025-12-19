import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { ChartsSection } from '@/components/landing/ChartsSection'
import { DiscoverySection } from '@/components/landing/DiscoverySection'
import { Hot100Section } from '@/components/landing/Hot100Section'
import { AnalyticsCards } from '@/components/landing/AnalyticsCards'
import { Footer } from '@/components/landing/Footer'
import { EventsSection } from '@/components/landing/EventsSection'
import { AuthModal } from '@/components/auth/AuthModal'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { ArtistPage } from '@/components/artist/ArtistPage'
import { PendingApproval } from '@/components/user/PendingApproval'
import { UserProfilePage } from '@/components/user/UserProfilePage'
import { UserSettings } from '@/components/user/UserSettings'
import { EventsPage } from '@/components/events/EventsPage'
import { ArtistsPage } from '@/components/artists/ArtistsPage'
import { ReleasesPage } from '@/components/releases/ReleasesPage'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

function LandingPage({ onAuthClick, onArtistClick }) {
  const navigate = useNavigate()
  const { isAuthenticated, isApproved } = useAuth()

  const handleDashboardClick = () => {
    if (isAuthenticated) {
      if (isApproved) {
        navigate('/profile')
      } else {
        navigate('/pending')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onDashboardClick={handleDashboardClick}
      />
      <main>
        <Hero />
        <ChartsSection />
        <DiscoverySection />
        <Hot100Section onArtistClick={onArtistClick} />
        <EventsSection />
        <AnalyticsCards />
      </main>
      <Footer />
    </div>
  )
}

function ArtistPageWrapper({ onAuthClick }) {
  const { artistId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isApproved } = useAuth()

  const handleBack = () => {
    navigate('/')
  }

  const handleDashboardClick = () => {
    if (isAuthenticated) {
      if (isApproved) {
        navigate('/profile')
      } else {
        navigate('/pending')
      }
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onDashboardClick={handleDashboardClick}
        onLogoClick={handleBack}
      />
      <ArtistPage
        artistId={artistId}
        onBack={handleBack}
      />
    </div>
  )
}

function DashboardPage({ onAuthClick }) {
  const navigate = useNavigate()

  const handleClose = () => {
    navigate('/')
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onDashboardClick={handleClose}
        onLogoClick={handleLogoClick}
      />
      <Dashboard onClose={handleClose} />
    </div>
  )
}

function PendingApprovalPage({ onAuthClick }) {
  const navigate = useNavigate()
  const { isAuthenticated, isApproved, isLoading } = useAuth()

  // Wait for auth to load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Redirect if not authenticated or already approved
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  if (isApproved) {
    return <Navigate to="/profile" replace />
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onLogoClick={handleLogoClick}
      />
      <PendingApproval />
    </div>
  )
}

function UserProfilePageWrapper({ onAuthClick }) {
  const navigate = useNavigate()
  const { isAuthenticated, isPending, isLoading, user } = useAuth()

  // Wait for auth to load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Redirect to pending if not approved
  if (isPending) {
    return <Navigate to="/pending" replace />
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleDashboardClick = () => {
    navigate('/profile')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onDashboardClick={handleDashboardClick}
        onLogoClick={handleLogoClick}
      />
      <UserProfilePage isOwnProfile={true} profileSlug={user?.profileSlug} />
    </div>
  )
}

function PublicProfilePageWrapper({ onAuthClick }) {
  const { profileSlug } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isApproved, user } = useAuth()

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleDashboardClick = () => {
    if (isAuthenticated && isApproved) {
      navigate('/profile')
    }
  }

  // Check if this is the user's own profile
  const isOwnProfile = isAuthenticated && user?.profileSlug === profileSlug

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onDashboardClick={handleDashboardClick}
        onLogoClick={handleLogoClick}
      />
      <UserProfilePage isOwnProfile={isOwnProfile} profileSlug={profileSlug} />
    </div>
  )
}

function UserSettingsPageWrapper({ onAuthClick }) {
  const navigate = useNavigate()
  const { isAuthenticated, isPending, isLoading } = useAuth()

  // Wait for auth to load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Redirect to pending if not approved
  if (isPending) {
    return <Navigate to="/pending" replace />
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleDashboardClick = () => {
    navigate('/profile')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onDashboardClick={handleDashboardClick}
        onLogoClick={handleLogoClick}
      />
      <UserSettings />
    </div>
  )
}

function EventsPageWrapper({ onAuthClick }) {
  const navigate = useNavigate()
  const { isAuthenticated, isApproved } = useAuth()

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleDashboardClick = () => {
    if (isAuthenticated && isApproved) {
      navigate('/profile')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onDashboardClick={handleDashboardClick}
        onLogoClick={handleLogoClick}
      />
      <EventsPage />
    </div>
  )
}

function ArtistsPageWrapper({ onAuthClick }) {
  const navigate = useNavigate()
  const { isAuthenticated, isApproved } = useAuth()

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleDashboardClick = () => {
    if (isAuthenticated && isApproved) {
      navigate('/profile')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onDashboardClick={handleDashboardClick}
        onLogoClick={handleLogoClick}
      />
      <ArtistsPage />
    </div>
  )
}

function ReleasesPageWrapper({ onAuthClick }) {
  const navigate = useNavigate()
  const { isAuthenticated, isApproved } = useAuth()

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleDashboardClick = () => {
    if (isAuthenticated && isApproved) {
      navigate('/profile')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onDashboardClick={handleDashboardClick}
        onLogoClick={handleLogoClick}
      />
      <ReleasesPage />
    </div>
  )
}

function AdminDashboardWrapper({ onAuthClick }) {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  // Wait for auth to load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />
  }

  const handleLogoClick = () => {
    navigate('/')
  }

  const handleDashboardClick = () => {
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        onAuthClick={onAuthClick}
        onDashboardClick={handleDashboardClick}
        onLogoClick={handleLogoClick}
      />
      <AdminDashboard />
    </div>
  )
}

function AppRoutes() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState('signup')
  const navigate = useNavigate()

  const handleAuthClick = (tab) => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  const handleArtistClick = (artistId, artistName) => {
    navigate(`/artist/${artistId}`)
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <LandingPage
              onAuthClick={handleAuthClick}
              onArtistClick={handleArtistClick}
            />
          }
        />
        <Route
          path="/artist/:artistId"
          element={<ArtistPageWrapper onAuthClick={handleAuthClick} />}
        />

        {/* User Routes */}
        <Route
          path="/pending"
          element={<PendingApprovalPage onAuthClick={handleAuthClick} />}
        />
        <Route
          path="/profile"
          element={<UserProfilePageWrapper onAuthClick={handleAuthClick} />}
        />
        <Route
          path="/settings"
          element={<UserSettingsPageWrapper onAuthClick={handleAuthClick} />}
        />
        <Route
          path="/events"
          element={<EventsPageWrapper onAuthClick={handleAuthClick} />}
        />
        <Route
          path="/artists"
          element={<ArtistsPageWrapper onAuthClick={handleAuthClick} />}
        />
        <Route
          path="/releases"
          element={<ReleasesPageWrapper onAuthClick={handleAuthClick} />}
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={<AdminDashboardWrapper onAuthClick={handleAuthClick} />}
        />

        {/* Legacy Dashboard Route (redirect to profile) */}
        <Route
          path="/dashboard"
          element={<DashboardPage onAuthClick={handleAuthClick} />}
        />

        {/* Spotify OAuth Callback - redirects to home after token is captured */}
        <Route path="/callback" element={<Navigate to="/" replace />} />

        {/* Public Profile Route - MUST be last to avoid catching other routes */}
        <Route
          path="/:profileSlug"
          element={<PublicProfilePageWrapper onAuthClick={handleAuthClick} />}
        />
      </Routes>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="dark"
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
