import { useState, useEffect, useCallback } from 'react';
import { getToken, clearToken, getMe } from '@/lib/api';
import type { User } from '@/lib/api';

export type AppRole = 'admin' | 'manager' | 'waiter';

interface AuthState {
  user: User | null;
  role: AppRole | null;
  profile: { name: string; email: string; phone: string | null } | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    profile: null,
    loading: true,
  });

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState((prev) => ({ ...prev, user: null, role: null, profile: null, loading: false }));
      return;
    }
    const res = await getMe();
    if (!res.success || !res.data?.user) {
      clearToken();
      setState((prev) => ({ ...prev, user: null, role: null, profile: null, loading: false }));
      return;
    }
    const u = res.data.user;
    const role = (u.role as AppRole) || null;
    setState({
      user: u,
      role,
      profile: u ? { name: u.name ?? '', email: u.email, phone: u.phone ?? null } : null,
      loading: false,
    });
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signOut = useCallback(() => {
    clearToken();
    setState({
      user: null,
      role: null,
      profile: null,
      loading: false,
    });
  }, []);

  const getRoleDashboard = useCallback((role: AppRole | null): string => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'manager':
        return '/manager-dashboard';
      case 'waiter':
        return '/waiter-dashboard';
      default:
        return '/login';
    }
  }, []);

  return { ...state, signOut, getRoleDashboard, refetchUser: fetchUser };
}
