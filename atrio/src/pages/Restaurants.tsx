import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Loader2, Building2, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getRestaurants, createRestaurant, deleteRestaurant } from '@/lib/api';
import type { RestaurantOption } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function Restaurants() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', seatingCapacity: '' });
  const [deleteTarget, setDeleteTarget] = useState<RestaurantOption | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRestaurants = async () => {
    setLoading(true);
    const res = await getRestaurants();
    if (res.success && res.data?.restaurants) {
      setRestaurants(res.data.restaurants);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const filtered = restaurants.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    (h.address && h.address.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddRestaurant = async () => {
    if (!form.name.trim()) {
      toast.error('Restaurant name is required');
      return;
    }
    setCreating(true);
    try {
      const res = await createRestaurant({
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        seatingCapacity: form.seatingCapacity ? parseInt(form.seatingCapacity, 10) : undefined,
      });
      if (!res.success) {
        toast.error(res.message || 'Failed to add restaurant');
        setCreating(false);
        return;
      }
      toast.success(`${form.name} added`);
      setForm({ name: '', address: '', seatingCapacity: '' });
      setAddOpen(false);
      fetchRestaurants();
      if (res.data?.restaurant?.id) {
        navigate(`/restaurants/${res.data.restaurant.id}`);
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleting(true);
    try {
      const res = await deleteRestaurant(id);
      if (!res.success) {
        toast.error(res.message || 'Failed to delete restaurant');
        setDeleting(false);
        return;
      }
      toast.success('Restaurant deleted');
      setDeleteTarget(null);
      fetchRestaurants();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Restaurants</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add restaurants and assign managers and staff to each.
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Restaurant
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search restaurants by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No restaurants match your search.' : 'No restaurants yet. Add your first restaurant to get started.'}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Restaurant
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((restaurant) => (
              <div
                key={restaurant.id}
                className="glass-card rounded-xl p-4 flex items-center justify-between gap-3 group"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/restaurants/${restaurant.id}`)}
                  className="flex-1 flex items-center justify-between text-left hover:bg-muted/40 rounded-lg -m-2 p-2 transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{restaurant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {restaurant.address || '—'} · {restaurant.seatingCapacity != null ? `${restaurant.seatingCapacity} seats` : '—'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(restaurant);
                  }}
                  title="Delete restaurant"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete restaurant?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget
              ? `"${deleteTarget.name}" will be permanently deleted. This cannot be undone. Remove all staff from this restaurant first if any are assigned.`
              : ''}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRestaurant}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Restaurant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Restaurant Name *</label>
              <Input
                placeholder="e.g. Grand Plaza"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Address</label>
              <Input
                placeholder="Street, city, state"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Seating Capacity</label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 120"
                value={form.seatingCapacity}
                onChange={(e) => setForm((f) => ({ ...f, seatingCapacity: e.target.value }))}
              />
            </div>
            <Button onClick={handleAddRestaurant} disabled={creating} className="w-full">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Restaurant'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
