import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  ArrowUpRight,
  Loader2,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getRestaurants, getStaff } from '@/lib/api';
import type { RestaurantOption } from '@/lib/api';

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  href?: string;
  subtitle?: string;
}) {
  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="rounded-xl bg-primary/10 p-3 text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        to={href}
        className="glass-card rounded-xl p-5 block transition-colors hover:bg-muted/40 group"
      >
        {content}
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    );
  }
  return <div className="glass-card rounded-xl p-5">{content}</div>;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [staff, setStaff] = useState<{ id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getRestaurants(), getStaff()])
      .then(([rRes, sRes]) => {
        if (cancelled) return;
        if (rRes.success && rRes.data?.restaurants) setRestaurants(rRes.data.restaurants);
        if (sRes.success && sRes.data?.staff) setStaff(sRes.data.staff);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-serif text-3xl text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {dateStr} · Welcome back, {profile?.name || 'Admin'}
        </p>
      </motion.div>

      {/* Overview stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          title="Restaurants"
          value={restaurants.length}
          icon={Building2}
          href="/restaurants"
          subtitle={restaurants.length === 0 ? 'Add your first restaurant' : undefined}
        />
        <StatCard
          title="Total staff"
          value={staff.length}
          icon={Users}
          href="/restaurants"
          subtitle="Managers & waiters"
        />
      </motion.div>

      {/* Empty state: no restaurants */}
      {restaurants.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-8 text-center mb-8"
        >
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-serif text-xl text-foreground">Get started</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Add your first restaurant to start assigning managers, staff, and taking reservations.
          </p>
          <Link to="/restaurants">
            <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              Add restaurant
            </button>
          </Link>
        </motion.div>
      )}

    </div>
  );
}
