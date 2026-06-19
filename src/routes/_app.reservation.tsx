import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Reservation } from "@/lib/store";
import { formatDA, formatDate, today as todayStr } from "@/lib/format";
import { Modal, Drawer, Badge, EmptyState } from "@/components/ui-kit";
import { Th, Td, FieldLabel } from "./_components/table";
import { Plus, Trash2, BookMarked, CheckCircle } from "lucide-react";
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

      {reservations.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="w-12 h-12" />}
          title="Aucune réservation en attente"
          cta="+ Nouvelle réservation"
          onCta={() => setNewOpen(true)}
        />
      ) : (
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
              {reservations.map((r) => {
                const client = clients.find((c) => c.id === r.clientId);
                const arts = articles.filter((a) => r.articleIds.includes(a.id)).map((a) => a.name).join(", ");
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
            {reservations.map((r) => {
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
      )}

      {newOpen && <NewReservationModal open={newOpen} onClose={() => setNewOpen(false)} />}
      {openRes && <ReservationDetail reservation={openRes} onClose={() => setOpenRes(null)} />}
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
  const [err, setErr] = useState("");

  const total = articles.filter((a) => selArticles.includes(a.id)).reduce((s, a) => s + (customPrices[a.id] ?? a.price), 0);

  const submit = async () => {
    if (!clientForm.name.trim()) { setErr("Nom du client requis"); return; }
    if (selArticles.length === 0) { setErr("Sélectionnez au moins un article"); return; }
    if (returnDate < pickupDate) { setErr("Date de retour avant la date de retrait"); return; }

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

      await addReservation({ clientId: client.id, articleIds: selArticles, articlePrices, pickupDate, returnDate, occasion, total, caution: 0, notes });
      toast.success("Réservation créée !");
      onClose();
    } catch (e) {
      setErr("Erreur lors de la création de la réservation");
    }
  };

  const availableArts = articles.filter((a) => a.status === "Disponible" || selArticles.includes(a.id));

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

        {/* Articles */}
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
                      value={customPrices[aid] ?? ""} placeholder={a.price.toString()}
                      onChange={(e) => setCustomPrices({ ...customPrices, [aid]: +e.target.value || a.price })}
                    />
                    <span className="text-xs" style={{ color: "rgba(26,26,26,0.45)" }}>DA</span>
                  </div>
                );
              })}
            </div>
          )}
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

        {/* Payment summary (no initial payment for reservations) */}
        <Section title="4. Récapitulatif">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "rgba(26,26,26,0.6)" }}>Total calculé</span>
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, color: "#74367E" }}>{formatDA(total)}</span>
            </div>
          </div>
        </Section>

        {err && <div className="text-sm" style={{ color: "#C0392B" }}>{err}</div>}
      </div>
    </Modal>
  );
}

// ─── Reservation detail drawer ────────────────────────────
function ReservationDetail({ reservation, onClose }: { reservation: Reservation; onClose: () => void }) {
  const clients = useStore((s) => s.clients);
  const articles = useStore((s) => s.articles);
  const deleteReservation = useStore((s) => s.deleteReservation);
  const validateReservation = useStore((s) => s.validateReservation);
  const isAdmin = useStore((s) => s.auth.role === "admin");

  const [validateOpen, setValidateOpen] = useState(false);
  const [initialPayment, setInitialPayment] = useState(0);

  const client = clients.find((c) => c.id === reservation.clientId);
  const arts = articles.filter((a) => reservation.articleIds.includes(a.id));

  const doValidate = () => {
    if (initialPayment > reservation.total) return;
    validateReservation(reservation.id, initialPayment);
    toast.success("Réservation validée — location créée !");
    setValidateOpen(false);
    onClose();
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
              onClick={() => setValidateOpen(true)}
              className="text-sm flex items-center gap-1.5 cursor-pointer"
              style={{ color: "#27AE60", fontWeight: 500 }}
            >
              <CheckCircle className="w-4 h-4" /> Valider → Location
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
          {reservation.notes && (
            <div className="mt-3 text-sm pt-3 border-t" style={{ borderColor: "#E5E5E5", color: "rgba(26,26,26,0.65)" }}>
              Notes : {reservation.notes}
            </div>
          )}
        </div>

        {/* Client info */}
        <Section title="Client">
          <div className="text-sm space-y-1">
            <div><strong>{client?.name}</strong></div>
            <div style={{ color: "rgba(26,26,26,0.6)" }}>{client?.phone}</div>
            {client?.address && <div style={{ color: "rgba(26,26,26,0.6)" }}>{client.address}</div>}
          </div>
        </Section>
      </div>

      {/* Validate modal */}
      <Modal
        open={validateOpen} onClose={() => setValidateOpen(false)} title="Valider la réservation" size="sm"
        footer={<>
          <button onClick={() => setValidateOpen(false)} className="btn-danger">Annuler</button>
          <button onClick={doValidate} className="btn-primary flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Confirmer → Location
          </button>
        </>}
      >
        <div className="space-y-4 py-2">
          <p className="text-sm" style={{ color: "rgba(26,26,26,0.7)" }}>
            Cette réservation sera convertie en location active. Vous pouvez enregistrer un versement initial optionnel.
          </p>
          <FieldLabel label={`Versement initial (max ${formatDA(reservation.total)})`}>
            <input
              type="number" className="input-field"
              value={initialPayment || ""}
              placeholder="0"
              max={reservation.total}
              onChange={(e) => setInitialPayment(Math.min(+e.target.value, reservation.total))}
            />
          </FieldLabel>
        </div>
      </Modal>
    </Drawer>
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
