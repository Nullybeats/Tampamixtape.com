import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import {
  Clock,
  Mail,
  Music,
  MapPin,
  Sparkles,
} from 'lucide-react'

export function PendingApproval() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background pt-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Application Under Review</h1>
          <p className="text-muted-foreground">
            Thanks for applying to TampaMixtape! We're reviewing your application.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                Your Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Artist Name</span>
                <span className="font-medium">{user?.artistName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {user?.city}, Florida
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Pending Review
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Applied</span>
                <span className="font-medium">
                  {new Date(user?.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                What Happens Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Application Review</h4>
                    <p className="text-sm text-muted-foreground">
                      Our team will verify your Tampa Bay connection and artist status.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Email Notification</h4>
                    <p className="text-sm text-muted-foreground">
                      You'll receive an email at {user?.email} once approved.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Build Your Profile</h4>
                    <p className="text-sm text-muted-foreground">
                      Once approved, customize your artist page and connect your platforms.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2" asChild>
              <a href={`mailto:support@tampamixtape.com?subject=Application Status - ${user?.artistName}`}>
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </Button>
            <Button variant="ghost" onClick={signOut} className="text-red-400">
              Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
