import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard, Package, Users, CalendarDays, Wallet, UserCog, LogOut, FileText, BookMarked, Menu,
} from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, admin: true },
  { to: "/stock", label: "Stock", icon: Package },
  { to: "/locations", label: "Locations", icon: CalendarDays },
  { to: "/reservation", label: "Réservations", icon: BookMarked },
  { to: "/contract", label: "Contrats", icon: FileText },
  { to: "/caisse", label: "Caisse", icon: Wallet, admin: true },
  { to: "/employes", label: "Employés", icon: UserCog, admin: true },
];

function AppLayout() {
  const navigate = useNavigate();
  const auth = useStore((s) => s.auth);
  const logout = useStore((s) => s.logout);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!auth.role) navigate({ to: "/login" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.role]);

  // Load all data from Supabase after authentication + auto-refresh every 2s
  useEffect(() => {
    if (auth.role) {
      useStore.getState().loadAllData();
      const interval = setInterval(() => {
        useStore.getState().loadAllData();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [auth.role]);

  if (!auth.role) return null;

  const items = NAV.filter((i) => !i.admin || auth.role === "admin");

  const [mobileOpen, setMobileOpen] = useState(false);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[240px] flex-col border-r" style={{ borderColor: "#E5E5E5" }}>
        <div className="px-6 py-6 border-b" style={{ borderColor: "#E5E5E5" }}>
          <div className="brand-name" style={{ fontSize: 20 }}>Boutique des Rêves</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((item) => {
            const active = path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors relative"
                style={{
                  background: active ? "rgba(116,54,126,0.08)" : "transparent",
                  color: active ? "#74367E" : "#1A1A1A",
                  fontWeight: active ? 500 : 400,
                  borderLeft: active ? "3px solid #74367E" : "3px solid transparent",
                  paddingLeft: active ? "13px" : "16px",
                }}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "#E5E5E5" }}>
          <div className="text-[13px]" style={{ color: "rgba(26,26,26,0.55)" }}>{auth.employeeName}</div>
          <button onClick={handleLogout} className="mt-2 text-[13px] flex items-center gap-1.5" style={{ color: "#74367E" }}>
            <LogOut className="w-3.5 h-3.5" /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* Mobile slide-out sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={closeMobile}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />
          {/* Drawer */}
          <aside
            className="absolute left-0 top-0 bottom-0 w-[260px] bg-white flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b" style={{ borderColor: "#E5E5E5" }}>
              <div className="brand-name" style={{ fontSize: 18 }}>Boutique des Rêves</div>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {items.map((item) => {
                const active = path.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMobile}
                    className="flex items-center gap-4 px-5 py-3.5 rounded-lg text-[15px] transition-colors relative"
                    style={{
                      background: active ? "rgba(116,54,126,0.08)" : "transparent",
                      color: active ? "#74367E" : "#1A1A1A",
                      fontWeight: active ? 500 : 400,
                      borderLeft: active ? "3px solid #74367E" : "3px solid transparent",
                      paddingLeft: active ? "13px" : "16px",
                    }}
                  >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t" style={{ borderColor: "#E5E5E5" }}>
          <div className="text-[14px]" style={{ color: "rgba(26,26,26,0.55)" }}>{auth.employeeName}</div>
          <button onClick={handleLogout} className="mt-2 text-[14px] flex items-center gap-1.5" style={{ color: "#74367E" }}>
            <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center px-3 py-1.5 border-b mt-8" style={{ borderColor: "#E5E5E5" }}>
          <button onClick={openMobile} aria-label="Menu" className="mr-3" style={{ color: "#1A1A1A" }}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="brand-name flex-1" style={{ fontSize: 18 }}>Boutique des Rêves</div>
          <button onClick={handleLogout} aria-label="Déconnexion" style={{ color: "#74367E" }}>
            <LogOut className="w-5 h-5" />
          </button>
        </header>
        <div className="p-6 lg:p-8 max-w-[1200px] mx-auto pb-6 lg:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
