import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, locReste, locVerse } from "@/lib/store";
import { formatDA, formatDate } from "@/lib/format";
import { Modal, EmptyState } from "@/components/ui-kit";
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const clients = useStore((s) => s.clients);
  const locations = useStore((s) => s.locations);
  const addClient = useStore((s) => s.addClient);
  const updateClient = useStore((s) => s.updateClient);
  const deleteClient = useStore((s) => s.deleteClient);
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", mesures: "" });

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "", mesures: "" });

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q),
  );

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    addClient(form);
    setForm({ name: "", phone: "", address: "", mesures: "" });
    setOpen(false);
  };

  const openEdit = (e: React.MouseEvent, c: { id: string; name: string; phone: string; address?: string; mesures?: string }) => {
    e.stopPropagation();
    setEditId(c.id);
    setEditForm({ name: c.name, phone: c.phone, address: c.address ?? "", mesures: c.mesures ?? "" });
    setEditOpen(true);
  };

  const submitEdit = () => {
    if (!editId || !editForm.name.trim() || !editForm.phone.trim()) return;
    updateClient(editId, { name: editForm.name, phone: editForm.phone, address: editForm.address, mesures: editForm.mesures });
    setEditOpen(false);
    setEditId(null);
  };

  const openDelete = (e: React.MouseEvent, c: { id: string; name: string }) => {
    e.stopPropagation();
    setDeleteId(c.id);
    setDeleteName(c.name);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteClient(deleteId);
    setDeleteOpen(false);
    setDeleteId(null);
    setDeleteName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Clients</h1>
        <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nouveau client</button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(26,26,26,0.4)" }} />
        <input
          className="input-field pl-10"
          placeholder="Rechercher par nom ou téléphone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-12 h-12" />} title="Aucun client trouvé" cta="+ Nouveau client" onCta={() => setOpen(true)} />
      ) : (
        <div className="card-surface" style={{ padding: 0 }}>
          {/* Desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "2px solid #E5E5E5", background: "#FAFAFA" }}>
                <Th>Nom</Th><Th>Téléphone</Th><Th>Locations</Th><Th>Reste total dû</Th><Th>Dernière location</Th><Th style={{ textAlign: "right" }}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const cLocs = locations.filter((l) => l.clientId === c.id);
                const totalDu = cLocs.reduce((s, l) => s + locReste(l), 0);
                const last = cLocs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                return (
                  <tr
                    key={c.id}
                    onClick={() => nav({ to: "/clients/$id", params: { id: c.id } })}
                    className="cursor-pointer transition-colors hover:bg-[rgba(116,54,126,0.04)]"
                    style={{ borderBottom: "1px solid #E5E5E5" }}
                  >
                    <Td>{c.name}</Td>
                    <Td>{c.phone}</Td>
                    <Td>{cLocs.length}</Td>
                    <Td style={{ color: totalDu > 0 ? "#74367E" : "rgba(26,26,26,0.45)", fontWeight: totalDu > 0 ? 500 : 400 }}>
                      {formatDA(totalDu)}
                    </Td>
                    <Td>{last ? formatDate(last.createdAt) : "—"}</Td>
                    <Td style={{ textAlign: "right" }}>
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => openEdit(e, c)} className="p-1.5 rounded-lg hover:bg-[rgba(116,54,126,0.10)] transition-colors" title="Modifier">
                          <Pencil className="w-4 h-4" style={{ color: "#74367E" }} />
                        </button>
                        <button onClick={(e) => openDelete(e, c)} className="p-1.5 rounded-lg hover:bg-[rgba(192,57,43,0.10)] transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4" style={{ color: "#C0392B" }} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Mobile cards */}
          <div className="md:hidden divide-y" style={{ borderColor: "#E5E5E5" }}>
            {filtered.map((c) => {
              const cLocs = locations.filter((l) => l.clientId === c.id);
              const totalDu = cLocs.reduce((s, l) => s + locReste(l), 0);
              return (
                <div key={c.id} className="p-4">
                  <div onClick={() => nav({ to: "/clients/$id", params: { id: c.id } })} className="cursor-pointer">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(26,26,26,0.55)" }}>{c.phone} · {cLocs.length} location(s)</div>
                    {totalDu > 0 && <div className="text-sm mt-1" style={{ color: "#74367E", fontWeight: 500 }}>Reste : {formatDA(totalDu)}</div>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={(e) => openEdit(e, c)} className="p-1.5 rounded-lg hover:bg-[rgba(116,54,126,0.10)] transition-colors" title="Modifier">
                      <Pencil className="w-4 h-4" style={{ color: "#74367E" }} />
                    </button>
                    <button onClick={(e) => openDelete(e, c)} className="p-1.5 rounded-lg hover:bg-[rgba(192,57,43,0.10)] transition-colors" title="Supprimer">
                      <Trash2 className="w-4 h-4" style={{ color: "#C0392B" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Client Modal */}
      <Modal
        open={open} onClose={() => setOpen(false)} title="Nouveau client"
        footer={<>
          <button onClick={() => setOpen(false)} className="btn-danger">Annuler</button>
          <button onClick={submit} className="btn-primary">Créer</button>
        </>}
      >
        <div className="space-y-4">
          <FieldLabel label="Nom complet"><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FieldLabel>
          <FieldLabel label="Téléphone"><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FieldLabel>
          <FieldLabel label="Adresse"><input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></FieldLabel>
          <FieldLabel label="Mesures"><input className="input-field" value={form.mesures} onChange={(e) => setForm({ ...form, mesures: e.target.value })} placeholder="Ex: M / 38" /></FieldLabel>
        </div>
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le client"
        footer={<>
          <button onClick={() => setEditOpen(false)} className="btn-danger">Annuler</button>
          <button onClick={submitEdit} className="btn-primary">Enregistrer</button>
        </>}
      >
        <div className="space-y-4">
          <FieldLabel label="Nom complet"><input className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></FieldLabel>
          <FieldLabel label="Téléphone"><input className="input-field" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></FieldLabel>
          <FieldLabel label="Adresse"><input className="input-field" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></FieldLabel>
          <FieldLabel label="Mesures"><input className="input-field" value={editForm.mesures} onChange={(e) => setEditForm({ ...editForm, mesures: e.target.value })} placeholder="Ex: M / 38" /></FieldLabel>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Supprimer le client"
        size="sm"
        footer={<>
          <button onClick={() => setDeleteOpen(false)} className="btn-danger">Annuler</button>
          <button onClick={confirmDelete} className="btn-primary" style={{ background: "#C0392B" }}>Supprimer</button>
        </>}
      >
        <p className="text-sm" style={{ color: "rgba(26,26,26,0.7)" }}>
          Êtes-vous sûr de vouloir supprimer le client <strong>{deleteName}</strong> ? Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}

export function Th({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(26,26,26,0.6)", ...style }}>{children}</th>;
}
export function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td className="py-4 px-4" style={style}>{children}</td>;
}
export function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#74367E" }}>{label}</span>
      {children}
    </label>
  );
}