import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Delete } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const allEmployees = useStore((s) => s.employees);
  const employees = useMemo(() => allEmployees.filter((e) => e.active), [allEmployees]);
  const loginEmployee = useStore((s) => s.loginEmployee);
  // Load only employees when the login page mounts (much faster than loadAllData)
  useEffect(() => {
    if (employees.length === 0) {
      useStore.getState().loadEmployees();
    }
  }, []);

  const [selectedId, setSelectedId] = useState(employees[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  // Update selectedId once employees load asynchronously
  useEffect(() => {
    if (!selectedId && employees.length > 0) {
      setSelectedId(employees[0].id);
    }
  }, [employees, selectedId]);

  useEffect(() => {
    const triggerLogin = async () => {
      if (pin.length === 4) {
        const ok = await loginEmployee(selectedId, pin);
        if (!ok) {
          setShake(true);
          setTimeout(() => { setShake(false); setPin(""); }, 600);
        } else {
          navigate({ to: "/stock" });
        }
      }
    };
    triggerLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, selectedId, loginEmployee]);

  const press = (d: string) => setPin((p) => (p.length < 4 ? p + d : p));
  const back = () => setPin((p) => p.slice(0, -1));

  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-[400px] card-surface" style={{ padding: "40px" }}>
        <div className="text-center mb-8">
          <div className="brand-name" style={{ fontSize: 28 }}>Boutique des Rêves</div>
          <div className="mt-2 text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>Espace employé</div>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#74367E" }}>
          Choisir un employé
        </label>
        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setPin(""); }}
          className="input-field mb-6"
        >
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <div className={`flex justify-center gap-3 mb-6 ${shake ? "animate-shake" : ""}`}>
          {[0,1,2,3].map((i) => (
            <span key={i}
              className="inline-block rounded-full"
              style={{
                width: 14, height: 14,
                background: pin.length > i ? "#74367E" : "transparent",
                border: "1.5px solid #74367E",
              }}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {keys.map((k, i) => k === "" ? <div key={i} /> : (
            <button
              key={i}
              onClick={() => k === "⌫" ? back() : press(k)}
              className="h-14 rounded-[10px] border text-xl font-normal transition-all hover:bg-[rgba(116,54,126,0.06)] active:bg-[#74367E] active:text-white"
              style={{ borderColor: "#E5E5E5" }}
            >
              {k === "⌫" ? <Delete className="inline w-5 h-5" /> : k}
            </button>
          ))}
        </div>

        <div className="text-center mt-4">
          <a href="/admin" className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>
            Espace administration
          </a>
        </div>
      </div>
    </div>
  );
}
