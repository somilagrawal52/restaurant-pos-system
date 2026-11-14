import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
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
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl text-foreground">Terms & Conditions</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Last updated: March 12, 2025</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-8 space-y-8 prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using AuraPOS (&quot;AuraPOS&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;the Service&quot;), a Point of Sale and Restaurant Management System, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, do not use the Service. Your use of the Service constitutes acceptance of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. Description of the Service</h2>
              <p>
                AuraPOS is a software-as-a-service platform that provides restaurant Point of Sale (POS), Kitchen Display Systems (KDS), table management, reservations, inventory, and operations. The Service includes:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Reservation management (creation, editing, cancellation)</li>
                <li>Floor plans, tables, and seat assignment</li>
                <li>Staff management (admin, manager, waiter roles)</li>
                <li>Restaurant and venue configuration</li>
                <li>Customer profiles and visit history</li>
                <li>Reports and analytics</li>
                <li>Booking widget for online reservations</li>
                <li>Email notifications (OTP, invites, reminders)</li>
                <li>Voice-based reservation processing (where enabled)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. User Accounts and Roles</h2>
              <p>
                The Service supports role-based access: <strong>Admin</strong> (full system access), <strong>Manager</strong> (restaurant-specific access), and <strong>Waiter</strong> (operational access). You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. Admins and managers must ensure staff use the Service only for lawful business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Transmit malware, spam, or harmful code</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Share, resell, or sublicense the Service without authorization</li>
                <li>Use the Service to collect or process guest data beyond what is necessary for reservations and operations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. Service Availability and Modifications</h2>
              <p>
                We strive to maintain high availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue features with reasonable notice where feasible. Scheduled maintenance may temporarily interrupt access.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. Data and Privacy</h2>
              <p>
                Your use of the Service is also governed by our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. By using AuraPOS, you consent to the collection, use, and disclosure of data as described in the Privacy Policy. You are responsible for ensuring that guest data is collected and processed lawfully (e.g., with appropriate consent where required).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. Intellectual Property</h2>
              <p>
                AuraPOS and its content, features, and functionality (including software, design, and branding) are protected by intellectual property laws. You do not acquire any ownership rights by using the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, AuraPOS and its affiliates, officers, and employees shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">9. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless AuraPOS and its affiliates from any claims, damages, losses, or expenses arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">10. Termination</h2>
              <p>
                We may suspend or terminate your access to the Service for breach of these terms, non-payment, or at our discretion. You may stop using the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">12. Governing Law and Disputes</h2>
              <p>
                These Terms are governed by applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">13. Contact</h2>
              <p>
                For questions about these Terms &amp; Conditions, contact us at <a href="mailto:support@aurapos.io" className="text-primary hover:underline">support@aurapos.io</a>.
              </p>
            </section>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link to="/privacy">
              <Button variant="outline" size="sm">Privacy Policy</Button>
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
