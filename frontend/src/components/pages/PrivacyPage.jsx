import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'
import { Shield } from 'lucide-react'

export function PrivacyPage() {
  return (
    <>
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-10 h-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
            </div>

            <p className="text-muted-foreground mb-8">Last Updated: December 2024</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <p className="text-muted-foreground">
                This Privacy Policy is part of, and incorporated into, the Terms of Service ("Terms") governing your use of TampaMixtape.com (the "Site"). Capitalized terms not defined here have the meanings given in the Terms.
              </p>
              <p className="text-muted-foreground">
                By accessing or using the Site, you agree to this Privacy Policy and the Terms of Service.
              </p>

              <section>
                <h2 className="text-2xl font-bold mb-4">1. Overview</h2>
                <p className="text-muted-foreground">
                  Tampa Mixtape ("Tampa Mixtape," "we," "us," or "our") respects your privacy and is committed to being transparent about how information is collected, used, and shared in connection with the Site.
                </p>
                <p className="text-muted-foreground mt-4">This Privacy Policy describes:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    What information we collect
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    How we use that information
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Your rights and choices
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

                <h3 className="text-xl font-semibold mb-3 mt-6">A. Information You Voluntarily Provide</h3>
                <p className="text-muted-foreground">We may collect information you choose to provide, including when you:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Contact us through a form or email
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Submit artist information or correction requests
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Reach out regarding partnerships, press, or general inquiries
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">This information may include:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Name
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Email address
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Artist name or affiliation
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Any additional information you include in your message
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">Providing this information is voluntary.</p>

                <h3 className="text-xl font-semibold mb-3 mt-6">B. Automatically Collected Information</h3>
                <p className="text-muted-foreground">When you access the Site, we may automatically collect certain information, such as:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    IP address
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Browser type and device information
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Pages visited and interactions with the Site
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Referring or exit pages
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">This information is collected through cookies, analytics tools, or similar technologies.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. How We Use Information</h2>
                <p className="text-muted-foreground">We use collected information to:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Operate, maintain, and improve the Site
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Respond to inquiries and communications
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Review and correct artist or content information when notified
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Monitor Site performance and usage trends
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Enforce our Terms of Service
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4 font-medium">We do not sell personal information.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. Artist Information & Public Data</h2>
                <p className="text-muted-foreground">Tampa Mixtape aggregates, analyzes, and displays publicly available music-related data, which may include:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Artist names and identifiers
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Release information
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Streaming and performance indicators
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Chart placements
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">This information is used for editorial, informational, and analytical purposes as described in the Terms of Service.</p>
                <p className="text-muted-foreground mt-4">If you believe any artist-related information displayed on the Site is inaccurate or incomplete, please contact us so we can review and, where appropriate, correct it.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Cookies & Tracking Technologies</h2>
                <p className="text-muted-foreground">We may use cookies or similar technologies to:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Enable Site functionality
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Analyze traffic and usage patterns
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Improve user experience
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">You may disable cookies through your browser settings; however, doing so may affect certain Site features.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Third-Party Services & Links</h2>
                <p className="text-muted-foreground">The Site may include links to, or integrations with, third-party platforms (including streaming services, analytics providers, or embedded media).</p>
                <p className="text-muted-foreground mt-4">We are not responsible for the privacy practices or content of third-party websites or services. Your interactions with those services are governed by their own terms and privacy policies.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. Data Security</h2>
                <p className="text-muted-foreground">We take reasonable administrative and technical measures to protect information collected through the Site. However, no method of data transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
                <p className="text-muted-foreground">The Site is not intended for use by children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided personal information to us, please contact us and we will take appropriate action.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. Your Rights & Choices</h2>
                <p className="text-muted-foreground">Depending on your location, you may have certain rights regarding personal information you have provided, including the right to:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Request access to your information
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Request correction or deletion of your information
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">Requests may be submitted using the contact information below. We may need to verify your request before responding.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground">We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. Continued use of the Site after changes are posted constitutes acceptance of the updated policy, as provided in the Terms of Service.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">11. Contact Information</h2>
                <p className="text-muted-foreground">For questions about this Privacy Policy, the Terms of Service, or to request corrections to artist information, please contact:</p>
                <p className="text-primary mt-4 font-medium">admin@tampamixtape.com</p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
