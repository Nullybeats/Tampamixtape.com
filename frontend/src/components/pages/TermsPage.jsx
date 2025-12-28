import { motion } from 'framer-motion'
import { Footer } from '@/components/landing/Footer'
import { FileText } from 'lucide-react'

export function TermsPage() {
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
              <FileText className="w-10 h-10 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
            </div>

            <p className="text-muted-foreground mb-8">Last Updated: December 2024</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <p className="text-muted-foreground">
                Welcome to TampaMixtape.com (the "Site"), operated by Randy Ojeda Law PLLC ("we," "us," or "our"). These Terms of Service ("Terms") govern your access to and use of the Site and any content, features, or services made available through it.
              </p>
              <p className="text-muted-foreground">
                By accessing or using the Site, you agree to be bound by these Terms and our Privacy Policy, which is incorporated by reference. If you do not agree, do not use the Site.
              </p>

              <section>
                <h2 className="text-2xl font-bold mb-4">1. Purpose of the Site</h2>
                <p className="text-muted-foreground">Tampa Mixtape is an informational and editorial platform focused on highlighting Tampa Bay artists and music culture. The Site may include playlists, charts, rankings, artist information, and related content derived from publicly available data and editorial curation.</p>
                <p className="text-muted-foreground mt-4">The Site is provided for informational and entertainment purposes only.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
                <p className="text-muted-foreground">You must be at least 13 years old to use the Site. By using the Site, you represent that you meet this requirement.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. Use of the Site</h2>
                <p className="text-muted-foreground">You agree to use the Site only for lawful purposes and in accordance with these Terms. You may not:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Use the Site in any way that violates applicable laws or regulations
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Attempt to interfere with or disrupt the Site or its functionality
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Scrape, copy, reproduce, or commercially exploit Site content without permission
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Misrepresent your identity or affiliation when contacting us
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">We reserve the right to restrict or terminate access to the Site for violations of these Terms.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. Charts, Rankings & Data Disclaimer</h2>
                <p className="text-muted-foreground">Tampa Mixtape charts, rankings, and featured content may be generated using a combination of:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Publicly available streaming and release data
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Editorial curation
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Automated or semi-automated processes
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">We do not guarantee accuracy, completeness, or real-time precision of any chart, ranking, metric, or artist information.</p>
                <p className="text-muted-foreground mt-4">Chart placement or inclusion:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Does not constitute endorsement
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Does not guarantee exposure, performance, or success
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Is subject to change at any time
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">If you believe information about an artist is inaccurate, you may contact us to request a review or correction.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Artist & Public Information</h2>
                <p className="text-muted-foreground">The Site may display artist names, release data, and other music-related information obtained from public or third-party sources.</p>
                <p className="text-muted-foreground mt-4">If you are an artist or authorized representative and believe information displayed is incorrect, misleading, or incomplete, you agree to contact us before asserting any claim, so we may review and address the issue where appropriate.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
                <p className="text-muted-foreground">All content on the Site—including text, graphics, logos, branding, charts, and original editorial content—is owned by or licensed to Tampa Mixtape and is protected by intellectual property laws.</p>
                <p className="text-muted-foreground mt-4">You may not reproduce, distribute, modify, or publicly display Site content without prior written permission, except for personal, non-commercial use.</p>
                <p className="text-muted-foreground mt-4">Artist names, trademarks, and logos remain the property of their respective owners.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. Third-Party Links & Services</h2>
                <p className="text-muted-foreground">The Site may contain links to third-party websites or services (including streaming platforms).</p>
                <p className="text-muted-foreground mt-4">We are not responsible for:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Third-party content
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Third-party availability
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Third-party privacy practices or terms
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">Your interactions with third-party services are governed solely by their terms.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. No Professional Advice</h2>
                <p className="text-muted-foreground">Nothing on the Site constitutes legal, business, financial, or professional advice. You should not rely on Site content as a substitute for professional guidance.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. Disclaimer of Warranties</h2>
                <p className="text-muted-foreground">The Site is provided "as is" and "as available."</p>
                <p className="text-muted-foreground mt-4">We make no warranties, express or implied, regarding:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Accuracy or reliability of content
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Availability or uptime of the Site
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Fitness for a particular purpose
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">Use of the Site is at your own risk.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
                <p className="text-muted-foreground">To the fullest extent permitted by law, Tampa Mixtape shall not be liable for any indirect, incidental, consequential, or special damages arising from or related to your use of the Site.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">11. Indemnification</h2>
                <p className="text-muted-foreground">You agree to indemnify and hold harmless Tampa Mixtape from any claims, damages, or expenses arising from:</p>
                <ul className="space-y-2 text-muted-foreground mt-2">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Your use of the Site
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Your violation of these Terms
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    Your violation of any third-party rights
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">12. Changes to the Site or Terms</h2>
                <p className="text-muted-foreground">We may modify or discontinue the Site (in whole or part) at any time without notice.</p>
                <p className="text-muted-foreground mt-4">We may update these Terms from time to time. Continued use of the Site after changes are posted constitutes acceptance of the updated Terms.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">13. Governing Law & Venue</h2>
                <p className="text-muted-foreground">These Terms are governed by the laws of the State of Florida, without regard to conflict-of-law principles.</p>
                <p className="text-muted-foreground mt-4">Any disputes arising under these Terms shall be resolved exclusively in the state or federal courts located in Florida.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
                <p className="text-muted-foreground">For questions about these Terms, the Privacy Policy, or to request corrections to artist information, contact:</p>
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
