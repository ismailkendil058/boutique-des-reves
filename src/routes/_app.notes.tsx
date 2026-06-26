import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { Note } from "@/lib/types";
import { Modal } from "@/components/ui-kit";
import { Trash2, Calendar, Search, X } from "lucide-react";

export const Route = createFileRoute("/_app/notes")({
  component: NotesPage,
});

function formatDateShort(d: string) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function NotesPage() {
  const notes = useStore((s) => s.notes);
  const loadNotes = useStore((s) => s.loadNotes);
  const deleteNote = useStore((s) => s.deleteNote);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const q = search.trim().toLowerCase();
  const filtered = notes.filter((n) => {
    if (q) {
      const haystack = `${n.articleName} ${n.message}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (dateFilter && n.date !== dateFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title">Notes d'indisponibilité</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(26,26,26,0.4)" }} />
          <input
            className="input-field w-full"
            style={{ paddingLeft: 36, paddingRight: search ? 36 : undefined }}
            placeholder="Rechercher par article ou note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
              aria-label="Effacer"
            >
              <X className="w-4 h-4" style={{ color: "rgba(26,26,26,0.4)" }} />
            </button>
          )}
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(26,26,26,0.4)" }} />
          <input
            type="date"
            className="input-field"
            style={{ paddingLeft: 36 }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filtrer par date"
          />
        </div>
        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="text-xs"
            style={{ color: "#74367E" }}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card-surface text-center" style={{ padding: 64 }}>
          <div className="text-sm" style={{ color: "rgba(26,26,26,0.6)" }}>
            {notes.length === 0
              ? "Aucune note d'indisponibilité pour le moment."
              : "Aucune note ne correspond à votre recherche."}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={() => setConfirmDelete(note.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer la note"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmDelete(null)} className="btn-danger">Annuler</button>
            <button
              className="btn-primary"
              style={{ background: "#C0392B" }}
              onClick={async () => {
                if (confirmDelete) {
                  await deleteNote(confirmDelete);
                  setConfirmDelete(null);
                }
              }}
            >
              Supprimer
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: "rgba(26,26,26,0.6)" }}>
          Êtes-vous sûr de vouloir supprimer cette note ?
        </p>
      </Modal>
    </div>
  );
}

function NoteCard({ note, onDelete }: { note: Note; onDelete: () => void }) {
  return (
    <div className="card-surface" style={{ padding: 16 }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-[15px]">{note.articleName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FFF8EC", color: "#D4820A" }}>
              {formatDateShort(note.date)}
            </span>
          </div>
          {note.message ? (
            <p className="mt-2 text-sm" style={{ color: "rgba(26,26,26,0.65)" }}>
              {note.message}
            </p>
          ) : (
            <p className="mt-2 text-xs italic" style={{ color: "rgba(26,26,26,0.35)" }}>
              Aucune note détaillée
            </p>
          )}
          <div className="mt-2 text-xs" style={{ color: "rgba(26,26,26,0.35)" }}>
            Créée le {formatDateShort(note.createdAt)}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-[rgba(192,57,43,0.06)] shrink-0"
          style={{ color: "#C0392B" }}
          aria-label="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}