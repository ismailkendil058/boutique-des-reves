// src/lib/store.ts
import { create } from "zustand";
import api from "./api";
import { parseMachta } from "./format";

/** Types imported from the API layer */
import type { Article, Client, Employee, Location, Reservation, SavedContract, Versement, Category, ArticleStatus } from "./types";
export type { Article, Client, Employee, Location, Reservation, SavedContract, Versement, Category, ArticleStatus };

/** Calculate remaining amount for a location */
export const locReste = (loc: Location): number => {
  const total = Number(loc.total ?? 0);
  const paid = (loc.versements ?? []).reduce((sum, v) => sum + Number(v.amount ?? 0), 0);
  return total - paid;
};

/** Calculate total versements amount for a location */
export const locVerse = (loc: Location): number => {
  return (loc.versements ?? []).reduce((sum, v) => sum + Number(v.amount ?? 0), 0);
};

/** Store state – holds only UI‑related data and the fetched domain entities */
export interface StoreState {
  auth: { role: "admin" | "employee" | null; employeeName: string | null };
  articles: Article[];
  clients: Client[];
  locations: Location[];
  employees: Employee[];
  reservations: Reservation[];
  savedContracts: SavedContract[];
  pendingNewLocationClientId: string | null;
  pendingOpenLocationId: string | null;
  // UI actions
  setPendingNewLocation: (id: string | null) => void;
  setPendingOpenLocation: (id: string | null) => void;
  // Auth actions
  loginEmployee: (id: string, pin: string) => Promise<boolean>;
  loginAdmin: (password: string) => Promise<boolean>;
  loginEmployeeDemo: () => void;
  loginAdminDemo: () => void;
  logout: () => void;
  // Data loading
  loadAllData: () => Promise<void>;
  // CRUD actions – async proxy to API
  addArticle: (a: Omit<Article, "id">) => Promise<void>;
  updateArticle: (id: string, a: Partial<Article>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  addClient: (c: Omit<Client, "id" | "createdAt">) => Promise<Client>;
  updateClient: (id: string, c: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addLocation: (l: Omit<Location, "id" | "status" | "versements" | "createdAt"> & { initialPayment?: number; versements?: Versement[] }) => Promise<void>;
  updateLocation: (id: string, updates: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  addVersement: (locId: string, v: Omit<Versement, "id">) => Promise<void>;
  deleteVersement: (locId: string, verseId: string) => Promise<void>;
  markReturned: (locId: string, returnDate: string) => Promise<void>;
  markCautionReturned: (locId: string) => Promise<void>;
  updateLocationNotes: (locId: string, notes: string) => Promise<void>;
  updateLocationArticlePrices: (locId: string, articlePrices: Record<string, number>) => Promise<void>;
  addEmployee: (name: string, pin: string) => Promise<void>;
  updateEmployeePin: (id: string, pin: string) => Promise<void>;
  toggleEmployee: (id: string) => Promise<void>;
  // Saved contracts
  saveContract: (locId: string) => Promise<void>;
  deleteSavedContract: (id: string) => Promise<void>;
  loadSavedContracts: () => Promise<void>;
  // Reservations
  addReservation: (r: Omit<Reservation, "id" | "createdAt">) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  validateReservation: (id: string, initialPayment: number) => Promise<void>;
}

/** Simple UID generator for temporary client‑side IDs */
function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const useStore = create<StoreState>((set, get) => ({
  // ---------- UI state ----------
  auth: { role: null, employeeName: null },
  articles: [],
  clients: [],
  locations: [],
  employees: [],
  reservations: [],
  savedContracts: [],
  pendingNewLocationClientId: null,
  pendingOpenLocationId: null,

  setPendingNewLocation: (id) => set({ pendingNewLocationClientId: id }),
  setPendingOpenLocation: (id) => set({ pendingOpenLocationId: id }),

  // ---------- Auth ----------
  loginEmployee: async (id, pin) => {
    const emp = get().employees.find((e) => e.id === id && e.active);
    if (emp && emp.pin === pin) {
      set({ auth: { role: "employee", employeeName: emp.name } });
      return true;
    }
    return false;
  },
  loginAdmin: async (password) => {
    if (password === "admin") {
      set({ auth: { role: "admin", employeeName: "Administratrice" } });
      return true;
    }
    return false;
  },
  loginEmployeeDemo: () => {
    const activeEmps = get().employees.filter((e) => e.active);
    const empName = activeEmps[0]?.name ?? "Employé Démo";
    set({ auth: { role: "employee", employeeName: empName } });
  },
  loginAdminDemo: () => {
    set({ auth: { role: "admin", employeeName: "Administratrice" } });
  },
  logout: () => set({ auth: { role: null, employeeName: null } }),

  // ---------- Data loading ----------
  loadAllData: async () => {
    const data = await api.loadAllData();
    set({
      articles: data.articles,
      clients: data.clients,
      employees: data.employees,
      locations: data.locations,
      reservations: data.reservations,
      savedContracts: data.savedContracts,
    });
  },

  // ---------- CRUD ----------
  addArticle: async (a) => {
    const article = await api.createArticle(a);
    set((s) => ({ articles: [...s.articles, article] }));
  },
  updateArticle: async (id, a) => {
    const updated = await api.updateArticle(id, a);
    set((s) => ({ articles: s.articles.map((x) => (x.id === id ? updated : x)) }));
  },
  deleteArticle: async (id) => {
    await api.deleteArticle(id);
    set((s) => ({ articles: s.articles.filter((x) => x.id !== id) }));
  },

  addClient: async (c) => {
    const client = await api.createClient(c);
    set((s) => ({ clients: [...s.clients, client] }));
    return client;
  },
  updateClient: async (id, c) => {
    const updated = await api.updateClient(id, c);
    set((s) => ({ clients: s.clients.map((x) => (x.id === id ? updated : x)) }));
  },
  deleteClient: async (id) => {
    await api.deleteClient(id);
    set((s) => ({ clients: s.clients.filter((x) => x.id !== id) }));
  },

  addLocation: async (l) => {
    const loc = await api.createLocation(l);
    // Mark selected articles as "Loué"
    for (const aid of (l.articleIds ?? [])) {
      const article = get().articles.find((a) => a.id === aid);
      if (article && article.status === "Disponible") {
        const updated = await api.updateArticle(aid, { status: "Loué" });
        set((s) => ({ articles: s.articles.map((a) => (a.id === aid ? updated : a)) }));
      }
    }
    set((s) => ({ locations: [...s.locations, loc] }));
  },
  updateLocation: async (id, updates) => {
    const updated = await api.updateLocation(id, updates);
    set((s) => ({ locations: s.locations.map((l) => (l.id === id ? updated : l)) }));
  },
  deleteLocation: async (id) => {
    const loc = get().locations.find((l) => l.id === id);
    // Restore articles back to "Disponible" before deleting
    if (loc && loc.status !== "Rendue") {
      for (const aid of (loc.articleIds ?? [])) {
        const article = get().articles.find((a) => a.id === aid);
        if (article && article.status === "Loué") {
          const artUpdated = await api.updateArticle(aid, { status: "Disponible" });
          set((s) => ({ articles: s.articles.map((a) => (a.id === aid ? artUpdated : a)) }));
        }
      }
    }
    // Delete saved contracts referencing this location first
    const contracts = get().savedContracts.filter((c) => c.locationId === id);
    for (const c of contracts) {
      await api.deleteSavedContract(c.id);
    }
    await api.deleteLocation(id);
    set((s) => ({
      locations: s.locations.filter((l) => l.id !== id),
      savedContracts: s.savedContracts.filter((c) => c.locationId !== id),
    }));
  },
  addVersement: async (locId, v) => {
    const verse = await api.addVersement(locId, v);
    set((s) => ({
      locations: s.locations.map((l) => (l.id === locId ? { ...l, versements: [...l.versements, verse] } : l)),
    }));
  },
  deleteVersement: async (locId, verseId) => {
    await api.deleteVersement(locId, verseId);
    set((s) => ({
      locations: s.locations.map((l) => (l.id === locId ? { ...l, versements: l.versements.filter((v) => v.id !== verseId) } : l)),
    }));
  },
  markReturned: async (locId, returnDate) => {
    const loc = get().locations.find((l) => l.id === locId);
    if (!loc) return;
    const updated = { ...loc, actualReturnDate: returnDate, status: "Rendue" as const };
    await api.updateLocation(locId, updated);
    // Restore articles back to "Disponible"
    for (const aid of (loc.articleIds ?? [])) {
      const article = get().articles.find((a) => a.id === aid);
      if (article && article.status === "Loué") {
        const artUpdated = await api.updateArticle(aid, { status: "Disponible" });
        set((s) => ({ articles: s.articles.map((a) => (a.id === aid ? artUpdated : a)) }));
      }
    }
    set((s) => ({ locations: s.locations.map((l) => (l.id === locId ? updated : l)) }));
  },
  markCautionReturned: async (locId) => {
    const loc = get().locations.find((l) => l.id === locId);
    if (!loc) return;
    const updated = { ...loc, cautionReturned: true };
    await api.updateLocation(locId, updated);
    set((s) => ({ locations: s.locations.map((l) => (l.id === locId ? updated : l)) }));
  },
  updateLocationNotes: async (locId, notes) => {
    const loc = get().locations.find((l) => l.id === locId);
    if (!loc) return;
    const updated = { ...loc, notes };
    await api.updateLocation(locId, updated);
    set((s) => ({ locations: s.locations.map((l) => (l.id === locId ? updated : l)) }));
  },
  updateLocationArticlePrices: async (locId, articlePrices) => {
    const loc = get().locations.find((l) => l.id === locId);
    if (!loc) return;
    const updated = { ...loc, articlePrices };
    await api.updateLocation(locId, updated);
    set((s) => ({ locations: s.locations.map((l) => (l.id === locId ? updated : l)) }));
  },

  // ---------- Employees ----------
  addEmployee: async (name, pin) => {
    const emp = await api.createEmployee({ name, pin, active: true } as any);
    set((s) => ({ employees: [...s.employees, emp] }));
  },
  updateEmployeePin: async (id, pin) => {
    const emp = await api.updateEmployee(id, { pin });
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? emp : e)) }));
  },
  toggleEmployee: async (id) => {
    const emp = get().employees.find((e) => e.id === id);
    if (!emp) return;
    const updated = await api.updateEmployee(id, { active: !emp.active });
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? updated : e)) }));
  },

  // ---------- Saved contracts ----------
  saveContract: async (locId) => {
    const loc = get().locations.find((l) => l.id === locId);
    if (!loc) return;
    const client = get().clients.find((c) => c.id === loc.clientId);
    const articles = get().articles.filter((a) => (loc.articleIds ?? []).includes(a.id));
    const verse = locVerse(loc);
    const reste = locReste(loc);

    const machta = parseMachta(loc.notes);
    const contractArticles = articles.map((a) => ({ name: a.name, price: loc.articlePrices?.[a.id] ?? a.price }));
    if (machta.active) {
      contractArticles.push({ name: "Service Machta", price: machta.price });
    }

    const payload = {
      locationId: loc.id,
      clientId: loc.clientId,
      clientName: client?.name ?? "Inconnu",
      clientPhone: client?.phone ?? "",
      pickupDate: loc.pickupDate,
      returnDate: loc.returnDate,
      total: loc.total,
      caution: 0,
      verse,
      reste,
      notes: machta.cleanNotes,
      articles: contractArticles,
    };

    const saved = await api.saveContract(payload as any);
    set((s) => ({ savedContracts: [...s.savedContracts, saved] }));
  },
  deleteSavedContract: async (id) => {
    await api.deleteSavedContract(id);
    set((s) => ({ savedContracts: s.savedContracts.filter((c) => c.id !== id) }));
  },
  loadSavedContracts: async () => {
    const contracts = await api.getSavedContracts();
    set({ savedContracts: contracts });
  },

  // ---------- Reservations ----------
  addReservation: async (r) => {
    const reservation = await api.createReservation(r);
    set((s) => ({ reservations: [...s.reservations, reservation] }));
  },
  deleteReservation: async (id) => {
    await api.deleteReservation(id);
    set((s) => ({ reservations: s.reservations.filter((r) => r.id !== id) }));
  },
  validateReservation: async (id, initialPayment) => {
    const reservation = get().reservations.find((r) => r.id === id);
    if (!reservation) return;
    const payload = {
      clientId: reservation.clientId,
      articleIds: reservation.articleIds,
      articlePrices: reservation.articlePrices,
      pickupDate: reservation.pickupDate,
      returnDate: reservation.returnDate,
      occasion: reservation.occasion,
      total: reservation.total,
      caution: 0,
      initialPayment,
      versements: [],
      notes: reservation.notes,
    };
    const loc = await api.createLocation(payload);
    // Mark selected articles as "Loué"
    for (const aid of (reservation.articleIds ?? [])) {
      const article = get().articles.find((a) => a.id === aid);
      if (article && article.status === "Disponible") {
        const updated = await api.updateArticle(aid, { status: "Loué" });
        set((s) => ({ articles: s.articles.map((a) => (a.id === aid ? updated : a)) }));
      }
    }
    set((s) => ({
      locations: [...s.locations, loc],
      reservations: s.reservations.filter((r) => r.id !== id),
    }));
  },
}));
