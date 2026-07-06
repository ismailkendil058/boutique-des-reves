import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Reservation } from "@/lib/store";
import { formatDA, formatDate, today as todayStr, parseMachta, serializeMachta } from "@/lib/format";
import { Modal, Drawer, Badge, EmptyState } from "@/components/ui-kit";
import { Th, Td, FieldLabel } from "./_components/table";
import { Plus, Trash2, BookMarked, CheckCircle, Search, CreditCard, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reservation")({
  component: ReservationPage,
});

/** Get effective article price (custom or default) */
function getResArticlePrice(res: Reservation, articleId: string, defaultPrice: number): number {
  return res.articlePrices?.[articleId] ?? defaultPrice;
}

// ─── Main page ───────────────────────────────────────────
function ReservationPage() {
  const reservations = useStore((s) => s.reservations);
  const clients = useStore((s) => s.clients);
  const articles = useStore((s) => s.articles);

  const [reservationSearch, setReservationSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [openRes, setOpenRes] = useState<Reservation | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Réservations</h1>
        <button onClick={() => setNewOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nouvelle réservation
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(26,26,26,0.4)" }} />
        <input
          className="input-field w-full pl-9"
          placeholder="Rechercher par client ou article..."
          value={reservationSearch}
          onChange={(e) => setReservationSearch(e.target.value)}
        />
      </div>

      {(() => {
        const q = reservationSearch.trim().toLowerCase();
        const visible = q ? reservations.filter((r) => {
          const client = clients.find((c) => c.id === r.clientId);
          const machta = parseMachta(r.notes);
          const arts = articles.filter((a) => (r.articleIds ?? []).includes(a.id)).map((a) => a.name).join(", ");
          const hay = `${client?.name ?? ""} ${arts} ${machta.active ? "Service Machta" : ""}`.toLowerCase();
          return hay.includes(q);
        }) : reservations;

        if (visible.length === 0) {
          return (
            <EmptyState
              icon={<BookMarked className="w-12 h-12" />}
              title={q ? "Aucun résultat" : "Aucune réservation en attente"}
              cta="+ Nouvelle réservation"
              onCta={() => setNewOpen(true)}
            />
          );
        }

        return (
          <div className="card-surface" style={{ padding: 0, overflow: "hidden" }}>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "2px solid #E5E5E5", background: "#FAFAFA" }}>
                  <Th>Client</Th>
                  <Th>Article(s)</Th>
                  <Th>Retrait prévu</Th>
                  <Th>Retour prévu</Th>
                  <Th>Total</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const client = clients.find((c) => c.id === r.clientId);
                  const machta = parseMachta(r.notes);
                  const arts = articles.filter((a) => (r.articleIds ?? []).includes(a.id)).map((a) => a.name).join(", ") || (machta.active ? "Service Machta" : "Aucun");
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setOpenRes(r)}
                      className="cursor-pointer hover:bg-[rgba(116,54,126,0.04)]"
                      style={{ borderBottom: "1px solid #E5E5E5", borderLeft: "3px solid #D4820A" }}
                    >
                      <Td>{client?.name}</Td>
                      <Td>{arts}</Td>
                      <Td>{formatDate(r.pickupDate)}</Td>
                      <Td>{formatDate(r.returnDate)}</Td>
                      <Td>{formatDA(r.total)}</Td>
                      <Td><Badge status="En attente" /></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "#E5E5E5" }}>
              {visible.map((r) => {
                const client = clients.find((c) => c.id === r.clientId);
                return (
                  <div
                    key={r.id}
                    onClick={() => setOpenRes(r)}
                    className="p-4 flex items-start justify-between gap-3"
                    style={{ borderLeft: "3px solid #D4820A" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{client?.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(26,26,26,0.55)" }}>
                        Retrait {formatDate(r.pickupDate)} · {formatDA(r.total)}
                      </div>
                    </div>
                    <Badge status="En attente" />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {newOpen && <NewReservationModal open={newOpen} onClose={() => setNewOpen(false)} />}
      {openRes && <ReservationDetail reservationId={openRes.id} onClose={() => setOpenRes(null)} />}
    </div>
  );
}

// ─── New reservation modal ────────────────────────────────
function NewReservationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const articles = useStore((s) => s.articles);
  const addClient = useStore((s) => s.addClient);
  const addReservation = useStore((s) => s.addReservation);

  const [clientForm, setClientForm] = useState({ name: "", phone: "", address: "" });

  const [selArticles, setSelArticles] = useState<string[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [pickupDate, setPickupDate] = useState(todayStr());
  const [returnDate, setReturnDate] = useState(todayStr());
  const [occasion, setOccasion] = useState<"Mariage" | "Fiançailles" | "Cérémonie" | "Anniversaire" | "Autre">("Mariage");
  const [notes, setNotes] = useState("");
  const [articleSearch, setArticleSearch] = useState("");
  const [err, setErr] = useState("");
  const [machtaActive, setMachtaActive] = useState(false);
  const [machtaPrice, setMachtaPrice] = useState(0);
  const [versement, setVersement] = useState<number | "">("");
  const [caution, setCaution] = useState<number | "">("");

  const totalArticles = articles.filter((a) => selArticles.includes(a.id)).reduce((s, a) => s + (customPrices[a.id] ?? a.price), 0);
  const total = totalArticles + (machtaActive ? machtaPrice : 0);

  const submit = async () => {
    if (!clientForm.name.trim()) { setErr("Nom du client requis"); return; }
    if (selArticles.length === 0 && !machtaActive) { setErr("Sélectionnez au moins un article ou le service Machta"); return; }
    if (returnDate < pickupDate) { setErr("Date de retour avant la date de retrait"); return; }
    if (!versement || Number(versement) <= 0) { setErr("Le versement doit être supérieur à 0 DA"); return; }

    try {
      const client = await addClient({
        name: clientForm.name.trim(),
        phone: clientForm.phone.trim(),
        address: clientForm.address.trim(),
        mesures: "",
      });

      const hasCustomPrices = selArticles.some((id) => customPrices[id] !== undefined);
      const articlePrices = hasCustomPrices
        ? Object.fromEntries(selArticles.map((id) => [id, customPrices[id] ?? articles.find((a) => a.id === id)!.price]))
        : undefined;

      await addReservation({ clientId: client.id, articleIds: selArticles, articlePrices, pickupDate, returnDate, occasion, total, caution: Number(caution) || 0, versement: Number(versement), versements: [], notes: serializeMachta(notes, machtaActive, machtaPrice) });
      toast.success("Réservation créée !");
      onClose();
    } catch (e) {
      setErr("Erreur lors de la création de la réservation");
    }
  };

  const availableArts = articles.filter((a) => a.status === "Disponible").filter((a) => !articleSearch.trim() || a.name.toLowerCase().includes(articleSearch.toLowerCase()));

  return (
    <Modal
      open={open} onClose={onClose} title="Nouvelle réservation" size="lg"
      footer={<>
        <button onClick={onClose} className="btn-danger">Annuler</button>
        <button onClick={submit} className="btn-primary">Créer la réservation</button>
      </>}
    >
      <div className="space-y-6">
        {/* Client */}
        <Section title="1. Client">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FieldLabel label="Nom complet"><input className="input-field" placeholder="Nom complet" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} /></FieldLabel>
            <FieldLabel label="Téléphone"><input className="input-field" placeholder="Téléphone (Optionnel)" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} /></FieldLabel>
            <FieldLabel label="Adresse"><input className="input-field" placeholder="Adresse (Optionnel)" value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} /></FieldLabel>
          </div>
        </Section>

        {/* Articles - Tenues */}
        <Section title="2.1. Tenues">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(26,26,26,0.4)" }} />
            <input
              className="input-field w-full pl-9"
              placeholder="Rechercher une tenue..."
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
            {availableArts.filter((a) => a.category === "Tenues").map((a) => {
              const sel = selArticles.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    if (sel) {
                      setSelArticles(selArticles.filter((x) => x !== a.id));
                      const next = { ...customPrices }; delete next[a.id]; setCustomPrices(next);
                    } else {
                      setSelArticles([...selArticles, a.id]);
                    }
                  }}
                  className="text-left p-3 rounded-lg border transition-colors"
                  style={{ borderColor: sel ? "#74367E" : "#E5E5E5", background: sel ? "rgba(116,54,126,0.06)" : "white" }}
                >
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs" style={{ color: "#74367E" }}>{formatDA(a.price)}</div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Articles - Accessoires */}
        <Section title="2.2. Accessoires">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
            {availableArts.filter((a) => a.category === "Accessoires" || a.category === "Autre").map((a) => {
              const sel = selArticles.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    if (sel) {
                      setSelArticles(selArticles.filter((x) => x !== a.id));
                      const next = { ...customPrices }; delete next[a.id]; setCustomPrices(next);
                    } else {
                      setSelArticles([...selArticles, a.id]);
                    }
                  }}
                  className="text-left p-3 rounded-lg border transition-colors"
                  style={{ borderColor: sel ? "#74367E" : "#E5E5E5", background: sel ? "rgba(116,54,126,0.06)" : "white" }}
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
                      type="number" className="input-field w-28 text-right"
                      value={customPrices[aid] ?? a.price} placeholder={a.price.toString()}
                      onChange={(e) => setCustomPrices({ ...customPrices, [aid]: +e.target.value || a.price })}
                    />
                    <span className="text-xs" style={{ color: "rgba(26,26,26,0.45)" }}>DA</span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Service */}
        <Section title="Service Additionnel">
          <div className="flex items-center gap-4 p-3 rounded-lg border bg-white" style={{ borderColor: machtaActive ? "#74367E" : "#E5E5E5" }}>
            <label className="flex items-center gap-2.5 cursor-pointer font-medium text-sm flex-1">
              <input
                type="checkbox"
                checked={machtaActive}
                onChange={(e) => {
                  setMachtaActive(e.target.checked);
                  if (e.target.checked && machtaPrice === 0) {
                    setMachtaPrice(15000);
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

        {/* Dates */}
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

        {/* Versement (mandatory > 0) */}
        <Section title="4. Versement">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldLabel label="Versement">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input-field flex-1"
                  placeholder="Versement minimum : 1 DA"
                  value={versement}
                  min={1}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setVersement(val);
                  }}
                />
                <span className="text-xs" style={{ color: "rgba(26,26,26,0.45)" }}>DA</span>
              </div>
            </FieldLabel>
            <FieldLabel label="Caution">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input-field flex-1"
                  placeholder="Caution (Optionnel)"
                  value={caution}
                  min={0}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setCaution(val);
                  }}
                />
                <span className="text-xs" style={{ color: "rgba(26,26,26,0.45)" }}>DA</span>
              </div>
            </FieldLabel>
          </div>
        </Section>

        {/* Payment summary */}
        <Section title="5. Récapitulatif">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "rgba(26,26,26,0.6)" }}>Total calculé</span>
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, color: "#74367E" }}>{formatDA(total)}</span>
            </div>
            {versement !== "" && Number(versement) > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "rgba(26,26,26,0.6)" }}>Reste à payer</span>
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: "#D4820A" }}>{formatDA(total - Number(versement))}</span>
              </div>
            )}
          </div>
        </Section>

        {err && <div className="text-sm" style={{ color: "#C0392B" }}>{err}</div>}
      </div>
    </Modal>
  );
}

// ─── Reservation detail drawer ────────────────────────────
function ReservationDetail({ reservationId, onClose }: { reservationId: string; onClose: () => void }) {
  const navigate = useNavigate();
  const reservation = useStore((s) => s.reservations.find((r) => r.id === reservationId))!;
  const clients = useStore((s) => s.clients);
  const articles = useStore((s) => s.articles);
  const deleteReservation = useStore((s) => s.deleteReservation);
  const validateReservation = useStore((s) => s.validateReservation);
  const addReservationVersement = useStore((s) => s.addReservationVersement);
  const deleteReservationVersement = useStore((s) => s.deleteReservationVersement);
  const isAdmin = useStore((s) => s.auth.role === "admin");

  const [versementOpen, setVersementOpen] = useState(false);
  const [newVersementAmount, setNewVersementAmount] = useState<number | "">("");

  if (!reservation) return null;

  const client = clients.find((c) => c.id === reservation.clientId);
  const arts = articles.filter((a) => (reservation.articleIds ?? []).includes(a.id));
  const machta = parseMachta(reservation.notes);
  const reservationVersements = reservation.versements ?? [];
  const totalAdditionalVersements = reservationVersements.reduce((sum, v) => sum + Number(v.amount ?? 0), 0);
  const totalVerse = Number(reservation.versement ?? 0) + totalAdditionalVersements;
  const reste = reservation.total - totalVerse;

  const doValidate = async () => {
    if (totalVerse < reservation.total) {
      toast.error(`Le total des versements (${formatDA(totalVerse)}) doit être égal au total (${formatDA(reservation.total)}) pour valider.`);
      return;
    }
    await validateReservation(reservation.id, reservation.total);
    toast.success("Réservation validée — location créée !");
    onClose();
    navigate({ to: "/locations" });
  };

  const doAddVersement = async () => {
    if (!newVersementAmount || Number(newVersementAmount) <= 0) {
      toast.error("Le versement doit être supérieur à 0 DA");
      return;
    }
    await addReservationVersement(reservation.id, {
      date: todayStr(),
      amount: Number(newVersementAmount),
      type: "Versement",
    });
    toast.success("Versement ajouté !");
    setVersementOpen(false);
    setNewVersementAmount("");
  };

  return (
    <Drawer
      open={true} onClose={onClose}
      title={`Réservation · ${client?.name ?? ""}`}
      footer={<button onClick={onClose} className="btn-ghost">Fermer</button>}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Badge status="En attente" />
          <div className="flex items-center gap-3">
            <button
              onClick={doValidate}
              className="text-sm flex items-center gap-1.5 cursor-pointer"
              style={{ color: "#27AE60", fontWeight: 500 }}
            >
              <CheckCircle className="w-4 h-4" /> Valider → Location
            </button>
            <button
              onClick={() => window.print()}
              className="cursor-pointer p-1.5 rounded-md hover:bg-[rgba(116,54,126,0.08)] transition-colors"
              style={{ color: "#74367E" }}
              title="Imprimer le contrat de réservation"
            >
              <Printer className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  if (confirm("Supprimer cette réservation ?")) {
                    deleteReservation(reservation.id);
                    toast.success("Réservation supprimée.");
                    onClose();
                  }
                }}
                className="text-sm flex items-center gap-1.5 cursor-pointer"
                style={{ color: "#C0392B" }}
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            )}
          </div>
        </div>

        {/* Articles */}
        <Section title="Articles">
          <ul className="space-y-2">
            {arts.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm py-2 border-b" style={{ borderColor: "#E5E5E5" }}>
                <span>{a.name}</span>
                <span style={{ color: "#74367E" }}>{formatDA(getResArticlePrice(reservation, a.id, a.price))}</span>
              </li>
            ))}
            {machta.active && (
              <li className="flex items-center justify-between text-sm py-2 border-b" style={{ borderColor: "#E5E5E5" }}>
                <span>Service Machta</span>
                <span style={{ color: "#74367E" }}>{formatDA(machta.price)}</span>
              </li>
            )}
          </ul>
        </Section>

        {/* Dates */}
        <Section title="Dates & occasion">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>Retrait prévu</div><div>{formatDate(reservation.pickupDate)}</div></div>
            <div><div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>Retour prévu</div><div>{formatDate(reservation.returnDate)}</div></div>
            <div><div className="text-xs" style={{ color: "rgba(26,26,26,0.55)" }}>Occasion</div><div>{reservation.occasion}</div></div>
          </div>
        </Section>

        {/* Payment info */}
        <div className="card-surface" style={{ padding: 20 }}>
          <div className="section-label mb-3">Récapitulatif</div>
          <div className="flex items-center justify-between text-sm">
            <span>Total</span>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20 }}>{formatDA(reservation.total)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span style={{ color: "rgba(26,26,26,0.6)" }}>Versement initial</span>
            <span style={{ color: "#27AE60" }}>{formatDA(reservation.versement)}</span>
          </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span style={{ color: "rgba(26,26,26,0.6)" }}>Total versements</span>
              <span style={{ color: "#27AE60" }}>{formatDA(totalAdditionalVersements)}</span>
            </div>
          <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t" style={{ borderColor: "#E5E5E5" }}>
            <span style={{ fontWeight: 600 }}>Reste à payer</span>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: reste > 0 ? "#D4820A" : "#27AE60" }}>{formatDA(reste)}</span>
          </div>
          {machta.cleanNotes && (
            <div className="mt-3 text-sm pt-3 border-t" style={{ borderColor: "#E5E5E5", color: "rgba(26,26,26,0.65)" }}>
              Notes : {machta.cleanNotes}
            </div>
          )}
        </div>

        {/* Versement history */}
        <Section title="Historique des versements">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm" style={{ color: "rgba(26,26,26,0.6)" }}>
              {reservationVersements.length} versement(s) — {formatDA(totalVerse)} versé(s)
            </div>
            <button
              onClick={() => setVersementOpen(true)}
              className="text-sm flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg"
              style={{ color: "#74367E", border: "1px solid #74367E", fontWeight: 500 }}
            >
              <CreditCard className="w-4 h-4" /> Ajouter un versement
            </button>
          </div>
          {reservationVersements.length === 0 ? (
            <div className="text-sm py-3" style={{ color: "rgba(26,26,26,0.45)" }}>Aucun versement enregistré</div>
          ) : (
            <ul className="space-y-2">
              {reservationVersements.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm py-2 border-b" style={{ borderColor: "#E5E5E5" }}>
                  <div>
                    <span style={{ color: "rgba(26,26,26,0.6)" }}>{formatDate(v.date)}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded" style={{ background: "rgba(116,54,126,0.08)", color: "#74367E" }}>{v.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "#27AE60", fontWeight: 500 }}>{formatDA(v.amount)}</span>
                      <button
                        onClick={() => {
                          if (confirm("Supprimer ce versement ?")) {
                            deleteReservationVersement(reservation.id, v.id);
                            toast.success("Versement supprimé.");
                          }
                        }}
                        className="cursor-pointer"
                        style={{ color: "#C0392B" }}
                        title="Supprimer le versement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Client info */}
        <Section title="Client">
          <div className="text-sm space-y-1">
            <div><strong>{client?.name}</strong></div>
            <div style={{ color: "rgba(26,26,26,0.6)" }}>{client?.phone}</div>
            {client?.address && <div style={{ color: "rgba(26,26,26,0.6)" }}>{client.address}</div>}
          </div>
        </Section>
      </div>

      {/* Print reservation contract — visible only when printing */}
      <div className="print-area" style={{ display: "none" }}>
        <PrintReservationContract reservation={reservation} />
      </div>
      <style>{`@media print { .print-area { display: block !important; } }`}</style>

      {/* Add versement modal */}
      <Modal
        open={versementOpen} onClose={() => setVersementOpen(false)} title="Ajouter un versement" size="sm"
        footer={<>
          <button onClick={() => setVersementOpen(false)} className="btn-danger">Annuler</button>
          <button onClick={doAddVersement} className="btn-primary flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" /> Enregistrer
          </button>
        </>}
      >
        <div className="space-y-4 py-2">
          <FieldLabel label="Montant (DA)">
            <input
              type="number"
              className="input-field"
              value={newVersementAmount || ""}
              placeholder="Montant"
              min={1}
              onChange={(e) => setNewVersementAmount(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </FieldLabel>
        </div>
      </Modal>
    </Drawer>
  );
}

function PrintReservationContract({ reservation }: { reservation: Reservation }) {
  const clients = useStore((s) => s.clients);
  const articles = useStore((s) => s.articles);
  const client = clients.find((c) => c.id === reservation.clientId);
  const arts = articles.filter((a) => (reservation.articleIds ?? []).includes(a.id));
  const machta = parseMachta(reservation.notes);
  const reservationVersements = reservation.versements ?? [];
  const totalAdditionalVersements = reservationVersements.reduce((sum, v) => sum + Number(v.amount ?? 0), 0);
  const totalVerse = Number(reservation.versement ?? 0) + totalAdditionalVersements;
  const reste = reservation.total - totalVerse;

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", color: "#1A1A1A", fontSize: 13, lineHeight: 1.4, height: "100%", position: "relative", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", paddingBottom: 12, borderBottom: "2px solid #74367E" }}>
        <div style={{ fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: 26, color: "#74367E", letterSpacing: "0.15em" }}>
          Boutique des Rêves
        </div>
        <div style={{ fontSize: 11, marginTop: 2, color: "rgba(26,26,26,0.6)" }}>Contrat de réservation</div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap", fontSize: 11, color: "#000000" }}>
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
          <span>·</span>
          <span>Contact : 0774 22 39 50</span>
        </div>
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
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{formatDA(getResArticlePrice(reservation, a.id, a.price))}</td>
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
        <div>Retrait prévu : {formatDate(reservation.pickupDate)}</div>
        <div>Retour prévu : {formatDate(reservation.returnDate)}</div>
        <div>Occasion : {reservation.occasion}</div>
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #E5E5E5", borderRadius: 8, textAlign: "center" }}>
        <div>Total : <strong>{formatDA(reservation.total)}</strong></div>
        <div>Versé : {formatDA(totalVerse)}</div>
        <div>Reste : <strong style={{ color: "#74367E" }}>{formatDA(reste)}</strong></div>
        {reservation.caution > 0 && <div>Caution : <strong>{formatDA(reservation.caution)}</strong></div>}
      </div>

      <div style={{ marginTop: 32 }}>
        Signature client : _________________________   Date : {formatDate(reservation.pickupDate)}
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, fontSize: 11, textAlign: "center", color: "#000000", lineHeight: 1.5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          <span>Les versements effectués ne sont pas remboursables. · Pièce d'identité obligatoire.</span>
          <span style={{ color: "#000000" }}>|</span>
          <span dir="rtl" style={{ color: "#000000" }}>العربون لا يرد و بطاقة الهوية اجبارية.</span>
        </div>
      </div>
    </div>
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