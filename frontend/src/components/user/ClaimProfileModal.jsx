import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  UserCheck,
  Mail,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

// TikTok icon component
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

export function ClaimProfileModal({ open, onOpenChange, profile }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    instagramUrl: '',
    twitterUrl: '',
    tiktokUrl: '',
    youtubeUrl: '',
    websiteUrl: '',
    proofText: '',
    message: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // At least one social link required
    const hasSocialLink = formData.instagramUrl || formData.twitterUrl ||
                          formData.tiktokUrl || formData.youtubeUrl || formData.websiteUrl
    if (!hasSocialLink) {
      newErrors.social = 'At least one social media link is required'
    }

    // Proof text required
    if (!formData.proofText.trim()) {
      newErrors.proofText = 'Proof of identity is required'
    } else if (formData.proofText.trim().length < 20) {
      newErrors.proofText = 'Please provide more detail (at least 20 characters)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/api/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          claimantEmail: formData.email.trim(),
          instagramUrl: formData.instagramUrl.trim() || null,
          twitterUrl: formData.twitterUrl.trim() || null,
          tiktokUrl: formData.tiktokUrl.trim() || null,
          youtubeUrl: formData.youtubeUrl.trim() || null,
          websiteUrl: formData.websiteUrl.trim() || null,
          proofText: formData.proofText.trim(),
          message: formData.message.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit claim')
      }

      setSubmitted(true)
      toast.success('Claim submitted!', {
        description: 'You will be notified once your claim is reviewed.',
      })
    } catch (error) {
      toast.error('Failed to submit claim', {
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form after animation completes
    setTimeout(() => {
      setFormData({
        email: '',
        instagramUrl: '',
        twitterUrl: '',
        tiktokUrl: '',
        youtubeUrl: '',
        websiteUrl: '',
        proofText: '',
        message: '',
      })
      setErrors({})
      setSubmitted(false)
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          // Success state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Claim Submitted!</h3>
            <p className="text-muted-foreground mb-6">
              Your claim for <strong>{profile?.artistName}</strong> has been submitted.
              We will review your request and notify you at <strong>{formData.email}</strong>.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </motion.div>
        ) : (
          // Form state
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Claim This Profile
              </DialogTitle>
              <DialogDescription>
                Are you <strong>{profile?.artistName}</strong>? Submit your claim below and our team will verify your identity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="claimEmail" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Your Email <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="claimEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Social Links Section */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Social Media Links <span className="text-red-400">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(at least one required)</span>
                </Label>

                {errors.social && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.social}
                  </p>
                )}

                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                    <Input
                      placeholder="Instagram URL or @username"
                      value={formData.instagramUrl}
                      onChange={(e) => handleChange('instagramUrl', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-blue-400 shrink-0" />
                    <Input
                      placeholder="X/Twitter URL or @username"
                      value={formData.twitterUrl}
                      onChange={(e) => handleChange('twitterUrl', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <TikTokIcon />
                    <Input
                      placeholder="TikTok URL or @username"
                      value={formData.tiktokUrl}
                      onChange={(e) => handleChange('tiktokUrl', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                    <Input
                      placeholder="YouTube channel URL"
                      value={formData.youtubeUrl}
                      onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input
                      placeholder="Website URL"
                      value={formData.websiteUrl}
                      onChange={(e) => handleChange('websiteUrl', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Proof of Identity */}
              <div className="space-y-2">
                <Label htmlFor="proofText">
                  Proof of Identity <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="proofText"
                  placeholder="Explain how you can verify you are this artist. Include links to posts, messages, or any other proof..."
                  value={formData.proofText}
                  onChange={(e) => handleChange('proofText', e.target.value)}
                  rows={4}
                  className={errors.proofText ? 'border-red-500' : ''}
                />
                {errors.proofText && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.proofText}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Example: "I can post a story mentioning Tampa Mixtape" or "Here is a DM from my verified account"
                </p>
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Additional Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Any additional information you want to share..."
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                Submit Claim
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
