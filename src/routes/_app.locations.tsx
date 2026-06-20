import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, locReste, locVerse, type Location } from "@/lib/store";
import { formatDA, formatDate, today as todayStr, parseMachta, serializeMachta } from "@/lib/format";
import { Modal, Drawer, Badge, EmptyState } from "@/components/ui-kit";
import { Th, Td, FieldLabel } from "./_components/table";
import { Plus, Printer, Trash2, CalendarDays, Pencil, Check, X, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/** Get the effective price for an article in a location (custom override or default) */
function getArticlePrice(location: Location, articleId: string, defaultPrice: number): number {
  return location.articlePrices?.[articleId] ?? defaultPrice;
}

export const Route = createFileRoute("/_app/locations")({
  component: LocationsPage,
});

type Tab = "En cours" | "À venir" | "Rendues" | "En retard";
const TABS: Tab[] = ["En cours", "À venir", "Rendues", "En retard"];

function LocationsPage() {
  const locations = useStore((s) => s.locations);
  const clients = useStore((s) => s.clients);
  const articles = useStore((s) => s.articles);
  const pendingNew = useStore((s) => s.pendingNewLocationClientId);
  const pendingOpen = useStore((s) => s.pendingOpenLocationId);
  const setPendingNew = useStore((s) => s.setPendingNewLocation);
  const setPendingOpen = useStore((s) => s.setPendingOpenLocation);

  const [tab, setTab] = useState<Tab>("En cours");
  const [newOpen, setNewOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [prefillClient, setPrefillClient] = useState<string | null>(null);

  useEffect(() => {
    if (pendingNew) {
      setPrefillClient(pendingNew);
      setNewOpen(true);
      setPendingNew(null);
    }
  }, [pendingNew, setPendingNew]);

  useEffect(() => {
    if (pendingOpen) {
      setOpenId(pendingOpen);
      setPendingOpen(null);
    }
  }, [pendingOpen, setPendingOpen]);

  const filtered = locations.filter((l) => {
    if (tab === "Rendues") return l.status === "Rendue";
    return l.status === tab;
  });

  const openLoc = locations.find((l) => l.id === openId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Locations</h1>
        <button onClick={() => setNewOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nouvelle location
        </button>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: "#E5E5E5" }}>
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2.5 text-sm whitespace-nowrap"
              style={{
                color: active ? "#74367E" : "rgba(26,26,26,0.6)",
                fontWeight: active ? 600 : 400,
                borderBottom: active ? "2px solid #74367E" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-12 h-12" />} title={`Aucune location ${tab.toLowerCase()}`} />
      ) : (
        <div className="card-surface" style={{ padding: 0, overflow: "hidden" }}>
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E5E5", background: "#FAFAFA" }}>
                <Th>Client</Th><Th>Article(s)</Th><Th>Retrait</Th><Th>Retour prévu</Th><Th>Total</Th><Th>Reste</Th><Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const client = clients.find((c) => c.id === l.clientId);
                const machta = parseMachta(l.notes);
                const arts = articles.filter((a) => (l.articleIds ?? []).includes(a.id)).map((a) => a.name).join(", ") || (machta.active ? "Service Machta" : "Aucun");
                const reste = locReste(l);
                const overdue = l.status === "En retard";
                return (
                  <tr
                    key={l.id}
                    onClick={() => setOpenId(l.id)}
                    className="cursor-pointer hover:bg-[rgba(116,54,126,0.04)]"
                    style={{
                      borderBottom: "1px solid #E5E5E5",
                      borderLeft: overdue ? "3px solid #C0392B" : "3px solid transparent",
                    }}
                  >
                    <Td>{client?.name}</Td>
                    <Td>{arts}</Td>
                    <Td>{formatDate(l.pickupDate)}</Td>
                    <Td>{formatDate(l.returnDate)}</Td>
                    <Td>{formatDA(l.total)}</Td>
                    <Td style={{ color: reste > 0 ? "#74367E" : "rgba(26,26,26,0.45)", fontWeight: reste > 0 ? 500 : 400 }}>{formatDA(reste)}</Td>
                    <Td><Badge status={l.status} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="md:hidden divide-y" style={{ borderColor: "#E5E5E5" }}>
            {filtered.map((l) => {
              const client = clients.find((c) => c.id === l.clientId);
              const reste = locReste(l);
              return (
                <div key={l.id} onClick={() => setOpenId(l.id)} className="p-4 flex items-start justify-between gap-3"
                  style={{ borderLeft: l.status === "En retard" ? "3px solid #C0392B" : "3px solid transparent" }}>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{client?.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(26,26,26,0.55)" }}>
                      Retour {formatDate(l.returnDate)} · {formatDA(l.total)}
                    </div>
                    {reste > 0 && <div className="text-sm mt-1" style={{ color: "#74367E", fontWeight: 500 }}>Reste : {formatDA(reste)}</div>}
                  </div>
                  <Badge status={l.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {newOpen && <NewLocationModal open={newOpen} onClose={() => setNewOpen(false)} />}
      {openLoc && <LocationDetail location={openLoc} onClose={() => setOpenId(null)} />}
    </div>
  );
}

// ─── New location modal ──────────────────────────────────
function NewLocationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const articles = useStore((s) => s.articles);
  const addClient = useStore((s) => s.addClient);
  const addLocation = useStore((s) => s.addLocation);

  const [clientForm, setClientForm] = useState({ name: "", phone: "", address: "" });

  const [selArticles, setSelArticles] = useState<string[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [pickupDate, setPickupDate] = useState(todayStr());
  const [returnDate, setReturnDate] = useState(todayStr());
  const [occasion, setOccasion] = useState<"Mariage" | "Fiançailles" | "Cérémonie" | "Anniversaire" | "Autre">("Mariage");
  const [notes, setNotes] = useState("");
  const [initialPayment, setInitialPayment] = useState(0);
  const [err, setErr] = useState("");
  const [machtaActive, setMachtaActive] = useState(false);
  const [machtaPrice, setMachtaPrice] = useState(0);

  const totalArticles = articles.filter((a) => selArticles.includes(a.id)).reduce((s, a) => s + (customPrices[a.id] ?? a.price), 0);
  const total = totalArticles + (machtaActive ? machtaPrice : 0);
  const reste = Math.max(0, total - initialPayment);

  const submit = async () => {
    if (!clientForm.name.trim()) { setErr("Nom du client requis"); return; }
    if (selArticles.length === 0 && !machtaActive) { setErr("Sélectionnez au moins un article ou le service Machta"); return; }
    if (returnDate < pickupDate) { setErr("Date de retour avant la date de retrait"); return; }
    if (initialPayment > total) { setErr("Le versement dépasse le total"); return; }

    try {
      const client = await addClient({
        name: clientForm.name.trim(),
        phone: clientForm.phone.trim(),
        address: clientForm.address.trim(),
        mesures: "",
      });

      // Build articlePrices only if any custom prices were set
      const hasCustomPrices = selArticles.some((id) => customPrices[id] !== undefined);
      const articlePrices = hasCustomPrices ? Object.fromEntries(selArticles.map((id) => [id, customPrices[id] ?? articles.find((a) => a.id === id)!.price])) : undefined;
      await addLocation({
        clientId: client.id, articleIds: selArticles, articlePrices, pickupDate, returnDate, occasion,
        total, caution: 0, notes: serializeMachta(notes, machtaActive, machtaPrice), initialPayment,
      });
      onClose();
    } catch (e) {
      setErr("Erreur lors de la création de la location");
    }
  };

  const availableArts = articles.filter((a) => a.status === "Disponible" || selArticles.includes(a.id));

  return (
    <Modal
      open={open} onClose={onClose} title="Nouvelle location" size="lg"
      footer={<>
        <button onClick={onClose} className="btn-danger">Annuler</button>
        <button onClick={submit} className="btn-primary">Créer la location</button>
      </>}
    >
      <div className="space-y-6">
        {/* Step 1 */}
        <Section title="1. Client">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FieldLabel label="Nom complet"><input className="input-field" placeholder="Nom complet" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} /></FieldLabel>
            <FieldLabel label="Téléphone"><input className="input-field" placeholder="Téléphone (Optionnel)" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} /></FieldLabel>
            <FieldLabel label="Adresse"><input className="input-field" placeholder="Adresse (Optionnel)" value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} /></FieldLabel>
          </div>
        </Section>

        {/* Step 2 */}
        <Section title="2. Articles">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
            {availableArts.map((a) => {
              const sel = selArticles.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    if (sel) {
                      setSelArticles(selArticles.filter((x) => x !== a.id));
                      // Remove custom price when deselecting
                      const next = { ...customPrices };
                      delete next[a.id];
                      setCustomPrices(next);
                    } else {
                      setSelArticles([...selArticles, a.id]);
                    }
                  }}
                  className="text-left p-3 rounded-lg border transition-colors"
                  style={{
                    borderColor: sel ? "#74367E" : "#E5E5E5",
                    background: sel ? "rgba(116,54,126,0.06)" : "white",
                  }}
                >
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs" style={{ color: "#74367E" }}>{formatDA(a.price)}</div>
                </button>
              );
            })}
          </div>
          {selArticles.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-medium" style={{ color: "rgba(26,26,26,0.6)" }}>Prix par article (modifiable)</div>
              {selArticles.map((aid) => {
                const a = articles.find((x) => x.id === aid);
                if (!a) return null;
                return (
                  <div key={aid} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{a.name}</span>
                    <input
                      type="number"
                      className="input-field w-28 text-right"
                      value={customPrices[aid] ?? ""}
                      placeholder={a.price.toString()}
                      onChange={(e) => setCustomPrices({ ...customPrices, [aid]: +e.target.value || a.price })}
                      aria-label={`Prix ${a.name}`}
                    />
                    <span className="text-xs" style={{ color: "rgba(26,26,26,0.45)" }}>DA</span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Step 2b: Service */}
        <Section title="Service Additionnel">
          <div className="flex items-center gap-4 p-3 rounded-lg border bg-white" style={{ borderColor: machtaActive ? "#74367E" : "#E5E5E5" }}>
            <label className="flex items-center gap-2.5 cursor-pointer font-medium text-sm flex-1">
              <input
                type="checkbox"
                checked={machtaActive}
                onChange={(e) => {
                  setMachtaActive(e.target.checked);
                  if (e.target.checked && machtaPrice === 0) {
                    setMachtaPrice(5000);
                  }
                }}
                className="w-4 h-4 rounded text-[#74367E] focus:ring-[#74367E] border-gray-300"
                style={{ accentColor: "#74367E" }}
              />
              <span>Service Machta</span>
            </label>
            {machtaActive && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Prix :</span>
                <input
                  type="number"
                  className="input-field w-28 text-right"
                  value={machtaPrice || ""}
                  placeholder="0"
                  onChange={(e) => setMachtaPrice(Math.max(0, +e.target.value))}
                  aria-label="Prix Machta"
                />
                <span className="text-xs" style={{ color: "rgba(26,26,26,0.45)" }}>DA</span>
              </div>
            )}
          </div>
        </Section>

        {/* Step 3 */}
        <Section title="3. Détails">
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="Date de retrait"><input type="date" className="input-field" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} /></FieldLabel>
            <FieldLabel label="Date de retour"><input type="date" className="input-field" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} /></FieldLabel>
            <FieldLabel label="Occasion">
              <select className="input-field" value={occasion} onChange={(e) => setOccasion(e.target.value as any)}>
                <option>Mariage</option><option>Fiançailles</option><option>Cérémonie</option><option>Anniversaire</option><option>Autre</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Notes"><input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} /></FieldLabel>
          </div>
        </Section>

        {/* Step 4 */}
        <Section title="4. Paiement">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "rgba(26,26,26,0.6)" }}>Total calculé</span>
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, color: "#74367E" }}>{formatDA(total)}</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <FieldLabel label="Versement initial">
                <input type="number" className="input-field" value={initialPayment || ""} onChange={(e) => setInitialPayment(+e.target.value)} />
              </FieldLabel>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t" style={{ borderColor: "#E5E5E5" }}>
              <span style={{ color: "rgba(26,26,26,0.6)" }}>Reste à payer</span>
              <span style={{ color: "#74367E", fontWeight: 600 }}>{formatDA(reste)}</span>
            </div>
          </div>
        </Section>

        {err && <div className="text-sm" style={{ color: "#C0392B" }}>{err}</div>}
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="section-label mb-3">{title}</div>
      {children}
    </div>
  );
}

// ─── Editable article prices section ────────────────────
function LocationArticlesSection({ location, articles }: { location: Location; articles: { id: string; name: string; price: number }[] }) {
  const updateArticlePrices = useStore((s) => s.updateLocationArticlePrices);
  const isAdmin = useStore((s) => s.auth.role === "admin");

  const [editing, setEditing] = useState(false);
  const [draftPrices, setDraftPrices] = useState<Record<string, number>>({});

  const startEdit = () => {
    const init: Record<string, number> = {};
    articles.forEach((a) => {
      init[a.id] = getArticlePrice(location, a.id, a.price);
    });
    setDraftPrices(init);
    setEditing(true);
  };

  const save = () => {
    updateArticlePrices(location.id, draftPrices);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  const machta = parseMachta(location.notes);

  return (
    <Section title="Articles">
      <ul className="space-y-2">
        {articles.map((a) => {
          const price = editing ? draftPrices[a.id] : getArticlePrice(location, a.id, a.price);
          const isCustom = (location.articlePrices?.[a.id] ?? undefined) !== undefined;
          return (
            <li key={a.id} className="flex items-center justify-between text-sm py-2 border-b" style={{ borderColor: "#E5E5E5" }}>
              <span className="flex items-center gap-2">
                {a.name}
                {isCustom && !editing && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(116,54,126,0.1)", color: "#74367E" }}>personnalisé</span>}
              </span>
              {editing ? (
                <input
                  type="number"
                  className="input-field w-28 text-right"
                  value={draftPrices[a.id] ?? ""}
                  placeholder={a.price.toString()}
                  onChange={(e) => setDraftPrices({ ...draftPrices, [a.id]: +e.target.value || a.price })}
                  aria-label={`Prix ${a.name}`}
                />
              ) : (
                <span style={{ color: "#74367E" }}>{formatDA(price)}</span>
              )}
            </li>
          );
        })}
        {machta.active && (
          <li className="flex items-center justify-between text-sm py-2 border-b" style={{ borderColor: "#E5E5E5" }}>
            <span className="flex items-center gap-2">
              Service Machta
            </span>
            <span style={{ color: "#74367E" }}>{formatDA(machta.price)}</span>
          </li>
        )}
      </ul>
      {isAdmin && (
        <div className="flex items-center justify-end gap-2 mt-3">
          {editing ? (
            <>
              <button onClick={cancel} className="btn-ghost flex items-center gap-1" style={{ padding: "4px 12px", fontSize: 12 }}>
                <X className="w-3.5 h-3.5" /> Annuler
              </button>
              <button onClick={save} className="btn-primary flex items-center gap-1" style={{ padding: "4px 12px", fontSize: 12 }}>
                <Check className="w-3.5 h-3.5" /> Enregistrer
              </button>
            </>
          ) : (
            <button onClick={startEdit} className="btn-ghost flex items-center gap-1" style={{ padding: "4px 12px", fontSize: 12 }}>
              <Pencil className="w-3.5 h-3.5" /> Modifier les prix
            </button>
          )}
        </div>
      )}
    </Section>
  );
}

// ─── Edit location modal (admin only) ────────────────────
function EditLocationModal({ location, onClose }: { location: Location; onClose: () => void }) {
  const updateLocation = useStore((s) => s.updateLocation);
  const articles = useStore((s) => s.articles);

  const [pickupDate, setPickupDate] = useState(location.pickupDate);
  const [returnDate, setReturnDate] = useState(location.returnDate);
  const [occasion, setOccasion] = useState(location.occasion);
  const [notes, setNotes] = useState(location.notes ?? "");
  const [total, setTotal] = useState(location.total);
  const [err, setErr] = useState("");

  const machta = parseMachta(location.notes);

  const submit = async () => {
    if (returnDate < pickupDate) { setErr("Date de retour avant la date de retrait"); return; }
    if (total <= 0) { setErr("Le total doit être supérieur à 0"); return; }

    await updateLocation(location.id, {
      pickupDate,
      returnDate,
      occasion,
      notes: serializeMachta(notes, machta.active, machta.price),
      total,
    });
    toast.success("Location mise à jour");
    onClose();
  };

  return (
    <Modal
      open={true} onClose={onClose} title="Modifier la location" size="lg"
      footer={<>
        <button onClick={onClose} className="btn-ghost">Annuler</button>
        <button onClick={submit} className="btn-primary">Enregistrer</button>
      </>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Date de retrait">
            <input type="date" className="input-field" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
          </FieldLabel>
          <FieldLabel label="Date de retour">
            <input type="date" className="input-field" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </FieldLabel>
          <FieldLabel label="Occasion">
            <select className="input-field" value={occasion} onChange={(e) => setOccasion(e.target.value)}>
              <option>Mariage</option><option>Fiançailles</option><option>Cérémonie</option><option>Anniversaire</option><option>Autre</option>
            </select>
          </FieldLabel>
          <FieldLabel label="Total (DA)">
            <input type="number" className="input-field" value={total} onChange={(e) => setTotal(+e.target.value || 0)} />
          </FieldLabel>
        </div>
        <FieldLabel label="Notes">
          <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FieldLabel>
        {err && <div className="text-sm" style={{ color: "#C0392B" }}>{err}</div>}
      </div>
    </Modal>
  );
}

// ─── Location detail drawer ──────────────────────────────
function LocationDetail({ location, onClose }: { location: Location; onClose: () => void }) {
  const clients = useStore((s) => s.clients);
  const articles = useStore((s) => s.articles);
  const addVersement = useStore((s) => s.addVersement);
  const deleteVersement = useStore((s) => s.deleteVersement);
  const markReturned = useStore((s) => s.markReturned);
  const saveContract = useStore((s) => s.saveContract);
  const deleteLocation = useStore((s) => s.deleteLocation);
  const updateLocation = useStore((s) => s.updateLocation);
  const isAdmin = useStore((s) => s.auth.role === "admin");

  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(todayStr());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const client = clients.find((c) => c.id === location.clientId);
  const arts = articles.filter((a) => (location.articleIds ?? []).includes(a.id));
  const reste = locReste(location);

  const submitPay = () => {
    if (payAmount <= 0 || payAmount > reste) return;
    addVersement(location.id, { date: payDate, amount: payAmount, type: payAmount === reste ? "Solde" : "Versement" });
    setPayOpen(false);
    setPayAmount(0);
  };

  const handleDelete = async () => {
    await deleteLocation(location.id);
    toast.success("Location supprimée");
    onClose();
  };

  return (
    <Drawer
      open={true} onClose={onClose}
      title={`Location · ${client?.name ?? ""}`}
      footer={<button onClick={onClose} className="btn-ghost">Fermer</button>}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Badge status={location.status} />
          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="cursor-pointer p-1.5 rounded-md hover:bg-[rgba(116,54,126,0.08)] transition-colors"
                  style={{ color: "#74367E" }}
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="cursor-pointer p-1.5 rounded-md hover:bg-[rgba(192,57,43,0.08)] transition-colors"
                  style={{ color: "#C0392B" }}
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => {
                saveContract(location.id);
                toast.success("Contrat sauvegardé avec succès !");
              }}
              className="cursor-pointer p-1.5 rounded-md hover:bg-[rgba(116,54,126,0.08)] transition-colors"
              style={{ color: "#74367E" }}
              title="Sauvegarder contrat"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="cursor-pointer p-1.5 rounded-md hover:bg-[rgba(116,54,126,0.08)] transition-colors"
              style={{ color: "#74367E" }}
              title="Imprimer le contrat"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        <LocationArticlesSection location={location} articles={arts} />

        <Section title="Dates & occasion">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>Retrait</div><div>{formatDate(location.pickupDate)}</div></div>
            <div><div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>Retour prévu</div><div>{formatDate(location.returnDate)}</div></div>
            <div><div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>Occasion</div><div>{location.occasion}</div></div>
            {location.actualReturnDate && <div><div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>Retour réel</div><div>{formatDate(location.actualReturnDate)}</div></div>}
          </div>
        </Section>

        <div className="card-surface" style={{ padding: 20 }}>
          <div className="section-label mb-3">Paiements</div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span>Total</span>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20 }}>{formatDA(location.total)}</span>
          </div>
          <div className="space-y-1 mb-3">
            {(location.versements ?? []).length === 0 && <div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>Aucun versement</div>}
            {(location.versements ?? []).map((v) => (
              <div key={v.id} className="flex items-center justify-between text-sm py-1.5">
                <span style={{ color: "rgba(26,26,26,0.7)" }}>{formatDate(v.date)} · {v.type}</span>
                <span className="flex items-center gap-2">
                  {formatDA(v.amount)}
                  {isAdmin && (
                    <button onClick={() => deleteVersement(location.id, v.id)} aria-label="Supprimer" style={{ color: "rgba(26,26,26,0.4)" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm pt-3 border-t" style={{ borderColor: "#E5E5E5" }}>
            <span>Reste à payer</span>
            <span style={{ color: "#74367E", fontWeight: 600 }}>{formatDA(reste)}</span>
          </div>
          <button onClick={() => setPayOpen(true)} className="btn-primary w-full justify-center mt-4" disabled={reste === 0}>
            <Plus className="w-4 h-4" /> Enregistrer un versement
          </button>
        </div>

        {location.status !== "Rendue" && (
          <button
            onClick={() => { const d = prompt("Date de retour ?", todayStr()); if (d) markReturned(location.id, d); }}
            className="btn-ghost w-full justify-center"
          >
            Marquer comme rendu
          </button>
        )}
      </div>

      <Modal
        open={payOpen} onClose={() => setPayOpen(false)} title="Nouveau versement" size="sm"
        footer={<>
          <button onClick={() => setPayOpen(false)} className="btn-danger">Annuler</button>
          <button onClick={submitPay} className="btn-primary">Enregistrer</button>
        </>}
      >
        <div className="space-y-4">
          <FieldLabel label={`Montant (max ${formatDA(reste)})`}>
            <input type="number" className="input-field" value={payAmount || ""} onChange={(e) => setPayAmount(+e.target.value)} max={reste} />
          </FieldLabel>
          <FieldLabel label="Date">
            <input type="date" className="input-field" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </FieldLabel>
        </div>
      </Modal>

      {/* Confirm delete modal */}
      <Modal
        open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Supprimer la location" size="sm"
        footer={<>
          <button onClick={() => setConfirmDelete(false)} className="btn-ghost">Annuler</button>
          <button onClick={handleDelete} className="btn-danger">Supprimer</button>
        </>}
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <AlertTriangle className="w-10 h-10" style={{ color: "#C0392B" }} />
          <p className="text-sm" style={{ color: "rgba(26,26,26,0.7)" }}>
            Êtes-vous sûr de vouloir supprimer cette location ? Cette action est irréversible.
          </p>
        </div>
      </Modal>

      {/* Edit location modal */}
      {editOpen && (
        <EditLocationModal
          location={location}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Print contract — visible only when printing */}
      <div className="print-area" style={{ display: "none" }}>
        <PrintContract location={location} />
      </div>
      <style>{`@media print { .print-area { display: block !important; } }`}</style>
    </Drawer>
  );
}

function PrintContract({ location }: { location: Location }) {
  const clients = useStore((s) => s.clients);
  const articles = useStore((s) => s.articles);
  const client = clients.find((c) => c.id === location.clientId);
  const arts = articles.filter((a) => (location.articleIds ?? []).includes(a.id));
  const verse = locVerse(location);
  const reste = locReste(location);
  const machta = parseMachta(location.notes);

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", color: "#1A1A1A", fontSize: 13, lineHeight: 1.4, height: "100%", position: "relative", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", paddingBottom: 12, borderBottom: "2px solid #74367E" }}>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: 26, color: "#74367E", letterSpacing: "0.15em" }}>
          Boutique des Rêves
        </div>
        <div style={{ fontSize: 11, marginTop: 2, color: "rgba(26,26,26,0.6)" }}>Contrat de location</div>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Client :</strong> {client?.name}<br />
        <strong>Téléphone :</strong> {client?.phone}<br />
        {client?.address && <><strong>Adresse :</strong> {client.address}<br /></>}
      </div>

      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #E5E5E5" }}>
            <th style={{ textAlign: "left", padding: "6px 8px" }}>Article</th>
            <th style={{ textAlign: "right", padding: "6px 8px" }}>Prix</th>
          </tr>
        </thead>
        <tbody>
          {arts.map((a) => (
            <tr key={a.id} style={{ borderBottom: "1px solid #E5E5E5" }}>
              <td style={{ padding: "6px 8px" }}>{a.name}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{formatDA(getArticlePrice(location, a.id, a.price))}</td>
            </tr>
          ))}
          {machta.active && (
            <tr style={{ borderBottom: "1px solid #E5E5E5" }}>
              <td style={{ padding: "6px 8px" }}>Service Machta</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{formatDA(machta.price)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 16 }}>
        <div>Retrait : {formatDate(location.pickupDate)}</div>
        <div>Retour prévu : {formatDate(location.returnDate)}</div>
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #E5E5E5", borderRadius: 8, textAlign: "center" }}>
        <div>Total : <strong>{formatDA(location.total)}</strong></div>
        <div>Versé : {formatDA(verse)}</div>
        <div>Reste : <strong style={{ color: "#74367E" }}>{formatDA(reste)}</strong></div>
      </div>

      <div style={{ marginTop: 32 }}>
        Signature client : _________________________   Date : ___/___/______
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: 10, textAlign: "center", color: "rgba(26,26,26,0.55)", lineHeight: 1.5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <span>Les versements effectués ne sont pas remboursables. · Pièce d'identité obligatoire.</span>
          <span style={{ color: "rgba(26,26,26,0.3)" }}>|</span>
          <span dir="rtl">المبالغ المدفوعة غير قابلة للاسترداد. · بطاقة الهوية إجبارية.</span>
        </div>
        <div style={{ marginTop: 8, borderTop: "1px solid #E5E5E5", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
            </svg>
            <strong style={{ fontWeight: 600 }}>boutique_des_reves_</strong>
          </span>
          <span style={{ color: "rgba(26,26,26,0.3)" }}>·</span>
          <span>Contact : 0774 22 39 50</span>
        </div>
      </div>
    </div>
  );
}
