import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Pencil, Trash2, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  listFloorCategories,
  createFloorCategory,
  updateFloorCategory,
  deleteFloorCategory,
  type FloorCategoryDto,
} from '@/lib/api';
import { toast } from 'sonner';

interface FloorCategoriesModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function FloorCategoriesModal({ open, onClose, onSaved }: FloorCategoriesModalProps) {
  const [categories, setCategories] = useState<FloorCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await listFloorCategories();
    if (res.success && res.data?.categories) {
      setCategories(res.data.categories);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
      setNewName('');
      setEditingId(null);
      setDeletingId(null);
    }
  }, [open]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Enter a category name');
      return;
    }
    setAdding(true);
    try {
      const res = await createFloorCategory({ name });
      if (!res.success) {
        toast.error(res.message || 'Failed to create category');
        return;
      }
      toast.success(`"${name}" added`);
      setNewName('');
      if (res.data?.category) {
        setCategories((prev) => [...prev, res.data!.category!].sort((a, b) => a.order - b.order));
      }
      onSaved?.();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (cat: FloorCategoryDto) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = async () => {
    if (!editingId || editName.trim() === '') return;
    const name = editName.trim();
    try {
      const res = await updateFloorCategory(editingId, { name });
      if (!res.success) {
        toast.error(res.message || 'Failed to update');
        return;
      }
      toast.success('Category updated');
      setCategories((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, name } : c))
      );
      setEditingId(null);
      onSaved?.();
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (id: string) => {
    if (String(id).startsWith('default-')) return;
    setDeletingId(id);
    try {
      const res = await deleteFloorCategory(id);
      if (!res.success) {
        toast.error(res.message || 'Failed to delete');
        setDeletingId(null);
        return;
      }
      toast.success('Category removed');
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDeletingId(null);
      setEditingId(null);
      onSaved?.();
    } catch {
      toast.error('Something went wrong');
      setDeletingId(null);
    }
  };

  const defaultCategories = categories.filter((c) => c.isDefault);
  const customCategories = categories.filter((c) => !c.isDefault);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 mx-4 glass-card-elevated rounded-2xl p-6 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-foreground">Floor categories</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Add new */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="New category name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="bg-background/60"
              />
              <Button onClick={handleAdd} disabled={adding} className="shrink-0">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Default (read-only) */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Default sections
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {defaultCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/60 border border-border"
                        >
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom (CRUD) */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Custom categories
                    </p>
                    {customCategories.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No custom categories yet. Add one above.</p>
                    ) : (
                      <ul className="space-y-2">
                        {customCategories.map((cat) => (
                          <li key={cat.id}>
                            {editingId === cat.id ? (
                              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background/80 border border-border">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                  className="h-8 flex-1"
                                  autoFocus
                                />
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={saveEdit}>
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors">
                                <span className="font-medium text-foreground">{cat.name}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => startEdit(cat)}
                                    className="p-1.5 rounded-lg hover:bg-background/80 text-muted-foreground hover:text-foreground"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(cat.id)}
                                    disabled={deletingId === cat.id}
                                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-50"
                                  >
                                    {deletingId === cat.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
