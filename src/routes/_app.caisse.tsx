import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, locReste } from "@/lib/store";
import { formatDA, formatDate } from "@/lib/format";
import { Th, Td } from "./_app.clients";

export const Route = createFileRoute("/_app/caisse")({
  component: CaissePage,
});

type Range = "today" | "week" | "month" | "all";

function CaissePage() {
  const locations = useStore((s) => s.locations);
  const clients = useStore((s) => s.clients);
  const articles = useStore((s) => s.articles);
  const [range, setRange] = useState<Range>("month");

  const { start, end } = useMemo(() => {
    const now = new Date();
    const end = new Date(); end.setHours(23, 59, 59, 999);
    let start = new Date(0);
    if (range === "today") { start = new Date(now); start.setHours(0,0,0,0); }
    else if (range === "week") { start = new Date(now); start.setDate(now.getDate() - 7); }
    else if (range === "month") { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    return { start, end };
  }, [range]);

  const allVersements = useMemo(() => {
    return locations.flatMap((l) => l.versements.map((v) => ({ ...v, location: l })))
      .filter((v) => { const d = new Date(v.date); return d >= start && d <= end; })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [locations, start, end]);

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const encaisseToday = locations.flatMap((l) => l.versements).filter((v) => new Date(v.date) >= todayStart).reduce((s, v) => s + v.amount, 0);
  const encaisseMonth = locations.flatMap((l) => l.versements).filter((v) => new Date(v.date) >= monthStart).reduce((s, v) => s + v.amount, 0);
  const restesPercevoir = locations.reduce((s, l) => s + locReste(l), 0);
  const cautionsEnCours = locations.filter((l) => l.status !== "Rendue" || !l.cautionReturned).reduce((s, l) => s + l.caution, 0);

  const totalRange = allVersements.reduce((s, v) => s + v.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="page-title">Caisse</h1>

      <div className="flex gap-2 flex-wrap">
        {(["today","week","month","all"] as Range[]).map((r) => {
          const labels = { today: "Aujourd'hui", week: "Cette semaine", month: "Ce mois", all: "Tout" };
          const active = r === range;
          return (
            <button key={r} onClick={() => setRange(r)} className="pill"
              style={{
                background: active ? "#74367E" : "transparent",
                color: active ? "white" : "rgba(26,26,26,0.6)",
                border: active ? "1px solid #74367E" : "1px solid #E5E5E5",
                padding: "6px 14px", fontSize: 13,
              }}>
              {labels[r]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Encaissé aujourd'hui" value={formatDA(encaisseToday)} />
        <Stat label="Encaissé ce mois" value={formatDA(encaisseMonth)} />
        <Stat label="Restes à percevoir" value={formatDA(restesPercevoir)} />
        <Stat label="Cautions en cours" value={formatDA(cautionsEnCours)} />
      </div>

      <div className="card-surface" style={{ padding: 0 }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E5E5E5" }}>
          <div className="section-label">Versements sur la période</div>
          <div className="text-sm" style={{ color: "#74367E", fontWeight: 600 }}>Total : {formatDA(totalRange)}</div>
        </div>
        {allVersements.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "rgba(26,26,26,0.55)" }}>Aucun versement sur cette période.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E5E5", background: "#FAFAFA" }}>
                <Th>Date</Th><Th>Client</Th><Th>Article(s)</Th><Th>Type</Th><Th>Montant</Th>
              </tr>
            </thead>
            <tbody>
              {allVersements.map((v) => {
                const client = clients.find((c) => c.id === v.location.clientId);
                const arts = articles.filter((a) => v.location.articleIds.includes(a.id)).map((a) => a.name).join(", ");
                return (
                  <tr key={v.id} style={{ borderBottom: "1px solid #E5E5E5" }}>
                    <Td>{formatDate(v.date)}</Td>
                    <Td>{client?.name}</Td>
                    <Td>{arts}</Td>
                    <Td>{v.type}</Td>
                    <Td style={{ color: "#74367E", fontWeight: 500 }}>{formatDA(v.amount)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface">
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 26, color: "#74367E" }}>{value}</div>
      <div className="text-xs uppercase tracking-wider mt-2" style={{ color: "rgba(26,26,26,0.55)" }}>{label}</div>
    </div>
  );
}
