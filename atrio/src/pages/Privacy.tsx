import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <div className="flex items-center justify-between gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl text-foreground">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Last updated: March 12, 2025</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-8 space-y-8 prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
              <p>
                AuraPOS (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the AuraPOS Point of Sale and Restaurant Management System. This Privacy Policy explains how we collect, use, store, and protect personal data when you use our Service. By using AuraPOS, you agree to this policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Data We Collect</h2>

              <h3 className="text-base font-medium text-foreground mt-4 mb-2">2.1 Staff and User Data</h3>
              <p>
                When you register or are invited as staff (admin, manager, or waiter), we collect:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Email address</li>
                <li>Full name</li>
                <li>Phone number</li>
                <li>Role and restaurant assignment</li>
                <li>Account status</li>
              </ul>

              <h3 className="text-base font-medium text-foreground mt-4 mb-2">2.2 Guest and Reservation Data</h3>
              <p>
                When reservations are created (via staff, online widget, or phone), we may collect:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Guest name</li>
                <li>Guest email</li>
                <li>Guest phone number</li>
                <li>Party size, date, time, and duration</li>
                <li>Special requests, notes, and occasion</li>
                <li>Booking source (walk-in, phone, online, widget)</li>
              </ul>

              <h3 className="text-base font-medium text-foreground mt-4 mb-2">2.3 Restaurant Data</h3>
              <p>
                For restaurant configuration, we store:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Restaurant name and address</li>
                <li>Seating capacity and floor plans</li>
                <li>No-show grace period settings</li>
              </ul>

              <h3 className="text-base font-medium text-foreground mt-4 mb-2">2.4 Technical and Usage Data</h3>
              <p>
                We automatically collect limited technical data necessary for the Service:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>JWT authentication tokens (stored in browser localStorage)</li>
                <li>Sidebar preference (expanded/collapsed), stored in a cookie for up to 7 days</li>
                <li>API requests and responses (processed by our backend for service delivery)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Data</h2>
              <p>We use the data we collect to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Provide and operate the AuraPOS Service (POS, KDS, reservations, floor plans, inventory, staff and restaurant management)</li>
                <li>Authenticate users (OTP login, password login) and manage sessions</li>
                <li>Send OTP codes, staff invite emails, and reservation reminder emails</li>
                <li>Support Customer 360 (guest profiles and visit history)</li>
                <li>Generate reports and analytics for restaurant operations</li>
                <li>Process voice-based reservations when the ASR (speech recognition) feature is enabled</li>
                <li>Improve, troubleshoot, and secure the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Legal Basis for Processing</h2>
              <p>
                We process data based on: (a) performance of the contract between you and us; (b) your consent where required (e.g., marketing); (c) legitimate interests in providing and improving the Service; and (d) compliance with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Storage and Security</h2>
              <p>
                Data is stored on our backend servers (hosted infrastructure) and in databases (e.g., MongoDB). We use industry-standard security measures including encrypted connections (HTTPS), secure authentication (JWT), and access controls. While we implement appropriate safeguards, no method of transmission or storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Third-Party Services</h2>
              <p>We use or integrate with the following types of services:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Email delivery</strong> (e.g., Gmail, nodemailer) to send OTPs, invites, and reminders</li>
                <li><strong>ASR (Automatic Speech Recognition)</strong> for voice-based reservation processing when enabled</li>
                <li><strong>Hosting and infrastructure</strong> providers that process data on our behalf</li>
              </ul>
              <p className="mt-3">
                We do not sell your personal data. Third parties process data only to provide the Service under our instructions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Data Retention</h2>
              <p>
                We retain data for as long as your account is active or as needed to provide the Service. Reservation and guest data is retained for operational and historical purposes (e.g., visit history in Customer 360). You may request deletion of your data; we will respond in accordance with applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Your Rights</h2>
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Access</strong> – obtain a copy of your personal data</li>
                <li><strong>Correction</strong> – request correction of inaccurate data</li>
                <li><strong>Deletion</strong> – request deletion of your personal data</li>
                <li><strong>Portability</strong> – receive your data in a structured format</li>
                <li><strong>Object</strong> – object to certain processing</li>
                <li><strong>Withdraw consent</strong> – where processing is based on consent</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us at <a href="mailto:support@aurapos.io" className="text-primary hover:underline">support@aurapos.io</a>. You may also have the right to lodge a complaint with a supervisory authority.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">9. Cookies and Local Storage</h2>
              <p>
                We use minimal storage: (a) <strong>localStorage</strong> to store your authentication token for session persistence; (b) a <strong>cookie</strong> for sidebar state (expanded/collapsed) with a 7-day expiry. We do not use tracking cookies or third-party advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">10. Children</h2>
              <p>
                The Service is not intended for users under 18. We do not knowingly collect personal data from children. If you become aware that a child has provided us with personal data, please contact us and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">11. International Transfers</h2>
              <p>
                Data may be processed and stored in India or other jurisdictions where our service providers operate. We ensure appropriate safeguards are in place for such transfers where required by law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Service and updating the &quot;Last updated&quot; date. Continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">13. Contact</h2>
              <p>
                For privacy-related questions or to exercise your rights, contact us at <a href="mailto:support@aurapos.io" className="text-primary hover:underline">support@aurapos.io</a>.
              </p>
            </section>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link to="/terms">
              <Button variant="outline" size="sm">Terms &amp; Conditions</Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">Back to login</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
