import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore, locReste, locVerse } from "@/lib/store";
import { formatDA, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui-kit";
import { Th, Td } from "./_app.clients";
import { ArrowLeft, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/clients/$id")({
  component: ClientDetail,
  notFoundComponent: () => <div className="p-8">Client introuvable.</div>,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const setPending = useStore((s) => s.setPendingNewLocation);
  const setPendingOpen = useStore((s) => s.setPendingOpenLocation);
  const client = useStore((s) => s.clients.find((c) => c.id === id));
  const allLocations = useStore((s) => s.locations);
  const locations = useMemo(() => allLocations.filter((l) => l.clientId === id), [allLocations, id]);
  const articles = useStore((s) => s.articles);


  if (!client) return <div>Client introuvable.</div>;

  const totalEncaisse = locations.reduce((s, l) => s + locVerse(l), 0);
  const totalReste = locations.reduce((s, l) => s + locReste(l), 0);

  return (
    <div className="space-y-6">
      <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "#74367E" }}>
        <ArrowLeft className="w-4 h-4" /> Retour aux clients
      </Link>

      <div className="card-surface">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, fontWeight: 500 }}>{client.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Chip>{client.phone}</Chip>
              {client.address && <Chip>{client.address}</Chip>}
              {client.mesures && <Chip>Mesures : {client.mesures}</Chip>}
            </div>
          </div>
          <button onClick={() => { setPending(id); nav({ to: "/locations" }); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nouvelle location
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Locations totales" value={locations.length.toString()} />
        <Stat label="Total encaissé" value={formatDA(totalEncaisse)} />
        <Stat label="Reste à percevoir" value={formatDA(totalReste)} highlight={totalReste > 0} />
      </div>

      <div className="card-surface" style={{ padding: 0 }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#E5E5E5" }}>
          <div className="section-label">Historique des locations</div>
        </div>
        {locations.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "rgba(26,26,26,0.55)" }}>Aucune location pour ce client.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E5E5", background: "#FAFAFA" }}>
                <Th>Article</Th><Th>Retrait</Th><Th>Retour</Th><Th>Total</Th><Th>Versé</Th><Th>Reste</Th><Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {locations.map((l) => {
                const arts = articles.filter((a) => l.articleIds.includes(a.id)).map((a) => a.name).join(", ");
                const reste = locReste(l);
                return (
                  <tr key={l.id} onClick={() => { setPendingOpen(l.id); nav({ to: "/locations" }); }} className="cursor-pointer hover:bg-[rgba(116,54,126,0.04)]" style={{ borderBottom: "1px solid #E5E5E5" }}>
                    <Td>{arts}</Td>
                    <Td>{formatDate(l.pickupDate)}</Td>
                    <Td>{formatDate(l.actualReturnDate ?? l.returnDate)}</Td>
                    <Td>{formatDA(l.total)}</Td>
                    <Td>{formatDA(locVerse(l))}</Td>
                    <Td style={{ color: reste > 0 ? "#74367E" : "rgba(26,26,26,0.45)", fontWeight: reste > 0 ? 500 : 400 }}>{formatDA(reste)}</Td>
                    <Td><Badge status={l.status} /></Td>
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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="pill" style={{ background: "rgba(116,54,126,0.10)", color: "#74367E" }}>{children}</span>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card-surface">
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, color: highlight ? "#74367E" : "#1A1A1A" }}>{value}</div>
      <div className="text-xs uppercase tracking-wider mt-2" style={{ color: "rgba(26,26,26,0.55)" }}>{label}</div>
    </div>
  );
}
