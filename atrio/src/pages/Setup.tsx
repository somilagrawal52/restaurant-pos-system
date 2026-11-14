import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';
import { setupManager } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Setup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', restaurantName: '' });
  const [creating, setCreating] = useState(false);

  const handleSetup = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!form.restaurantName.trim()) {
      toast.error('Restaurant name is required');
      return;
    }

    setCreating(true);
    try {
      const res = await setupManager({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        restaurantName: form.restaurantName.trim(),
      });
      if (!res.success) {
        toast.error(res.message || 'Setup failed');
        setCreating(false);
        return;
      }
      toast.success('Manager account created! You can now log in.');
      navigate('/login');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-2xl shadow-md mb-2">
            ✦
          </div>
          <h1 className="font-sans text-4xl font-black text-foreground tracking-tight">
            Aura<span className="text-primary">POS</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-[0.25em] uppercase font-semibold">
            Manager Onboarding
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <ShieldCheck className="w-8 h-8 text-primary mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">Create Manager Account</h2>
            <p className="text-sm text-muted-foreground">
              Set up the first manager and restaurant (manager dashboard)
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Restaurant Name *</label>
              <Input
                placeholder="e.g. The Grand Kitchen"
                value={form.restaurantName}
                onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Your Full Name *</label>
              <Input
                placeholder="Manager Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Email *</label>
              <Input
                type="email"
                placeholder="manager@restaurant.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Phone (optional)</label>
              <Input
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <Button
              onClick={handleSetup}
              disabled={creating}
              className="w-full h-12 rounded-xl"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Manager & Continue'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
