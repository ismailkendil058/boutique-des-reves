import { create } from "zustand";

export type Category = "Tenues" | "Bijoux" | "Accessoires";
export type ArticleStatus = "Disponible" | "Loué" | "En entretien";

export interface Article {
  id: string;
  name: string;
  category: Category;
  size?: string;
  color?: string;
  price: number;       // DA per location
  caution: number;     // DA
  status: ArticleStatus;
  condition?: string;
  notes?: string;
  photo?: string;      // url or placeholder color
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  mesures?: string;
  createdAt: string;
}

export interface Versement {
  id: string;
  date: string;
  amount: number;
  type: "Versement" | "Solde" | "Caution";
}

export type LocationStatus = "En cours" | "À venir" | "Rendue" | "En retard";

export interface Location {
  id: string;
  clientId: string;
  articleIds: string[];
  pickupDate: string;
  returnDate: string;
  actualReturnDate?: string;
  occasion: "Mariage" | "Fiançailles" | "Cérémonie" | "Anniversaire" | "Autre";
  total: number;
  caution: number;
  cautionReturned?: boolean;
  versements: Versement[];
  status: LocationStatus;
  notes?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  pin: string;
  active: boolean;
}

export type Role = "admin" | "employee" | null;

interface AuthState {
  role: Role;
  employeeName: string | null;
}

interface StoreState {
  auth: AuthState;
  articles: Article[];
  clients: Client[];
  locations: Location[];
  employees: Employee[];
  pendingNewLocationClientId: string | null;
  pendingOpenLocationId: string | null;
  setPendingNewLocation: (id: string | null) => void;
  setPendingOpenLocation: (id: string | null) => void;

  loginEmployee: (id: string, pin: string) => boolean;
  loginEmployeeDemo: () => void;
  loginAdmin: (password: string) => boolean;
  loginAdminDemo: () => void;
  logout: () => void;

  addArticle: (a: Omit<Article, "id">) => void;
  updateArticle: (id: string, a: Partial<Article>) => void;
  deleteArticle: (id: string) => void;

  addClient: (c: Omit<Client, "id" | "createdAt">) => Client;
  updateClient: (id: string, c: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addLocation: (l: Omit<Location, "id" | "createdAt" | "status" | "versements"> & { initialPayment?: number; versements?: Versement[] }) => Location;
  addVersement: (locId: string, v: Omit<Versement, "id">) => void;
  deleteVersement: (locId: string, vId: string) => void;
  markReturned: (locId: string, returnDate: string) => void;
  markCautionReturned: (locId: string) => void;
  updateLocationNotes: (locId: string, notes: string) => void;

  addEmployee: (name: string, pin: string) => void;
  updateEmployeePin: (id: string, pin: string) => void;
  toggleEmployee: (id: string) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function computeStatus(l: Omit<Location, "status">): LocationStatus {
  const now = new Date().toISOString().slice(0, 10);
  if (l.actualReturnDate) return "Rendue";
  if (l.pickupDate > now) return "À venir";
  if (l.returnDate < now) return "En retard";
  return "En cours";
}

// ─── Seed data ───────────────────────────────────────────
const PURPLES = ["#74367E", "#9B5BA5", "#B884C0", "#D4B0D9", "#5E2A66"];

const seedArticles: Article[] = [
  { id: "a1", name: "Karakou brodé or", category: "Tenues", size: "M", color: "Noir/Or", price: 8000, caution: 15000, status: "Disponible", photo: PURPLES[0] },
  { id: "a2", name: "Caftan velours", category: "Tenues", size: "L", color: "Bordeaux", price: 6500, caution: 12000, status: "Loué", photo: PURPLES[1] },
  { id: "a3", name: "Robe constantinoise", category: "Tenues", size: "S", color: "Ivoire", price: 9000, caution: 20000, status: "Disponible", photo: PURPLES[2] },
  { id: "a4", name: "Parure Lben argent", category: "Bijoux", color: "Argent", price: 3500, caution: 8000, status: "Disponible", photo: PURPLES[3] },
  { id: "a5", name: "Diadème perles", category: "Bijoux", color: "Or rose", price: 2500, caution: 5000, status: "Disponible", photo: PURPLES[4] },
  { id: "a6", name: "Chedda tlemcenienne", category: "Tenues", size: "M", color: "Doré", price: 12000, caution: 25000, status: "Loué", photo: PURPLES[0] },
  { id: "a7", name: "Ceinture brodée", category: "Accessoires", color: "Or", price: 1500, caution: 3000, status: "Disponible", photo: PURPLES[1] },
  { id: "a8", name: "Khit Errouh collier", category: "Bijoux", color: "Or", price: 4000, caution: 10000, status: "En entretien", photo: PURPLES[2] },
];

const seedClients: Client[] = [
  { id: "c1", name: "Amina Benali", phone: "0555 12 34 56", address: "Hydra, Alger", mesures: "M / 38", createdAt: "2025-01-15" },
  { id: "c2", name: "Yasmine Cherif", phone: "0661 98 76 54", address: "Oran centre", mesures: "S / 36", createdAt: "2025-02-03" },
  { id: "c3", name: "Lila Mansouri", phone: "0770 22 11 88", address: "Constantine", mesures: "L / 42", createdAt: "2025-03-20" },
];

const todayStr = new Date().toISOString().slice(0, 10);
const inDays = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const seedLocationsBase = [
  {
    id: "l1", clientId: "c1", articleIds: ["a2"],
    pickupDate: inDays(-3), returnDate: inDays(2),
    occasion: "Mariage" as const, total: 6500, caution: 12000,
    versements: [{ id: "v1", date: inDays(-3), amount: 3000, type: "Versement" as const }],
    createdAt: inDays(-3),
  },
  {
    id: "l2", clientId: "c2", articleIds: ["a6"],
    pickupDate: inDays(-10), returnDate: inDays(-2),
    occasion: "Fiançailles" as const, total: 12000, caution: 25000,
    versements: [
      { id: "v2", date: inDays(-10), amount: 5000, type: "Versement" as const },
      { id: "v3", date: inDays(-5), amount: 3000, type: "Versement" as const },
    ],
    createdAt: inDays(-10),
  },
  {
    id: "l3", clientId: "c3", articleIds: ["a3", "a5"],
    pickupDate: inDays(5), returnDate: inDays(10),
    occasion: "Cérémonie" as const, total: 11500, caution: 25000,
    versements: [{ id: "v4", date: todayStr, amount: 5000, type: "Versement" as const }],
    createdAt: todayStr,
  },
];

const seedLocations: Location[] = seedLocationsBase.map((l) => ({ ...l, status: computeStatus(l) }));

const seedEmployees: Employee[] = [
  { id: "e1", name: "Samira", pin: "1234", active: true },
  { id: "e2", name: "Nadia", pin: "5678", active: true },
  { id: "e3", name: "Houda", pin: "0000", active: true },
];

export const useStore = create<StoreState>((set, get) => ({
  auth: { role: null, employeeName: null },
  articles: seedArticles,
  clients: seedClients,
  locations: seedLocations,
  employees: seedEmployees,
  pendingNewLocationClientId: null,
  pendingOpenLocationId: null,
  setPendingNewLocation: (id) => set({ pendingNewLocationClientId: id }),
  setPendingOpenLocation: (id) => set({ pendingOpenLocationId: id }),


  loginEmployee: (id, pin) => {
    const emp = get().employees.find((e) => e.id === id && e.active);
    if (emp && emp.pin === pin) {
      set({ auth: { role: "employee", employeeName: emp.name } });
      return true;
    }
    return false;
  },
  loginEmployeeDemo: () => set({ auth: { role: "employee", employeeName: "Samira (démo)" } }),
  loginAdmin: (password) => {
    if (password === "admin") {
      set({ auth: { role: "admin", employeeName: "Administratrice" } });
      return true;
    }
    return false;
  },
  loginAdminDemo: () => set({ auth: { role: "admin", employeeName: "Admin (démo)" } }),
  logout: () => set({ auth: { role: null, employeeName: null } }),

  addArticle: (a) => set((s) => ({ articles: [...s.articles, { ...a, id: uid() }] })),
  updateArticle: (id, a) => set((s) => ({ articles: s.articles.map((x) => (x.id === id ? { ...x, ...a } : x)) })),
  deleteArticle: (id) => set((s) => ({ articles: s.articles.filter((x) => x.id !== id) })),

  addClient: (c) => {
    const client: Client = { ...c, id: uid(), createdAt: todayStr };
    set((s) => ({ clients: [...s.clients, client] }));
    return client;
  },
  updateClient: (id, c) => set((s) => ({ clients: s.clients.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
  deleteClient: (id) => set((s) => ({ clients: s.clients.filter((x) => x.id !== id) })),

  addLocation: (l) => {
    const versements = l.versements ?? (l.initialPayment ? [{ id: uid(), date: l.pickupDate, amount: l.initialPayment, type: "Versement" as const }] : []);
    const base = {
      id: uid(),
      clientId: l.clientId,
      articleIds: l.articleIds,
      pickupDate: l.pickupDate,
      returnDate: l.returnDate,
      occasion: l.occasion,
      total: l.total,
      caution: l.caution,
      versements,
      notes: l.notes,
      createdAt: todayStr,
    };
    const loc: Location = { ...base, status: computeStatus(base) };
    set((s) => ({
      locations: [...s.locations, loc],
      articles: s.articles.map((a) => (l.articleIds.includes(a.id) ? { ...a, status: "Loué" } : a)),
    }));
    return loc;
  },
  addVersement: (locId, v) => set((s) => ({
    locations: s.locations.map((l) => (l.id === locId ? { ...l, versements: [...l.versements, { ...v, id: uid() }] } : l)),
  })),
  deleteVersement: (locId, vId) => set((s) => ({
    locations: s.locations.map((l) => (l.id === locId ? { ...l, versements: l.versements.filter((v) => v.id !== vId) } : l)),
  })),
  markReturned: (locId, returnDate) => set((s) => {
    const loc = s.locations.find((l) => l.id === locId);
    return {
      locations: s.locations.map((l) => (l.id === locId ? { ...l, actualReturnDate: returnDate, status: "Rendue" } : l)),
      articles: loc ? s.articles.map((a) => (loc.articleIds.includes(a.id) ? { ...a, status: "Disponible" } : a)) : s.articles,
    };
  }),
  markCautionReturned: (locId) => set((s) => ({
    locations: s.locations.map((l) => (l.id === locId ? { ...l, cautionReturned: true } : l)),
  })),
  updateLocationNotes: (locId, notes) => set((s) => ({
    locations: s.locations.map((l) => (l.id === locId ? { ...l, notes } : l)),
  })),

  addEmployee: (name, pin) => set((s) => ({ employees: [...s.employees, { id: uid(), name, pin, active: true }] })),
  updateEmployeePin: (id, pin) => set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, pin } : e)) })),
  toggleEmployee: (id) => set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, active: !e.active } : e)) })),
}));

// Helpers
export function locVerse(l: Location) {
  return l.versements.reduce((s, v) => s + v.amount, 0);
}
export function locReste(l: Location) {
  return Math.max(0, l.total - locVerse(l));
}
