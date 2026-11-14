import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import SetupAdmin from "./pages/SetupAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import WaiterDashboard from "./pages/WaiterDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Reservations from "./pages/Reservations";
import FloorPlan from "./pages/FloorPlan";
import Reports from "./pages/Reports";
import StaffPage from "./pages/Staff";
import Customer360 from "./pages/Customer360";
import Settings from "./pages/Settings";
import Restaurants from "./pages/Restaurants";
import RestaurantDetail from "./pages/RestaurantDetail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

// New POS Core Pages
import PosTerminal from "./pages/PosTerminal";
import KitchenDisplay from "./pages/KitchenDisplay";
import InventoryManagement from "./pages/InventoryManagement";
import CashDrawerShifts from "./pages/CashDrawerShifts";
import OnlineDeliveryHub from "./pages/OnlineDeliveryHub";
import MenuManagement from "./pages/MenuManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<SetupAdmin />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* POS Core Operations */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}>
                <AppLayout><PosTerminal /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/kds"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}>
                <AppLayout><KitchenDisplay /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu-catalog"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AppLayout><MenuManagement /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AppLayout><InventoryManagement /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shifts"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AppLayout><CashDrawerShifts /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AppLayout><OnlineDeliveryHub /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Role dashboards */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><AdminDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurants"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><Restaurants /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurants/:restaurantId"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout><RestaurantDetail /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <AppLayout><ManagerDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/waiter-dashboard"
            element={
              <ProtectedRoute allowedRoles={['waiter']}>
                <AppLayout><WaiterDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Shared operational routes (all authenticated roles) */}
          <Route
            path="/reservations"
            element={
              <ProtectedRoute>
                <AppLayout><Reservations /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/floor"
            element={
              <ProtectedRoute allowedRoles={['manager', 'waiter']}>
                <AppLayout><FloorPlan /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AppLayout><Reports /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <AppLayout><StaffPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer-360"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <AppLayout><Customer360 /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout><Settings /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
