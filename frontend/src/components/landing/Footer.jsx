import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Twitter,
  Instagram,
  Youtube,
  MapPin,
  Megaphone
} from 'lucide-react'

export function Footer() {
  const footerLinks = {
    Discover: [
      { name: 'Artists', href: '/artists' },
      { name: 'Releases', href: '/releases' },
      { name: 'Tampa Hot 100', href: '#hot100' },
    ],
    Company: [
      { name: 'About', href: '#' },
      { name: 'Contact', href: '#' },
    ],
    Legal: [
      { name: 'Privacy', href: '#' },
      { name: 'Terms', href: '#' },
    ],
  }

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'YouTube', icon: Youtube, href: '#' },
  ]

  return (
    <footer className="border-t border-border bg-card/50">
      {/* Advertisement - Randy Ojeda Law */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-3 text-muted-foreground">
                <Megaphone className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Advertisement</span>
              </div>
              <a
                href="https://randyojedalaw.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl hover:opacity-95 transition-opacity"
              >
                <img
                  src="/randy-ojeda-law.png"
                  alt="Randy Ojeda Law - Music Law. Simplified."
                  className="w-full h-auto max-h-[300px] object-cover object-center"
                />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Footer */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/favicon.png"
                  alt="Tampa Mixtape"
                  className="w-10 h-10 rounded-xl"
                />
                <span className="text-xl font-bold">
                  Tampa<span className="text-primary">Mixtape</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Tampa Bay's Music Radar. Discover the hottest artists, latest releases, and rankings powered by Spotify.
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
            <p>&copy; 2025 Tampa Mixtape. All rights reserved.</p>
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
