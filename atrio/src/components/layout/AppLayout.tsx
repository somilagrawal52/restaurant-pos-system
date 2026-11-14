import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Grid3X3,
  BarChart3,
  Users,
  Settings,
  Menu,
  Building2,
  UserCircle,
  CreditCard,
  ChefHat,
  Package,
  Banknote,
  Truck,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function getNavItems(role: string | undefined) {
  const dashboardPath =
    role === 'admin'
      ? '/admin-dashboard'
      : role === 'manager'
        ? '/manager-dashboard'
        : role === 'waiter'
          ? '/waiter-dashboard'
          : '/';
  const dashboard = { path: dashboardPath, label: 'Dashboard', icon: LayoutDashboard };

  // Core POS items available to operations
  const posItem = { path: '/pos', label: 'POS Terminal', icon: CreditCard };
  const kdsItem = { path: '/kds', label: 'Kitchen KDS', icon: ChefHat };
  const menuCatalogItem = { path: '/menu-catalog', label: 'Menu Catalog', icon: UtensilsCrossed };
  const inventoryItem = { path: '/inventory', label: 'Inventory & BOM', icon: Package };
  const shiftsItem = { path: '/shifts', label: 'Cash Shifts (Z-Rep)', icon: Banknote };
  const deliveryItem = { path: '/delivery', label: 'Online Deliveries', icon: Truck };
  const floorPlanItem = { path: '/floor', label: 'Floor Plan', icon: Grid3X3 };
  const reservationsItem = { path: '/reservations', label: 'Reservations', icon: CalendarDays };
  const customer360Item = { path: '/customer-360', label: 'Customer 360', icon: UserCircle };
  const staffItem = { path: '/staff', label: 'Staff Management', icon: Users };
  const reportsItem = { path: '/reports', label: 'Analytics & Reports', icon: BarChart3 };

  if (role === 'admin') {
    return [
      dashboard,
      posItem,
      kdsItem,
      inventoryItem,
      shiftsItem,
      deliveryItem,
      menuCatalogItem,
      floorPlanItem,
      reservationsItem,
      customer360Item,
      reportsItem,
      { path: '/restaurants', label: 'Properties & Multi-Unit', icon: Building2 },
    ];
  }

  if (role === 'waiter') {
    return [
      dashboard,
      posItem,
      kdsItem,
      floorPlanItem,
      reservationsItem,
    ];
  }

  // Manager (full operations)
  return [
    dashboard,
    posItem,
    kdsItem,
    floorPlanItem,
    reservationsItem,
    deliveryItem,
    inventoryItem,
    shiftsItem,
    menuCatalogItem,
    customer360Item,
    staffItem,
    reportsItem,
  ];
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = useMemo(() => getNavItems(user?.role), [user?.role]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-sidebar px-4 py-6">
        <SidebarContent currentPath={location.pathname} navItems={navItems} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar px-4 py-6 lg:hidden"
            >
              <SidebarContent
                currentPath={location.pathname}
                onNavigate={() => setSidebarOpen(false)}
                navItems={navItems}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="lg:hidden">
              <h1 className="font-sans text-lg text-foreground tracking-tight font-bold">
                Aura<span className="text-primary">POS</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">Dinner & Evening Service</p>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="text-xs font-bold text-primary">AP</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarContent({
  currentPath,
  onNavigate,
  navItems,
}: {
  currentPath: string;
  onNavigate?: () => void;
  navItems: Array<{ path: string; label: string; icon: React.ElementType }>;
}) {
  return (
    <>
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-sm">
            ✦
          </div>
          <h1 className="font-sans text-xl font-black text-foreground tracking-tight">
            Aura<span className="text-primary">POS</span>
          </h1>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 tracking-widest uppercase font-semibold">
          Unified Restaurant OS
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-3 border-t border-border space-y-1">
        <Link
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>
        <div className="px-3 pt-1">
          <p className="text-[10px] text-muted-foreground/60 tracking-wider uppercase font-mono">
            AuraPOS v2.4 • Enterprise
          </p>
        </div>
      </div>
    </>
  );
}
