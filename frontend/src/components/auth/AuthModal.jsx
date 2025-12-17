import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import {
  Mail,
  Lock,
  User,
  MapPin,
  Music,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Clock,
} from 'lucide-react'

// Florida cities - Tampa is active, others coming soon
const FLORIDA_CITIES = [
  { name: 'Tampa', active: true, region: 'Tampa Bay' },
  { name: 'St. Petersburg', active: false, region: 'Tampa Bay' },
  { name: 'Clearwater', active: false, region: 'Tampa Bay' },
  { name: 'Brandon', active: false, region: 'Tampa Bay' },
  { name: 'Miami', active: false, region: 'South Florida' },
  { name: 'Fort Lauderdale', active: false, region: 'South Florida' },
  { name: 'Orlando', active: false, region: 'Central Florida' },
  { name: 'Jacksonville', active: false, region: 'North Florida' },
  { name: 'Tallahassee', active: false, region: 'North Florida' },
  { name: 'Gainesville', active: false, region: 'North Florida' },
]

const signUpSchema = z.object({
  artistName: z.string().min(2, 'Artist name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  city: z.string().min(1, 'Please select your city'),
})

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export function AuthModal({ isOpen, onClose, defaultTab = 'signup' }) {
  const [tab, setTab] = useState(defaultTab)
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp, signIn, loginWithSpotify, spotifyUser } = useAuth()

  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      artistName: '',
      email: '',
      password: '',
      city: '',
    }
  })

  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  })

  const selectedCity = signUpForm.watch('city')
  const selectedCityData = FLORIDA_CITIES.find(c => c.name === selectedCity)
  const isTampaResident = selectedCity === 'Tampa'

  const handleSignUp = async (data) => {
    if (!isTampaResident) {
      setError('Only Tampa residents can sign up at this time. Other cities coming soon!')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      await signUp({
        ...data,
        state: 'Florida',
        region: selectedCityData?.region || 'Tampa Bay',
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (data) => {
    setIsLoading(true)
    setError('')
    try {
      await signIn(data.email, data.password)
      onClose()
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSpotifyConnect = () => {
    loginWithSpotify()
  }

  const resetForms = () => {
    signUpForm.reset()
    signInForm.reset()
    setStep(1)
    setError('')
  }

  const switchTab = (newTab) => {
    setTab(newTab)
    resetForms()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetForms(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            {tab === 'signup' ? 'Join TampaMixtape' : 'Welcome Back'}
          </DialogTitle>
          <DialogDescription>
            {tab === 'signup'
              ? 'Create your artist account to track your stats'
              : 'Sign in to access your dashboard'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === 'signup' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => switchTab('signup')}
            className="flex-1"
          >
            Sign Up
          </Button>
          <Button
            variant={tab === 'signin' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => switchTab('signin')}
            className="flex-1"
          >
            Sign In
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* Spotify Connect */}
                    <div className="p-4 bg-[#1db954]/10 border border-[#1db954]/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Connect Spotify</span>
                        {spotifyUser ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Optional</Badge>
                        )}
                      </div>
                      {spotifyUser ? (
                        <div className="flex items-center gap-3">
                          {spotifyUser.images?.[0] && (
                            <img
                              src={spotifyUser.images[0].url}
                              alt={spotifyUser.display_name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium">{spotifyUser.display_name}</p>
                            <p className="text-xs text-muted-foreground">{spotifyUser.email}</p>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSpotifyConnect}
                          className="w-full gap-2 border-[#1db954]/30 hover:bg-[#1db954]/10"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                          Connect Spotify
                        </Button>
                      )}
                    </div>

                    {/* Artist Name */}
                    <div className="space-y-2">
                      <Label htmlFor="artistName">Artist / Stage Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="artistName"
                          placeholder="Your artist name"
                          className="pl-10"
                          {...signUpForm.register('artistName')}
                        />
                      </div>
                      {signUpForm.formState.errors.artistName && (
                        <p className="text-xs text-red-400">{signUpForm.formState.errors.artistName.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          {...signUpForm.register('email')}
                        />
                      </div>
                      {signUpForm.formState.errors.email && (
                        <p className="text-xs text-red-400">{signUpForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="At least 8 characters"
                          className="pl-10"
                          {...signUpForm.register('password')}
                        />
                      </div>
                      {signUpForm.formState.errors.password && (
                        <p className="text-xs text-red-400">{signUpForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      className="w-full gap-2"
                      onClick={() => setStep(2)}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(1)}
                      className="gap-1 -ml-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>

                    {/* City Selection */}
                    <div className="space-y-2">
                      <Label>City (Florida)</Label>
                      <Select
                        value={selectedCity}
                        onValueChange={(value) => {
                          const city = FLORIDA_CITIES.find(c => c.name === value)
                          if (city?.active) {
                            signUpForm.setValue('city', value)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select your city" />
                        </SelectTrigger>
                        <SelectContent>
                          {FLORIDA_CITIES.map((city) => (
                            <SelectItem
                              key={city.name}
                              value={city.name}
                              disabled={!city.active}
                              className={!city.active ? 'opacity-50' : ''}
                            >
                              <span className="flex items-center gap-2 w-full">
                                {city.name}
                                {city.active ? (
                                  <Badge variant="success" className="text-xs ml-auto">Active</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs ml-auto gap-1">
                                    <Clock className="w-3 h-3" />
                                    Coming Soon
                                  </Badge>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {signUpForm.formState.errors.city && (
                        <p className="text-xs text-red-400">{signUpForm.formState.errors.city.message}</p>
                      )}
                    </div>

                    {/* Tampa Verification Notice */}
                    {selectedCity && (
                      <div className={`p-4 rounded-lg border ${
                        isTampaResident
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-yellow-500/10 border-yellow-500/20'
                      }`}>
                        {isTampaResident ? (
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-400">Tampa Resident Verified</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Welcome to Tampa Bay's music scene! You'll have full access to analytics, social link management, and all artist features.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-400">Coming Soon to {selectedCity}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                We're expanding to {selectedCityData?.region || 'your area'} soon! Join our waitlist to be notified when we launch in your city.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Region Display */}
                    {isTampaResident && (
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-sm">
                            Region: <span className="font-medium text-primary">Tampa Bay</span>
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={isLoading || !isTampaResident}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating account...
                        </>
                      ) : !isTampaResident ? (
                        <>
                          <Clock className="w-4 h-4" />
                          Join Waitlist
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </form>
            </motion.div>
          )}

          {tab === 'signin' && (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      {...signInForm.register('email')}
                    />
                  </div>
                  {signInForm.formState.errors.email && (
                    <p className="text-xs text-red-400">{signInForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Your password"
                      className="pl-10"
                      {...signInForm.register('password')}
                    />
                  </div>
                  {signInForm.formState.errors.password && (
                    <p className="text-xs text-red-400">{signInForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleSpotifyConnect}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Continue with Spotify
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
