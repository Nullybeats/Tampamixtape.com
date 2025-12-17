import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  Calendar,
} from 'lucide-react'

export function Navbar({ onAuthClick, onDashboardClick, onLogoClick }) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, isAuthenticated, isVerified, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Charts', href: '#charts' },
    { name: 'Tampa Hot 100', href: '#hot100' },
    { name: 'Events', href: '/events', isRoute: true },
    { name: 'API', href: '#api' },
  ]

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick()
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
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </a>
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
                  onClick={signOut}
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
                <a
                  key={link.name}
                  href={link.href}
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
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
                    onClick={() => { signOut(); setIsOpen(false); }}
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
