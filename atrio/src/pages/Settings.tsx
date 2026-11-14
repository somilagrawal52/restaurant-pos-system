import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, LogOut, Loader2, Pencil, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getMe, getToken, updateMe, getRestaurant, updateRestaurant, type User as UserType, type RestaurantOption } from '@/lib/api';
import BookingWidget from '@/pages/BookingWidget';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const roleLabel: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  waiter: "Waiter",
};

export default function Settings() {
  const navigate = useNavigate();
  const { refetchUser, signOut } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantOption | null>(null);
  const [noShowGraceMinutes, setNoShowGraceMinutes] = useState<number>(0);
  const [savingNoShow, setSavingNoShow] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    getMe().then((res) => {
      if (res.success && res.data?.user) {
        setProfile(res.data.user);
        setEditForm({ name: res.data.user.name ?? '', phone: res.data.user.phone ?? '' });
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (profile?.role === 'manager' && profile?.restaurantId) {
      getRestaurant(profile.restaurantId).then((res) => {
        if (res.success && res.data?.restaurant) {
          setRestaurant(res.data.restaurant);
          setNoShowGraceMinutes(res.data.restaurant.noShowGraceMinutes ?? 0);
        }
      });
    }
  }, [profile?.role, profile?.restaurantId]);

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager';

  const handleSaveNoShowGrace = async () => {
    if (!profile?.restaurantId) return;
    setSavingNoShow(true);
    try {
      const res = await updateRestaurant(profile.restaurantId, { noShowGraceMinutes: noShowGraceMinutes });
      if (!res.success) {
        toast.error(res.message || 'Failed to update setting');
        setSavingNoShow(false);
        return;
      }
      toast.success('No-show grace period updated');
      if (res.data?.restaurant) setRestaurant(res.data.restaurant);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSavingNoShow(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await updateMe({ name: editForm.name.trim() || undefined, phone: editForm.phone.trim() || undefined });
      if (!res.success) {
        toast.error(res.message || 'Failed to update profile');
        setSaving(false);
        return;
      }
      toast.success('Profile updated');
      if (res.data?.user) setProfile(res.data.user);
      refetchUser();
      setEditing(false);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10"
      >
        <div>
          <h1 className="font-serif text-3xl text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your profile, account, and online booking
          </p>
        </div>

        {profile ? (
          <>
            <div className="glass-card rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Profile details
                </h2>
                {isAdmin && !editing && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1">
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                )}
                {isAdmin && editing && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEditForm({ name: profile?.name ?? '', phone: profile?.phone ?? '' }); }}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    {editing && isAdmin ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Your name"
                        className="mt-0.5"
                      />
                    ) : (
                      <p className="font-medium text-foreground">{profile.name || '—'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{profile.email}</p>
                    <p className="text-xs text-muted-foreground/80">Email cannot be changed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    {editing && isAdmin ? (
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="Phone number"
                        className="mt-0.5"
                      />
                    ) : (
                      <p className="font-medium text-foreground">{profile.phone || '—'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium text-foreground capitalize">
                      {profile.role
                        ? roleLabel[profile.role] || profile.role
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* No-show grace period — manager only */}
            {isManager && (
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Reservation settings
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      No-show grace period (minutes)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      If a guest doesn&apos;t arrive by reservation time + this many minutes, the reservation is marked as no-show. 0 = at reservation time.
                    </p>
                    <Input
                      type="number"
                      min={0}
                      max={999}
                      value={noShowGraceMinutes}
                      onChange={(e) => setNoShowGraceMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="mt-2 max-w-[8rem]"
                      placeholder="0"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveNoShowGrace}
                    disabled={savingNoShow}
                  >
                    {savingNoShow ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </div>
            )}

            <div className="glass-card rounded-2xl p-6 border-destructive/20">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                Account
              </h2>
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </div>

            {/* Booking widget */}
            <div className="space-y-4">
              <div>
                <h2 className="font-serif text-xl text-foreground">
                  Booking widget
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Preview and embed the online reservation form on your website.
                </p>
              </div>
              <BookingWidget />
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-2">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</Link>
              <span>·</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            </div>
          </>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              You’re not logged in.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Log in to see your profile and use all features.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/")}
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
