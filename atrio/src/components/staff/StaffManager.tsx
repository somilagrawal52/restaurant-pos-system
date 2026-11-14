import { useState, useEffect } from 'react';
import { Plus, Users, Loader2, Pencil, Trash2 } from 'lucide-react';
import { getStaff, createStaff, updateStaff, deleteStaff, getRestaurants, type StaffMember, type RestaurantOption } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import type { AppRole } from '@/hooks/useAuth';

interface StaffManagerProps {
  canCreateRoles: AppRole[];
  /** When false, hide the "Staff" section heading (e.g. when used on dedicated /staff page). */
  showHeading?: boolean;
  /** When set, only show staff for this restaurant and assign new staff to this restaurant. */
  fixedRestaurantId?: string;
  /** When set with fixedRestaurantId, used for display (e.g. "Grand Plaza"). */
  fixedRestaurantName?: string;
}

export default function StaffManager({ canCreateRoles, showHeading = true, fixedRestaurantId, fixedRestaurantName }: StaffManagerProps) {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [updating, setUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '' as string,
    restaurantName: '',
    restaurantId: '' as string,
    password: '',
  });

  const fetchStaff = async () => {
    setLoading(true);
    const res = await getStaff();
    if (res.success && res.data?.staff) {
      setStaff(res.data.staff);
    }
    setLoading(false);
  };

  const fetchRestaurants = async () => {
    const res = await getRestaurants();
    if (res.success && res.data?.restaurants) {
      setRestaurants(res.data.restaurants);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (dialogOpen && (canCreateRoles.includes('waiter') || canCreateRoles.includes('manager')) && !fixedRestaurantId) {
      fetchRestaurants();
    }
  }, [dialogOpen, canCreateRoles, fixedRestaurantId]);

  useEffect(() => {
    if (editingMember) {
      setEditForm({
        name: editingMember.name,
        email: editingMember.email ?? '',
        phone: editingMember.phone ?? '',
      });
    }
  }, [editingMember]);

  const isManager = user?.role === 'manager';

  // When manager opens add dialog, fix role to waiter (manager can only add waiters)
  useEffect(() => {
    if (dialogOpen && isManager) {
      setForm((f) => ({ ...f, role: 'waiter' }));
    }
  }, [dialogOpen, isManager]);
  const managerRestaurantId = user?.restaurantId ?? null;
  const showRestaurantName = form.role === 'manager' && !isManager && !fixedRestaurantId;
  const showRestaurantSelect = form.role === 'waiter' && !fixedRestaurantId;
  const waiterRestaurantOptions = isManager && managerRestaurantId
    ? restaurants.filter((r) => r.id === managerRestaurantId)
    : restaurants;
  const displayedStaff = fixedRestaurantId
    ? staff.filter((m) => (m.restaurantId ?? '') === fixedRestaurantId)
    : staff;

  const handleCreate = async () => {
    const roleToUse = isManager ? 'waiter' : form.role;
    if (!form.name || !form.email || !roleToUse || !form.password) {
      toast.error('Please fill in all required fields (including password)');
      return;
    }
    const ridForWaiter = fixedRestaurantId ?? (isManager ? managerRestaurantId : form.restaurantId);
    if (roleToUse === 'waiter' && !ridForWaiter) {
      toast.error('Please select a restaurant for the waiter');
      return;
    }
    if (roleToUse === 'manager' && !fixedRestaurantId && !isManager && !form.restaurantName?.trim()) {
      toast.error('Restaurant name is required when adding a manager');
      return;
    }

    setCreating(true);
    try {
      const body: Parameters<typeof createStaff>[0] = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: roleToUse,
        password: form.password,
      };
      if (roleToUse === 'manager') {
        if (fixedRestaurantId) {
          body.restaurantId = fixedRestaurantId;
        } else if (!isManager) {
          body.restaurantName = form.restaurantName.trim();
        }
      }
      if (roleToUse === 'waiter') {
        body.restaurantId = ridForWaiter ?? '';
      }

      const res = await createStaff(body);

      if (!res.success) {
        toast.error(res.message || 'Failed to create staff member');
        setCreating(false);
        return;
      }
      toast.success(`${form.name} added as ${roleToUse}`);
      setForm({ name: '', email: '', phone: '', role: '', restaurantName: '', restaurantId: '', password: '' });
      setDialogOpen(false);
      fetchStaff();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingMember) return;
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    setUpdating(true);
    try {
      const res = await updateStaff(editingMember.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || undefined,
      });
      if (!res.success) {
        toast.error(res.message || 'Failed to update');
        return;
      }
      toast.success('Staff updated');
      setEditingMember(null);
      fetchStaff();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      const res = await deleteStaff(id);
      if (!res.success) {
        toast.error(res.message || 'Failed to delete');
        return;
      }
      toast.success('Staff member deleted');
      fetchStaff();
    } catch {
      toast.error('Something went wrong');
    }
  };

  const roleLabel = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      manager: 'bg-blue-100 text-blue-700',
      waiter: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${colors[role] || 'bg-muted text-muted-foreground'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {showHeading && (
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Staff</h2>
          </div>
        )}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-lg ml-auto">
              <Plus className="w-4 h-4 mr-1" /> Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              {fixedRestaurantName && (
                <p className="text-sm text-muted-foreground font-normal">Assigning to {fixedRestaurantName}</p>
              )}
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <Input
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Email *</label>
                <Input
                  type="email"
                  placeholder="john@restaurant.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Password *</label>
                <Input
                  type="password"
                  placeholder="Set a login password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Role *</label>
                {isManager ? (
                  <p className="text-sm text-muted-foreground py-2 px-3 rounded-lg bg-muted/60 border border-border">
                    Waiter
                  </p>
                ) : (
                  <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val, restaurantId: '', restaurantName: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {canCreateRoles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {showRestaurantName && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Restaurant Name *</label>
                  <Input
                    placeholder="e.g. The Grand Dining"
                    value={form.restaurantName}
                    onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Enter the restaurant this manager will manage. A new restaurant is created if it doesn’t exist.</p>
                </div>
              )}

              {showRestaurantSelect && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    {isManager ? 'Restaurant' : 'Assign to restaurant *'}
                  </label>
                  {isManager && waiterRestaurantOptions.length === 1 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      {waiterRestaurantOptions[0].name}
                    </p>
                  ) : (
                    <Select
                      value={isManager && managerRestaurantId ? managerRestaurantId : form.restaurantId}
                      onValueChange={(val) => setForm({ ...form, restaurantId: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select restaurant" />
                      </SelectTrigger>
                      <SelectContent>
                        {waiterRestaurantOptions.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <Button
                onClick={handleCreate}
                disabled={creating}
                className="w-full rounded-lg"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Staff Member'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {!showHeading && <span />}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : displayedStaff.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {fixedRestaurantId ? 'No staff assigned to this restaurant yet.' : 'No staff members yet'}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {displayedStaff.map((member) => (
              <div key={member.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {roleLabel(member.role || '')}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingMember(member)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(member)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit staff member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Full name *</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Email *</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Phone</label>
              <Input
                placeholder="+91 98765 43210"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <Button onClick={handleUpdate} disabled={updating} className="w-full">
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete staff member?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget?.name} will be removed. This cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
