import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "@/components/ui-kit";
import { Th, Td, FieldLabel } from "./_components/table";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_app/employes")({
  component: EmployeesPage,
});

function EmployeesPage() {
  const employees = useStore((s) => s.employees);
  const addEmployee = useStore((s) => s.addEmployee);
  const updateEmployeePin = useStore((s) => s.updateEmployeePin);
  const toggleEmployee = useStore((s) => s.toggleEmployee);

  const [addOpen, setAddOpen] = useState(false);
  const [editingPinFor, setEditingPinFor] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Employés</h1>
        <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus className="w-4 h-4" /> Ajouter un employé</button>
      </div>

      <div className="card-surface" style={{ padding: 0 }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "2px solid #E5E5E5", background: "#FAFAFA" }}>
              <Th>Nom</Th><Th>PIN</Th><Th>Statut</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid #E5E5E5" }}>
                <Td>{e.name}</Td>
                <Td>****</Td>
                <Td>
                  <span className="pill" style={{
                    background: e.active ? "rgba(116,54,126,0.10)" : "#E5E5E5",
                    color: e.active ? "#74367E" : "rgba(26,26,26,0.6)",
                  }}>
                    {e.active ? "Actif" : "Désactivé"}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => setEditingPinFor(e.id)} style={{ color: "#74367E" }}>Modifier le PIN</button>
                    <button onClick={() => toggleEmployee(e.id)} style={{ color: "rgba(26,26,26,0.6)" }}>{e.active ? "Désactiver" : "Activer"}</button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addOpen && <AddEmployeeModal onClose={() => setAddOpen(false)} onSubmit={(n, p) => { addEmployee(n, p); setAddOpen(false); }} />}
      {editingPinFor && <EditPinModal onClose={() => setEditingPinFor(null)} onSubmit={(p) => { updateEmployeePin(editingPinFor, p); setEditingPinFor(null); }} />}
    </div>
  );
}

function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(4, " ").slice(0, 4).split("");
  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          maxLength={1}
          value={d.trim()}
          onChange={(e) => {
            const c = e.target.value.replace(/\D/g, "").slice(-1);
            const arr = value.padEnd(4, " ").split("");
            arr[i] = c || " ";
            onChange(arr.join("").trimEnd());
            if (c && i < 3) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i].trim() && i > 0) refs.current[i - 1]?.focus();
          }}
          className="text-center text-lg"
          style={{ width: 48, height: 56, border: "1px solid #E5E5E5", borderRadius: 8, fontFamily: "DM Sans" }}
          inputMode="numeric"
        />
      ))}
    </div>
  );
}

function AddEmployeeModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (name: string, pin: string) => void }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const valid = name.trim() && pin.length === 4;
  return (
    <Modal open onClose={onClose} title="Nouvel employé" size="sm"
      footer={<>
        <button onClick={onClose} className="btn-danger">Annuler</button>
        <button onClick={() => valid && onSubmit(name.trim(), pin)} className="btn-primary" disabled={!valid}>Créer</button>
      </>}>
      <div className="space-y-4">
        <FieldLabel label="Nom complet"><input className="input-field" value={name} onChange={(e) => setName(e.target.value)} /></FieldLabel>
        <FieldLabel label="PIN à 4 chiffres"><PinInput value={pin} onChange={setPin} /></FieldLabel>
      </div>
    </Modal>
  );
}

function EditPinModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  return (
    <Modal open onClose={onClose} title="Modifier le PIN" size="sm"
      footer={<>
        <button onClick={onClose} className="btn-danger">Annuler</button>
        <button onClick={() => pin.length === 4 && onSubmit(pin)} className="btn-primary" disabled={pin.length !== 4}>Mettre à jour</button>
      </>}>
      <FieldLabel label="Nouveau PIN à 4 chiffres"><PinInput value={pin} onChange={setPin} /></FieldLabel>
    </Modal>
  );
}
