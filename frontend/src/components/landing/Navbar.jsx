import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import {
  BarChart3,
  Menu,
  X,
  Zap,
  ChevronRight,
  User,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  Bell,
  Clock,
  XCircle,
} from 'lucide-react'

export function Navbar({ onAuthClick, onDashboardClick, onLogoClick }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const { user, isAuthenticated, isVerified, isAdmin, isApproved, isPending, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Get status info for notification badge
  const getStatusInfo = () => {
    if (isAdmin) {
      return { icon: CheckCircle2, label: 'Admin', color: 'text-primary', bgColor: 'bg-primary/20' }
    }
    if (isApproved) {
      return { icon: CheckCircle2, label: 'Approved', color: 'text-green-400', bgColor: 'bg-green-500/20' }
    }
    if (isPending) {
      return { icon: Clock, label: 'Pending Review', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' }
    }
    return { icon: XCircle, label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-500/20' }
  }

  const statusInfo = getStatusInfo()

  const handleSignOut = () => {
    signOut()
    toast.success('Signed out', {
      description: 'You have been successfully signed out.',
    })
    navigate('/')
  }

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Charts', href: '#charts' },
    { name: 'Tampa Hot 100', href: '#hot100' },
    { name: 'Artists', href: '/artists', isRoute: true },
    { name: 'Releases', href: '/releases', isRoute: true },
    { name: 'Events', href: '/events', isRoute: true },
  ]

  // Handle anchor link navigation from any page
  const handleAnchorClick = (e, href) => {
    e.preventDefault()
    const hash = href.replace('#', '')

    if (location.pathname === '/') {
      // Already on landing page, just scroll to element
      const element = document.getElementById(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      // Navigate to landing page with hash
      navigate('/' + href)
    }
    setIsOpen(false)
  }

  // Handle scroll to anchor after navigation
  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      const hash = location.hash.replace('#', '')
      // Small delay to ensure page is rendered
      setTimeout(() => {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [location])

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick()
    } else if (location.pathname !== '/') {
      navigate('/')
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold">
              Tampa<span className="text-primary">Mixtape</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.isRoute ? (
                <button
                  key={link.name}
                  onClick={() => navigate(link.href)}
                  className={`text-sm transition-colors ${
                    location.pathname === link.href
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.name}
                </button>
              ) : (
                <button
                  key={link.name}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </button>
              )
            ))}
          </div>

          {/* Desktop CTA / User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="gap-2 text-primary"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Button>
                )}
                {!isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDashboardClick}
                    className="gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                )}

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${
                      isApproved || isAdmin ? 'bg-green-500' : isPending ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </button>

                  <AnimatePresence>
                    {notificationOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-xl z-50"
                      >
                        <div className="p-4 border-b border-border">
                          <h3 className="text-sm font-semibold">Account Status</h3>
                        </div>
                        <div className="p-4">
                          <div className={`flex items-center gap-3 p-3 rounded-lg ${statusInfo.bgColor}`}>
                            <statusInfo.icon className={`w-5 h-5 ${statusInfo.color}`} />
                            <div>
                              <p className={`text-sm font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {isAdmin && 'Full admin access enabled'}
                                {isApproved && !isAdmin && 'Your account is active and verified'}
                                {isPending && 'Your application is being reviewed'}
                                {!isApproved && !isPending && !isAdmin && 'Please contact support'}
                              </p>
                            </div>
                          </div>
                          {isPending && (
                            <p className="text-xs text-muted-foreground mt-3">
                              We typically review applications within 24-48 hours.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{user?.artistName}</span>
                  {isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAuthClick('signin')}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => onAuthClick('signup')}
                >
                  <Zap className="w-4 h-4" />
                  Get Started
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-border"
        >
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              link.isRoute ? (
                <button
                  key={link.name}
                  onClick={() => { navigate(link.href); setIsOpen(false); }}
                  className={`block py-2 w-full text-left transition-colors ${
                    location.pathname === link.href
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.name}
                </button>
              ) : (
                <button
                  key={link.name}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="block py-2 w-full text-left text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </button>
              )
            ))}
            <div className="pt-3 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium flex items-center gap-1">
                        {user?.artistName}
                        {isVerified && (
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        )}
                        {isAdmin && (
                          <span className="text-xs text-primary">(Admin)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{user?.email}</div>
                    </div>
                  </div>
                  {isAdmin ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => { navigate('/admin'); setIsOpen(false); }}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Dashboard
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => { onDashboardClick(); setIsOpen(false); }}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-red-400"
                    onClick={() => { handleSignOut(); setIsOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { onAuthClick('signin'); setIsOpen(false); }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="w-full gap-1"
                    onClick={() => { onAuthClick('signup'); setIsOpen(false); }}
                  >
                    <Zap className="w-4 h-4" />
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
