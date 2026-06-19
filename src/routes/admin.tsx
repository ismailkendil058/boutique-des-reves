import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const loginAdmin = useStore((s) => s.loginAdmin);
  const loginDemo = useStore((s) => s.loginAdminDemo);
  const role = useStore((s) => s.auth.role);
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (role === "admin") navigate({ to: "/dashboard" });
    else if (role === "employee") navigate({ to: "/stock" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await loginAdmin(pwd);
    if (!ok) { setErr(true); setTimeout(() => setErr(false), 1200); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-[400px] card-surface" style={{ padding: "40px" }}>
        <div className="text-center mb-8">
          <div className="brand-name" style={{ fontSize: 28 }}>Boutique des Rêves</div>
          <div className="mt-2 text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>Administration</div>
        </div>

        <form onSubmit={submit}>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#74367E" }}>
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className={`input-field pr-12 ${err ? "animate-shake" : ""}`}
              style={err ? { borderColor: "#C0392B" } : undefined}
              placeholder="••••••••"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "#74367E" }}
              aria-label={show ? "Masquer" : "Afficher"}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button type="submit" className="btn-primary w-full justify-center mt-6">
            Accéder
          </button>
        </form>

        <div className="text-center mt-6">
          <button onClick={loginDemo} className="text-[13px] font-medium" style={{ color: "#74367E" }}>
            Accès démo admin →
          </button>
        </div>

        <div className="text-center mt-4">
          <a href="/login" className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>
            Espace employé
          </a>
        </div>
      </div>
    </div>
  );
}
