import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, locReste } from "@/lib/store";
import { formatDA, formatDate, parseMachta } from "@/lib/format";
import { Th, Td } from "./_components/table";

export const Route = createFileRoute("/_app/caisse")({
  component: CaissePage,
});

const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const thisMonthStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 7); // "YYYY-MM"
};

const firstDayOfThisMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-01`;
};

function CaissePage() {
  const locations = useStore((s) => s.locations);
  const clients = useStore((s) => s.clients);
  const articles = useStore((s) => s.articles);

  const [filterMode, setFilterMode] = useState<"day" | "month" | "period">("month");
  const [selectedDay, setSelectedDay] = useState(todayStr());
  const [selectedMonth, setSelectedMonth] = useState(thisMonthStr());
  const [startDate, setStartDate] = useState(firstDayOfThisMonthStr());
  const [endDate, setEndDate] = useState(todayStr());

  const { start, end } = useMemo(() => {
    try {
      if (filterMode === "day" && selectedDay) {
        const start = new Date(selectedDay + "T00:00:00");
        const end = new Date(selectedDay + "T23:59:59.999");
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) return { start, end };
      } else if (filterMode === "month" && selectedMonth) {
        const parts = selectedMonth.split("-").map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const [year, month] = parts;
          const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
          const end = new Date(year, month, 0, 23, 59, 59, 999);
          return { start, end };
        }
      } else if (filterMode === "period" && startDate && endDate) {
        const start = new Date(startDate + "T00:00:00");
        const end = new Date(endDate + "T23:59:59.999");
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) return { start, end };
      }
    } catch (e) {
      console.error(e);
    }
    return { start: new Date(0), end: new Date(9999, 11, 31) };
  }, [filterMode, selectedDay, selectedMonth, startDate, endDate]);

  const allVersements = useMemo(() => {
    return locations.flatMap((l) => (l.versements ?? []).map((v) => ({ ...v, location: l })))
      .filter((v) => { const d = new Date(v.date); return d >= start && d <= end; })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [locations, start, end]);

  const periodTotal = allVersements.reduce((s, v) => s + v.amount, 0);
  const restesPercevoir = locations.reduce((s, l) => s + locReste(l), 0);

  const periodLabel = useMemo(() => {
    if (filterMode === "day") return `le ${selectedDay}`;
    if (filterMode === "month") return `en ${selectedMonth}`;
    return `du ${startDate} au ${endDate}`;
  }, [filterMode, selectedDay, selectedMonth, startDate, endDate]);

  return (
    <div className="space-y-6">
      <h1 className="page-title">Caisse</h1>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-2 border-b" style={{ borderColor: "#E5E5E5" }}>
        {/* Mode Selector */}
        <div className="flex gap-2">
          {([
            { id: "day", label: "Par Jour" },
            { id: "month", label: "Par Mois" },
            { id: "period", label: "Par Période" }
          ] as const).map((m) => {
            const active = filterMode === m.id;
            return (
              <button key={m.id} onClick={() => setFilterMode(m.id)} className="pill cursor-pointer"
                style={{
                  background: active ? "#74367E" : "transparent",
                  color: active ? "white" : "rgba(26,26,26,0.6)",
                  border: active ? "1px solid #74367E" : "1px solid #E5E5E5",
                  padding: "6px 14px", fontSize: 13,
                }}>
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Filter Inputs depending on Mode */}
        <div className="flex gap-3 items-center w-full md:w-auto">
          {filterMode === "day" && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[rgba(26,26,26,0.55)]">Date :</span>
              <input type="date" className="input-field max-w-[200px]" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} aria-label="Date" />
            </div>
          )}
          {filterMode === "month" && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[rgba(26,26,26,0.55)]">Mois :</span>
              <input type="month" className="input-field max-w-[200px]" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} aria-label="Mois" />
            </div>
          )}
          {filterMode === "period" && (
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[rgba(26,26,26,0.55)]">Du :</span>
                <input type="date" className="input-field max-w-[160px]" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Date de début" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[rgba(26,26,26,0.55)]">Au :</span>
                <input type="date" className="input-field max-w-[160px]" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="Date de fin" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label={`Encaissé ${periodLabel}`} value={formatDA(periodTotal)} />
        <Stat label="Restes à percevoir" value={formatDA(restesPercevoir)} />
        <Stat label="Nombre de versements" value={String(allVersements.length)} />
      </div>

      <div className="card-surface" style={{ padding: 0 }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E5E5E5" }}>
          <div className="section-label">Versements sur la période</div>
          <div className="text-sm" style={{ color: "#74367E", fontWeight: 600 }}>Total : {formatDA(periodTotal)}</div>
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
                const machta = parseMachta(v.location.notes);
                const arts = articles.filter((a) => (v.location.articleIds ?? []).includes(a.id)).map((a) => a.name).join(", ") || (machta.active ? "Service Machta" : "Aucun");
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
