import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Article, type Category, type ArticleStatus, type Reservation } from "@/lib/store";
import { formatDA, formatDate } from "@/lib/format";
import { Drawer, Badge, EmptyState, Modal } from "@/components/ui-kit";
import { Plus, MoreVertical, Package } from "lucide-react";

export const Route = createFileRoute("/_app/stock")({
  component: StockPage,
});

const CATS: ("Tous" | Category)[] = ["Tous", "Tenues", "Accessoires"];
const STATUSES: ("Tous" | ArticleStatus)[] = ["Tous", "Disponible", "Loué", "En entretien"];

function StockPage() {
  const articles = useStore((s) => s.articles);
  const addArticle = useStore((s) => s.addArticle);
  const updateArticle = useStore((s) => s.updateArticle);
  const deleteArticle = useStore((s) => s.deleteArticle);
  const reservations = useStore((s) => s.reservations);
  const clients = useStore((s) => s.clients);

  const [cat, setCat] = useState<typeof CATS[number]>("Tous");
  const [stat, setStat] = useState<typeof STATUSES[number]>("Tous");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const filtered = articles.filter((a) => (cat === "Tous" || a.category === cat) && (stat === "Tous" || a.status === stat));

  const openCreate = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (a: Article) => { setEditing(a); setDrawerOpen(true); setMenuFor(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Stock</h1>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Ajouter un article</button>
      </div>

      <div className="space-y-3">
        <PillRow items={CATS} value={cat} onChange={setCat as any} />
        <PillRow items={STATUSES} value={stat} onChange={setStat as any} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="Aucun article pour l'instant"
          cta="+ Ajouter un article"
          onCta={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((a) => (
            <div key={a.id} className="card-surface" style={{ padding: 16 }} onClick={() => {
                const res = reservations.find(r => r.articleIds.includes(a.id));
                setSelectedReservation(res || null);
                setInfoOpen(true);
              }}>
              <div
                className="rounded-lg mb-3 flex items-center justify-center text-white"
                style={{
                  aspectRatio: "4/3",
                  background: a.photo ?? "#74367E",
                  fontFamily: "Cormorant Garamond, serif",
                  fontStyle: "italic",
                  fontSize: 32,
                }}
              >
                {a.name[0]}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[15px] truncate">{a.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(26,26,26,0.55)" }}>
                    {a.category}{a.size ? ` · ${a.size}` : ""}{a.color ? ` · ${a.color}` : ""}
                  </div>
                </div>
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === a.id ? null : a.id); }} className="p-1 -mr-1" aria-label="Menu">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuFor === a.id && (
                    <div className="absolute right-0 top-7 z-10 bg-white border rounded-lg shadow-lg w-44 py-1" style={{ borderColor: "#E5E5E5" }}>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(a); }} className="w-full text-left px-3 py-2 text-sm hover:bg-[rgba(116,54,126,0.04)]">Modifier</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateArticle(a.id, { status: a.status === "En entretien" ? "Disponible" : "En entretien" }); setMenuFor(null); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[rgba(116,54,126,0.04)]"
                      >
                        {a.status === "En entretien" ? "Marquer disponible" : "Marquer indisponible"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm("Supprimer cet article ?")) deleteArticle(a.id); setMenuFor(null); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[rgba(116,54,126,0.04)]"
                        style={{ color: "#C0392B" }}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3" style={{ fontSize: 16, fontWeight: 500, color: "#74367E" }}>{formatDA(a.price)}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(26,26,26,0.55)" }}>Caution : {formatDA(a.caution)}</div>
              <div className="mt-3 flex justify-end"><Badge status={a.status} /></div>
            </div>
          ))}
        </div>
      )}

      <ArticleDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        article={editing}
        onSave={(data) => {
          if (editing) updateArticle(editing.id, data);
          else addArticle(data);
          setDrawerOpen(false);
        }}
      />
      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title={selectedReservation ? "Réservation" : "Disponibilité"}>
        {selectedReservation ? (
          <div className="space-y-4">
            <div><strong>Client:</strong> {clients.find(c => c.id === selectedReservation.clientId)?.name ?? "Inconnu"}</div>
            <div><strong>Période:</strong> {formatDate(selectedReservation.pickupDate)} → {formatDate(selectedReservation.returnDate)}</div>
          </div>
        ) : (
          <div>Ce produit n'est pas réservé.</div>
        )}
      </Modal>
    </div>
  );
}

function PillRow<T extends string>({ items, value, onChange }: { items: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((it) => {
        const active = it === value;
        return (
          <button
            key={it}
            onClick={() => onChange(it)}
            className="pill whitespace-nowrap transition-colors"
            style={{
              background: active ? "#74367E" : "transparent",
              color: active ? "white" : "rgba(26,26,26,0.6)",
              border: active ? "1px solid #74367E" : "1px solid #E5E5E5",
              padding: "6px 14px",
              fontSize: 13,
            }}
          >
            {it}
          </button>
        );
      })}
    </div>
  );
}

function ArticleDrawer(props: {
  open: boolean; onClose: () => void; article: Article | null;
  onSave: (data: Omit<Article, "id">) => void;
}) {
  if (!props.open) return null;
  return <ArticleDrawerInner {...props} key={props.article?.id ?? "new"} />;
}

function ArticleDrawerInner({ open, onClose, article, onSave }: {
  open: boolean; onClose: () => void; article: Article | null;
  onSave: (data: Omit<Article, "id">) => void;
}) {
  const PURPLES = ["#74367E", "#9B5BA5", "#B884C0", "#D4B0D9", "#5E2A66"];
  const [form, setForm] = useState<Omit<Article, "id">>(() => article ?? {
    name: "", category: "Tenues" as Category, size: "", color: "", price: 0, caution: 0,
    status: "Disponible" as ArticleStatus, notes: "",
    photo: PURPLES[Math.floor(Math.random() * PURPLES.length)],
  });



  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={article ? "Modifier l'article" : "Nouvel article"}
      footer={
        <>
          <button onClick={onClose} className="btn-danger">Annuler</button>
          <button onClick={() => onSave(form)} className="btn-primary">Enregistrer</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nom">
          <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie">
            <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
              <option>Tenues</option><option>Accessoires</option>
            </select>
          </Field>
          <Field label="État">
            <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ArticleStatus })}>
              <option>Disponible</option><option>Loué</option><option>En entretien</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Taille"><input className="input-field" value={form.size ?? ""} onChange={(e) => setForm({ ...form, size: e.target.value })} /></Field>
          <Field label="Couleur"><input className="input-field" value={form.color ?? ""} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix location (DA)"><input type="number" className="input-field" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></Field>
          <Field label="Caution (DA)"><input type="number" className="input-field" value={form.caution} onChange={(e) => setForm({ ...form, caution: +e.target.value })} /></Field>
        </div>
        <Field label="Notes">
          <textarea className="input-field" rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </div>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#74367E" }}>{label}</span>
      {children}
    </label>
  );
}
