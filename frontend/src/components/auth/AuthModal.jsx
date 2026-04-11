import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
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
  Headphones,
  Mic2,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  FileText,
} from 'lucide-react'

// Florida cities - Tampa is active, others coming soon
const FLORIDA_CITIES = [
  { name: 'Tampa', active: true, region: 'Tampa Bay' },
  { name: 'St. Petersburg', active: true, region: 'Tampa Bay' },
  { name: 'Clearwater', active: true, region: 'Tampa Bay' },
  { name: 'Brandon', active: false, region: 'Tampa Bay' },
  { name: 'Miami', active: false, region: 'South Florida' },
  { name: 'Fort Lauderdale', active: false, region: 'South Florida' },
  { name: 'Orlando', active: false, region: 'Central Florida' },
  { name: 'Jacksonville', active: false, region: 'North Florida' },
  { name: 'Tallahassee', active: false, region: 'North Florida' },
  { name: 'Gainesville', active: false, region: 'North Florida' },
]

const fanSignUpSchema = z.object({
  accountType: z.literal('fan'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  city: z.string().min(1, 'Please select your city'),
})

const optionalUrl = z
  .string()
  .trim()
  .url('Must be a full URL starting with https://')
  .or(z.literal(''))
  .optional()

const artistSignUpSchema = z.object({
  accountType: z.literal('artist'),
  artistName: z.string().min(2, 'Artist name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  city: z.string().min(1, 'Please select your city'),
  bio: z.string().max(1000, 'Bio must be 1000 characters or fewer').optional(),
  instagramUrl: optionalUrl,
  twitterUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  websiteUrl: optionalUrl,
})

const signUpSchema = z.discriminatedUnion('accountType', [fanSignUpSchema, artistSignUpSchema])

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export function AuthModal({ isOpen, onClose, defaultTab = 'signup' }) {
  const [tab, setTab] = useState(defaultTab)
  const [step, setStep] = useState(0) // 0 = role chooser, 1 = details, 2 = city
  const [accountType, setAccountType] = useState(null) // 'fan' or 'artist'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp, signIn } = useAuth()

  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      accountType: 'fan',
      name: '',
      artistName: '',
      email: '',
      password: '',
      city: '',
      bio: '',
      instagramUrl: '',
      twitterUrl: '',
      tiktokUrl: '',
      youtubeUrl: '',
      websiteUrl: '',
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
  const isCityActive = !!selectedCityData?.active

  const handleSignUp = async (data) => {
    if (!isCityActive) {
      setError('Sign ups are not yet available in your city. Coming soon!')
      return
    }

    setIsLoading(true)
    setError('')
    try {
      // Strip empty strings so AuthContext doesn't forward blank optional fields
      const cleaned = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )

      const signUpData = {
        ...cleaned,
        accountType,
        state: 'Florida',
        region: selectedCityData?.region || 'Tampa Bay',
      }

      await signUp(signUpData)

      if (accountType === 'fan') {
        toast.success('Welcome to TampaMixtape!', {
          description: 'Your account is ready. Start discovering Tampa artists!',
        })
      } else {
        toast.success('Application submitted!', {
          description: 'Your application is pending review. We\'ll notify you once approved.',
        })
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create account')
      toast.error('Sign up failed', {
        description: err.message || 'Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (data) => {
    setIsLoading(true)
    setError('')
    try {
      await signIn(data.email, data.password)
      toast.success('Welcome back!', {
        description: 'You have successfully signed in.',
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Invalid credentials')
      toast.error('Sign in failed', {
        description: err.message || 'Please check your credentials.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForms = () => {
    signUpForm.reset()
    signInForm.reset()
    setStep(0)
    setAccountType(null)
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
              ? (step === 0 ? 'How do you want to use TampaMixtape?' : accountType === 'fan' ? 'Create your fan account' : 'Create your artist account to track your stats')
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
                {/* Step 0: Role Chooser */}
                {step === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountType('fan')
                          signUpForm.setValue('accountType', 'fan')
                          setStep(1)
                        }}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        <Headphones className="w-10 h-10 text-primary" />
                        <div className="text-center">
                          <p className="font-semibold">I'm a Fan</p>
                          <p className="text-xs text-muted-foreground mt-1">Discover & support Tampa artists</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountType('artist')
                          signUpForm.setValue('accountType', 'artist')
                          setStep(1)
                        }}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        <Mic2 className="w-10 h-10 text-primary" />
                        <div className="text-center">
                          <p className="font-semibold">I'm an Artist</p>
                          <p className="text-xs text-muted-foreground mt-1">Track your stats & grow your reach</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 1: Account Details */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setStep(0); setAccountType(null) }}
                      className="gap-1 -ml-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>

                    {/* Name (fans) or Artist Name (artists) */}
                    {accountType === 'fan' ? (
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="name"
                            placeholder="Your name"
                            className="pl-10"
                            {...signUpForm.register('name')}
                          />
                        </div>
                        {signUpForm.formState.errors.name && (
                          <p className="text-xs text-red-400">{signUpForm.formState.errors.name.message}</p>
                        )}
                      </div>
                    ) : (
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
                    )}

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

                    {/* City Verification Notice */}
                    {selectedCity && (
                      <div className={`p-4 rounded-lg border ${
                        isCityActive
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-yellow-500/10 border-yellow-500/20'
                      }`}>
                        {isCityActive ? (
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-400">{selectedCity} Resident Verified</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {accountType === 'fan'
                                  ? "Welcome to Tampa Bay's music scene! Discover, follow, and support local artists."
                                  : "Welcome to Tampa Bay's music scene! You'll have full access to analytics, social link management, and all artist features."}
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
                    {isCityActive && (
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-sm">
                            Region: <span className="font-medium text-primary">Tampa Bay</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {accountType === 'artist' ? (
                      <Button
                        type="button"
                        className="w-full gap-2"
                        disabled={!isCityActive}
                        onClick={() => isCityActive && setStep(3)}
                      >
                        {!isCityActive ? (
                          <>
                            <Clock className="w-4 h-4" />
                            Join Waitlist
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="w-full gap-2"
                        disabled={isLoading || !isCityActive}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating account...
                          </>
                        ) : !isCityActive ? (
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
                    )}
                  </motion.div>
                )}

                {/* Step 3: Artist application details (bio + social links) */}
                {step === 3 && accountType === 'artist' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep(2)}
                      className="gap-1 -ml-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>

                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                      Help our team review your application faster. All fields below are optional but strongly recommended.
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        About you
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about your music, where you play, what makes you Tampa Bay..."
                        rows={4}
                        maxLength={1000}
                        {...signUpForm.register('bio')}
                      />
                      {signUpForm.formState.errors.bio && (
                        <p className="text-xs text-red-400">{signUpForm.formState.errors.bio.message}</p>
                      )}
                    </div>

                    {/* Social links */}
                    <div className="space-y-2">
                      <Label className="text-sm">Where can we hear/see you?</Label>

                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
                        <Input
                          placeholder="https://instagram.com/yourhandle"
                          className="pl-10"
                          {...signUpForm.register('instagramUrl')}
                        />
                      </div>
                      {signUpForm.formState.errors.instagramUrl && (
                        <p className="text-xs text-red-400">{signUpForm.formState.errors.instagramUrl.message}</p>
                      )}

                      <div className="relative">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        <Input
                          placeholder="https://tiktok.com/@yourhandle"
                          className="pl-10"
                          {...signUpForm.register('tiktokUrl')}
                        />
                      </div>
                      {signUpForm.formState.errors.tiktokUrl && (
                        <p className="text-xs text-red-400">{signUpForm.formState.errors.tiktokUrl.message}</p>
                      )}

                      <div className="relative">
                        <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                        <Input
                          placeholder="https://youtube.com/@yourchannel"
                          className="pl-10"
                          {...signUpForm.register('youtubeUrl')}
                        />
                      </div>
                      {signUpForm.formState.errors.youtubeUrl && (
                        <p className="text-xs text-red-400">{signUpForm.formState.errors.youtubeUrl.message}</p>
                      )}

                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                        <Input
                          placeholder="https://twitter.com/yourhandle"
                          className="pl-10"
                          {...signUpForm.register('twitterUrl')}
                        />
                      </div>
                      {signUpForm.formState.errors.twitterUrl && (
                        <p className="text-xs text-red-400">{signUpForm.formState.errors.twitterUrl.message}</p>
                      )}

                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="https://yourwebsite.com"
                          className="pl-10"
                          {...signUpForm.register('websiteUrl')}
                        />
                      </div>
                      {signUpForm.formState.errors.websiteUrl && (
                        <p className="text-xs text-red-400">{signUpForm.formState.errors.websiteUrl.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting application...
                        </>
                      ) : (
                        <>
                          Submit Application
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

              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
