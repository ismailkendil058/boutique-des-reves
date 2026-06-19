import { createFileRoute } from "@tanstack/react-router";
import { useStore, locReste, locVerse } from "@/lib/store";
import { formatDA } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const locations = useStore((s) => s.locations);
  const articles = useStore((s) => s.articles);
  const clients = useStore((s) => s.clients);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeLocs = locations.filter((l) => l.status === "En cours" || l.status === "En retard");
  const monthRevenue = locations.flatMap((l) => l.versements).filter((v) => new Date(v.date) >= monthStart).reduce((s, v) => s + v.amount, 0);
  const totalReste = locations.reduce((s, l) => s + locReste(l), 0);
  const available = articles.filter((a) => a.status === "Disponible").length;

  const overdue = locations.filter((l) => l.status === "En retard");

  // Locations per month — last 6 months
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = locations.filter((l) => new Date(l.createdAt) >= d && new Date(l.createdAt) < next).length;
    months.push({ label: d.toLocaleDateString("fr-FR", { month: "short" }), count });
  }

  const byCategory = ["Tenues", "Accessoires"].map((cat) => ({
    name: cat,
    value: articles.filter((a) => a.category === cat).length,
  }));
  const COLORS = ["#74367E", "#E5E5E5"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Tableau de bord</h1>
        <div className="text-[13px] mt-1" style={{ color: "rgba(26,26,26,0.55)" }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Locations actives" value={activeLocs.length.toString()} />
        <KPI label="CA du mois" value={formatDA(monthRevenue)} />
        <KPI label="Restes à percevoir" value={formatDA(totalReste)} />
        <KPI label="Articles disponibles" value={available.toString()} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-surface">
          <div className="section-label mb-4">Locations par mois</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={months}>
                <XAxis dataKey="label" stroke="#E5E5E5" tick={{ fill: "#1A1A1A", fontSize: 12 }} />
                <YAxis stroke="#E5E5E5" tick={{ fill: "#1A1A1A", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(116,54,126,0.06)" }} />
                <Bar dataKey="count" fill="#74367E" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-surface">
          <div className="section-label mb-4">Répartition des articles</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            {byCategory.map((c, i) => (
              <span key={c.name} className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS[i] }} />
                {c.name} ({c.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="card-surface">
          <div className="section-label mb-4">Retours en retard</div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E5E5" }}>
                <th className="text-left py-2 px-2 font-semibold uppercase text-xs tracking-wider">Client</th>
                <th className="text-left py-2 px-2 font-semibold uppercase text-xs tracking-wider">Articles</th>
                <th className="text-left py-2 px-2 font-semibold uppercase text-xs tracking-wider">Retard</th>
                <th className="text-left py-2 px-2 font-semibold uppercase text-xs tracking-wider">Reste dû</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((l) => {
                const client = clients.find((c) => c.id === l.clientId);
                const arts = articles.filter((a) => l.articleIds.includes(a.id)).map((a) => a.name).join(", ");
                const days = Math.floor((Date.now() - new Date(l.returnDate).getTime()) / 86400000);
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid #E5E5E5" }}>
                    <td className="py-3 px-2">{client?.name}</td>
                    <td className="py-3 px-2">{arts}</td>
                    <td className="py-3 px-2">{days} j</td>
                    <td className="py-3 px-2" style={{ color: "#74367E", fontWeight: 500 }}>{formatDA(locReste(l))}</td>
                    <td className="py-3 px-2"><a href={`tel:${client?.phone}`} style={{ color: "#74367E" }}>Contacter</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface">
      <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#74367E", lineHeight: 1.1 }}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider mt-2" style={{ color: "rgba(26,26,26,0.55)" }}>{label}</div>
    </div>
  );
}
