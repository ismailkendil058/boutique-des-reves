export function formatDA(value: number): string {
  const v = Math.round(value || 0);
  return v.toLocaleString("fr-FR").replace(/\u202f/g, " ") + " DA";
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export interface MachtaInfo {
  active: boolean;
  price: number;
  cleanNotes: string;
}

export function parseMachta(notes: string | null | undefined): MachtaInfo {
  if (!notes) return { active: false, price: 0, cleanNotes: "" };
  const regex = /\[Service Machta:\s*(\d+)(?:\s*DA)?\]/;
  const match = notes.match(regex);
  if (match) {
    const price = parseInt(match[1], 10) || 0;
    const cleanNotes = notes.replace(regex, "").trim();
    return { active: true, price, cleanNotes };
  }
  return { active: false, price: 0, cleanNotes: notes.trim() };
}

export function serializeMachta(cleanNotes: string | null | undefined, active: boolean, price: number): string {
  const trimmed = (cleanNotes || "").trim();
  if (!active) return trimmed;
  const tag = `[Service Machta: ${price} DA]`;
  return trimmed ? `${trimmed}\n${tag}` : tag;
}
