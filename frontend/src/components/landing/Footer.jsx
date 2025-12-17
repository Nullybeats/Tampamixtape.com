import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  BarChart3,
  Zap,
  ArrowRight,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  Megaphone
} from 'lucide-react'

export function Footer() {
  const footerLinks = {
    Product: [
      { name: 'Features', href: '#features' },
      { name: 'Charts', href: '#charts' },
      { name: 'Hot 100', href: '#hot100' },
      { name: 'API', href: '#api' },
      { name: 'Pricing', href: '#pricing' },
    ],
    Company: [
      { name: 'About', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' },
    ],
    Resources: [
      { name: 'Documentation', href: '#' },
      { name: 'API Reference', href: '#' },
      { name: 'Status', href: '#' },
      { name: 'Changelog', href: '#' },
    ],
    Legal: [
      { name: 'Privacy', href: '#' },
      { name: 'Terms', href: '#' },
      { name: 'Cookies', href: '#' },
    ],
  }

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'YouTube', icon: Youtube, href: '#' },
  ]

  return (
    <footer className="border-t border-border bg-card/50">
      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card border-primary/20 glow-green">
              <CardContent className="p-8 lg:p-12">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <Badge variant="outline" className="mb-4">
                      <Zap className="w-4 h-4 mr-1" />
                      Get Started Today
                    </Badge>
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                      Ready to track Tampa's
                      <br />
                      <span className="text-gradient">music scene?</span>
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Join thousands of artists, labels, and fans using TampaMixtape to discover and track the hottest music from Tampa Bay.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button size="xl" className="gap-2">
                        <Zap className="w-5 h-5" />
                        Start Free Trial
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="xl">
                        Contact Sales
                      </Button>
                    </div>
                  </div>
                  <div className="hidden lg:flex justify-end">
                    <div className="relative">
                      <div className="w-64 h-64 rounded-full bg-primary/10 flex items-center justify-center animate-float">
                        <div className="w-48 h-48 rounded-full bg-primary/20 flex items-center justify-center">
                          <div className="w-32 h-32 rounded-full bg-primary/30 flex items-center justify-center">
                            <BarChart3 className="w-16 h-16 text-primary" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Ad Space Placeholder */}
      <section className="py-8 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-dashed border-2 border-muted-foreground/20 bg-transparent">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-2 text-muted-foreground">
                <Megaphone className="w-5 h-5" />
                <span className="text-sm font-medium">Advertisement Space</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Reach Tampa Bay's music community. Premium ad placements available.
              </p>
              <Button variant="outline" size="sm">
                <Mail className="w-4 h-4 mr-2" />
                Advertise With Us
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Footer */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xl font-bold">
                  Tampa<span className="text-primary">Mixtape</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The definitive source for Tampa Bay music analytics. Track streams, discover new artists, and stay ahead of the charts.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                Tampa Bay, Florida
              </div>
              <div className="flex gap-3">
                {socialLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="font-semibold mb-4">{title}</h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <Separator />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; 2025 TampaMixtape. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                All Systems Operational
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
