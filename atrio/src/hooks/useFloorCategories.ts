import { useState, useCallback, useEffect } from 'react';
import { FLOOR_SECTIONS } from '@/types/restaurant';
import { getToken } from '@/lib/api';
import {
  getFloorCategories,
  createFloorCategory,
  updateFloorCategory,
  deleteFloorCategory,
  type FloorCategoryDto,
} from '@/lib/api';

const DEFAULT_NAMES = [...FLOOR_SECTIONS];

export function useFloorCategories() {
  const [categories, setCategories] = useState<FloorCategoryDto[]>(() =>
    DEFAULT_NAMES.map((name, i) => ({ id: `default-${name}`, name, order: i, isDefault: true }))
  );
  const [loading, setLoading] = useState(!!getToken());

  const fetchCategories = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    const res = await getFloorCategories();
    if (res.success && res.data?.categories) {
      setCategories(res.data.categories);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const sectionNames = categories.map((c) => c.name);

  const addCategory = useCallback(async (name: string) => {
    if (!getToken()) return false;
    const res = await createFloorCategory({ name: name.trim() });
    if (res.success && res.data?.category) {
      setCategories((prev) => [...prev, { ...res.data!.category!, isDefault: false }]);
      return true;
    }
    return false;
  }, []);

  const updateCategory = useCallback(async (id: string, updates: { name?: string; order?: number }) => {
    if (!getToken() || String(id).startsWith('default-')) return false;
    const res = await updateFloorCategory(id, updates);
    if (res.success && res.data?.category) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...res.data!.category } : c))
      );
      return true;
    }
    return false;
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    if (!getToken() || String(id).startsWith('default-')) return false;
    const res = await deleteFloorCategory(id);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    }
    return false;
  }, []);

  return {
    categories,
    sectionNames,
    loading,
    addCategory,
    updateCategory,
    removeCategory,
    refetch: fetchCategories,
  };
}
