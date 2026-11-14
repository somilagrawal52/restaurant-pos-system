import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRestaurants } from '@/lib/api';
import type { RestaurantOption } from '@/lib/api';
import StaffManager from '@/components/staff/StaffManager';

export default function RestaurantDetail() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantOption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    getRestaurants().then((res) => {
      if (res.success && res.data?.restaurants) {
        const found = res.data.restaurants.find((r) => r.id === restaurantId);
        setRestaurant(found ?? null);
      }
      setLoading(false);
    });
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-muted-foreground">Restaurant not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/restaurants')}>
          Back to Restaurants
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/restaurants')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-serif text-3xl text-foreground">{restaurant.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {restaurant.address || '—'} · {restaurant.seatingCapacity != null ? `${restaurant.seatingCapacity} seats` : '—'}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Restaurant details</p>
            <p className="text-foreground font-medium">{restaurant.name}</p>
            <p className="text-sm text-muted-foreground">{restaurant.address || 'No address'}</p>
            <p className="text-sm text-muted-foreground">
              Seating capacity: {restaurant.seatingCapacity != null ? restaurant.seatingCapacity : '—'}
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl text-foreground mb-2">Staff at this restaurant</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Assign managers and waiters to this restaurant. You can add multiple managers per restaurant.
          </p>
          <StaffManager
            canCreateRoles={['manager', 'waiter']}
            showHeading={false}
            fixedRestaurantId={restaurant.id}
            fixedRestaurantName={restaurant.name}
          />
        </div>
      </motion.div>
    </div>
  );
}
