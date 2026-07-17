import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "@/components/app-sidebar.tsx";

/**
 * Main app layout with the left sidebar navigation.
 * Used for all public pages (not admin, not auth callback).
 */
export default function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  // Admin pages don't get the sidebar
  if (isAdmin) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
