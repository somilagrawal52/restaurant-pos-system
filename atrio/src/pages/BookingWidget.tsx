import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Code } from 'lucide-react';

export default function BookingWidget() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    partySize: '2',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
        {/* Widget Preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-elevated rounded-2xl p-8 max-w-md"
        >
          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl text-foreground">Reserve a Table</h2>
            <p className="text-sm text-muted-foreground mt-1">Book your dining experience</p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-12"
            >
              <div className="w-14 h-14 rounded-full bg-status-available/10 flex items-center justify-center mb-4">
                <Check className="w-7 h-7 text-status-available" />
              </div>
              <p className="font-serif text-xl text-foreground">Confirmed!</p>
              <p className="text-sm text-muted-foreground mt-1">We'll see you soon.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="mt-1.5 bg-background/60"
                  placeholder="Your name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="mt-1.5 bg-background/60"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="mt-1.5 bg-background/60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Guests</Label>
                  <select
                    value={form.partySize}
                    onChange={(e) => setForm(f => ({ ...f, partySize: e.target.value }))}
                    className="mt-1.5 w-full h-10 rounded-md border border-input bg-background/60 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="mt-1.5 bg-background/60"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
                    className="mt-1.5 bg-background/60"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2">
                Confirm Reservation
              </Button>
              <p className="text-[10px] text-center text-muted-foreground/50 mt-2">Powered by AuraPOS</p>
            </form>
          )}
        </motion.div>

        {/* Embed Code */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-4 h-4 text-primary" />
              <h3 className="font-serif text-lg text-foreground">Embed Code</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Copy and paste this snippet into your restaurant website to enable online reservations.
            </p>
            <div className="bg-foreground/5 rounded-lg p-4 font-mono text-xs text-muted-foreground overflow-x-auto">
              <pre>{`<iframe
  src="https://your-aurapos-domain.com/book"
  width="100%"
  height="520"
  frameborder="0"
  style="border-radius: 16px;"
></iframe>`}</pre>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">
              Widget styling inherits your AuraPOS theme settings. API integration available for custom implementations.
            </p>
          </div>

          <div className="glass-card rounded-xl p-6 mt-4">
            <h3 className="font-serif text-lg text-foreground mb-2">Widget Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Customize available time slots, party size limits, and booking rules from your AuraPOS settings panel.
              Integration-ready for your existing website CMS.
            </p>
          </div>
        </motion.div>
      </div>
  );
}
