import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard, Package, Users, CalendarDays, Wallet, UserCog, LogOut, FileText, BookMarked,
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

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t flex justify-around" style={{ borderColor: "#E5E5E5" }}>
        {items.slice(0, 5).map((item) => {
          const active = path.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center py-2 text-[11px]"
              style={{ color: active ? "#74367E" : "rgba(26,26,26,0.6)" }}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#E5E5E5" }}>
          <div className="brand-name" style={{ fontSize: 18 }}>Boutique des Rêves</div>
          <button onClick={handleLogout} aria-label="Déconnexion" style={{ color: "#74367E" }}>
            <LogOut className="w-5 h-5" />
          </button>
        </header>
        <div className="p-6 lg:p-8 max-w-[1200px] mx-auto pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
