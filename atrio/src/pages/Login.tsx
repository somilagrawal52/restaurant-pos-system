import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ShieldCheck, Loader2, Lock } from 'lucide-react';
import { setToken, loginWithPassword, getToken } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { user, role, loading, getRoleDashboard } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Only redirect if we have a token (avoid redirect after logout when state is still stale)
    if (!loading && user && role && getToken()) {
      navigate(getRoleDashboard(role), { replace: true });
    }
  }, [user, role, loading, navigate, getRoleDashboard]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }
    setVerifying(true);
    try {
      const res = await loginWithPassword(email.toLowerCase().trim(), password);
      if (!res.success || !res.data?.token) {
        toast.error(res.message || 'Invalid email or password');
        setVerifying(false);
        return;
      }
      setToken(res.data.token);
      const dashboard = getRoleDashboard((res.data.user?.role as 'admin' | 'manager' | 'waiter') || null);
      navigate(dashboard, { replace: true });
    } catch {
      toast.error('Login failed');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
            Unified Restaurant OS
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-foreground">Sign In to POS Station</h2>
            <p className="text-sm text-muted-foreground">
              Enter your staff or manager credentials
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-muted/30 border-border/50 text-foreground"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="pl-10 h-12 rounded-xl bg-muted/30 border-border/50 text-foreground"
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={verifying || !password.trim() || !email.trim()}
              className="w-full h-12 rounded-xl text-sm font-medium"
            >
              {verifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-1" /> Sign in
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/60 mt-6 tracking-wide uppercase">
          AuraPOS • High-Performance Restaurant Operations
        </p>
        <p className="text-center text-[10px] text-muted-foreground/60 mt-2 flex flex-wrap justify-center gap-x-3 gap-y-0">
          <Link to="/terms" className="hover:text-foreground/80 transition-colors">Terms</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-foreground/80 transition-colors">Privacy</Link>
        </p>
      </motion.div>
    </div>
  );
}
