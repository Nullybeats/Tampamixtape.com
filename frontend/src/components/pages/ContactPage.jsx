import { useState } from 'react'
import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Mail, Music, AlertCircle, Send } from 'lucide-react'
import { toast } from 'sonner'

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // For now, just show a success message
    // In the future, this would send to a backend endpoint
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you soon.')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setIsSubmitting(false)
    }, 1000)
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <>
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Contact <span className="text-primary">Tampa Mixtape</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12">
              Tampa Mixtape is built to reflect what's happening in Tampa Bay music accurately and in real time. If you need to get in touch, we're easy to reach.
            </p>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Mail className="w-6 h-6 text-primary" />
                  Get In Touch
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What's this about?"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Your message..."
                      rows={5}
                      required
                      className="mt-2"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Info Sections */}
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-primary" />
                    Artist Information & Corrections
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Accuracy matters to us.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    If you're an artist (or represent an artist) and notice incorrect information—including artist name, credits, affiliations, release data, or chart placement—please reach out and let us know.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    We're working with a large and constantly evolving data set, and while we aim to be as accurate as possible, mistakes can happen. We appreciate the community helping us keep Tampa Mixtape correct and up to date.
                  </p>
                  <p className="text-muted-foreground mb-2">When reaching out, please include:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      Artist name
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      The information that appears to be incorrect
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      The correct information (and links, if available)
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <Music className="w-6 h-6 text-primary" />
                    Artist Submissions
                  </h2>
                  <p className="text-muted-foreground mb-4 font-medium">
                    Tampa Mixtape is not pay-to-play.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    If you're a Tampa Bay artist with new music and want to make sure you're on our radar, feel free to reach out with:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      Artist name
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      Tampa Bay connection
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      Streaming links (Spotify in particular)
                    </li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    Inclusion is based on relevance, activity, and data—not payment.
                  </p>
                </section>

                <div className="p-6 bg-card rounded-xl border border-border">
                  <p className="text-muted-foreground">
                    Tampa Mixtape exists to support the scene, document momentum, and elevate Tampa Bay artists. If something looks off, or if you have ideas on how to make the platform better, we want to hear from you.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
