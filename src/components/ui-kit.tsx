import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Drawer({ open, onClose, title, children, footer }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />
      <div
        className="relative ml-auto h-full w-full max-w-[480px] bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-200 lg:rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "#E5E5E5" }}>
          <h2 className="text-lg font-medium" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22 }}>{title}</h2>
          <button onClick={onClose} aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: "#E5E5E5" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = "md" }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-[400px]", md: "max-w-[560px]", lg: "max-w-[720px]" }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />
      <div
        className={`relative w-full ${widths} bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "#E5E5E5" }}>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, fontWeight: 500 }}>{title}</h2>
          <button onClick={onClose} aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t flex justify-end gap-3" style={{ borderColor: "#E5E5E5" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    "Disponible": { bg: "rgba(116,54,126,0.10)", color: "#74367E" },
    "Loué":       { bg: "#E5E5E5", color: "rgba(26,26,26,0.7)" },
    "En entretien": { bg: "#FFF8EC", color: "#D4820A" },
    "En cours":   { bg: "rgba(116,54,126,0.10)", color: "#74367E" },
    "À venir":    { bg: "#FFF8EC", color: "#D4820A" },
    "Rendue":     { bg: "#F0FAF4", color: "#27AE60" },
    "En retard":  { bg: "#FEF0F0", color: "#C0392B" },
    "Soldé":      { bg: "#F0FAF4", color: "#27AE60" },
    "En attente": { bg: "#FFF8EC", color: "#D4820A" },
  };
  const s = styles[status] ?? { bg: "#E5E5E5", color: "#1A1A1A" };
  return (
    <span className="pill" style={{ background: s.bg, color: s.color }}>{status}</span>
  );
}

export function EmptyState({ title, cta, onCta, icon }: { title: string; cta?: string; onCta?: () => void; icon?: ReactNode }) {
  return (
    <div className="card-surface text-center" style={{ padding: 64 }}>
      <div className="flex justify-center mb-4" style={{ color: "rgba(116,54,126,0.3)" }}>
        {icon}
      </div>
      <div className="text-sm mb-4" style={{ color: "rgba(26,26,26,0.6)" }}>{title}</div>
      {cta && <button onClick={onCta} className="btn-primary">{cta}</button>}
    </div>
  );
}
