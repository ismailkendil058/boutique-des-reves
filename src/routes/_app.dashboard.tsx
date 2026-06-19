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

  const overdue = locations.filter((l) => l.status === "En retard");

  // Locations per month — last 6 months
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = locations.filter((l) => new Date(l.createdAt) >= d && new Date(l.createdAt) < next).length;
    months.push({ label: d.toLocaleDateString("fr-FR", { month: "short" }), count });
  }

  // Calculate top 5 most located products
  const articleCounts = locations.reduce((acc, l) => {
    (l.articleIds ?? []).forEach((aid) => {
      acc[aid] = (acc[aid] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topProducts = Object.entries(articleCounts)
    .map(([id, count]) => {
      const art = articles.find((a) => a.id === id);
      return {
        id,
        name: art?.name ?? "Article inconnu",
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Tableau de bord</h1>
        <div className="text-[13px] mt-1" style={{ color: "rgba(26,26,26,0.55)" }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
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
        <div className="card-surface flex flex-col justify-between" style={{ minHeight: 300 }}>
          <div className="section-label mb-4">Top 5 des articles les plus loués</div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {topProducts.length === 0 ? (
              <div className="text-sm text-center py-8" style={{ color: "rgba(26,26,26,0.5)" }}>Aucune location enregistrée</div>
            ) : (
              topProducts.map((p, idx) => {
                const maxCount = topProducts[0]?.count || 1;
                const pct = Math.round((p.count / maxCount) * 100);
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{idx + 1}. {p.name}</span>
                      <span className="font-semibold" style={{ color: "#74367E" }}>{p.count} locations</span>
                    </div>
                    <div className="w-full bg-[rgba(26,26,26,0.06)] rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "#74367E" }} />
                    </div>
                  </div>
                );
              })
            )}
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


