import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'
import { Target, Eye, Users, Rocket } from 'lucide-react'

export function AboutPage() {
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
              About <span className="text-primary">Tampa Mixtape</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8">
              Tampa Mixtape is a real-time snapshot of Tampa Bay's music scene.
            </p>

            <div className="prose prose-invert max-w-none space-y-8">
              <p className="text-muted-foreground">
                What started as a simple playlist in 2022 has grown into a living radar for what's happening in Tampa music (who's breaking, what's buzzing, and what records people are actually listening to right now).
              </p>

              <p className="text-muted-foreground">
                This isn't about hype for hype's sake. It's about visibility, momentum, and documenting a scene that's often overlooked despite the talent coming out of it.
              </p>

              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  What We Do
                </h2>
                <p className="text-muted-foreground mb-4">Tampa Mixtape exists to:</p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Spotlight Tampa Bay artists across genres
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Track new releases and real streaming traction
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Surface what's actually moving, not just what's promoted
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Create a centralized place to discover Tampa music
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  The platform has evolved beyond playlists into a Tampa Viral Chart, combining new releases with performance data to show which artists and records are gaining real momentum.
                </p>
                <p className="text-muted-foreground mt-4">
                  Think of it as Tampa Bay's music radar that's constantly scanning, updating, and reflecting what's happening on the ground.
                </p>
              </section>

              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Eye className="w-6 h-6 text-primary" />
                  Why It Matters
                </h2>
                <p className="text-muted-foreground mb-4">
                  Tampa has always had talent. What it's lacked is infrastructure, visibility, and consistent documentation.
                </p>
                <p className="text-muted-foreground mb-4">
                  Artists grind in silos. Great records drop quietly. Momentum gets missed.
                </p>
                <p className="text-muted-foreground mb-4">Tampa Mixtape helps close that gap by:</p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Giving artists a platform that updates continuously
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Giving fans a way to stay tapped in without digging
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Giving industry professionals a pulse on the local market
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4 font-medium">
                  No pay-to-play. No gatekeeping. Just data, curation, and culture.
                </p>
              </section>

              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  Who It's For
                </h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Artists looking for exposure and momentum
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Fans who want to stay locked into Tampa music
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Managers, labels, A&Rs, and media tracking what's emerging
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Anyone who believes Tampa deserves to be taken seriously
                  </li>
                </ul>
              </section>

              <section className="mt-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Rocket className="w-6 h-6 text-primary" />
                  The Bigger Picture
                </h2>
                <p className="text-muted-foreground mb-4">
                  Tampa Mixtape is part archive, part discovery engine, part proof-of-work for a city that keeps producing talent.
                </p>
                <p className="text-muted-foreground mb-4">
                  The goal isn't just to spotlight artists, but it's to help build a stronger, more connected Tampa music ecosystem.
                </p>
                <p className="text-xl font-bold text-primary mt-8">
                  This is only the beginning.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
