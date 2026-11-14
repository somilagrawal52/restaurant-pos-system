import { useAuth } from "@/hooks/useAuth";
import StaffManager from "@/components/staff/StaffManager";
import type { AppRole } from "@/hooks/useAuth";

export default function StaffPage() {
  const { user } = useAuth();
  const role = user?.role as AppRole | undefined;

  // Manager can only add manager (for own restaurant) and waiter. Admin can add manager and waiter.
  const canCreateRoles: AppRole[] =
    role === "admin"
      ? ["manager", "waiter"]
      : role === "manager"
        ? ["waiter"]
        : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-foreground">Staff</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team.{" "}
          {role === "manager"
            ? "You can add managers and waiters for your restaurant."
            : "Add managers and waiters, and assign them to restaurants."}
        </p>
      </div>
      <StaffManager canCreateRoles={canCreateRoles} showHeading={false} />
    </div>
  );
}
