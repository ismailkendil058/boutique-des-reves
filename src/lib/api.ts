// src/lib/api.ts
import { supabase } from "./supabaseClient";
import type { Article, Client, Employee, Location, Reservation, SavedContract, Versement } from "./types";

/** Helper to handle errors */
function handleError(error: any) {
  console.error("Supabase error", error);
  throw error;
}

/** ARTICLES */
export async function getArticles(): Promise<Article[]> {
  const { data, error } = await supabase.from<Article>("articles").select("*");
  if (error) handleError(error);
  return data || [];
}

export async function createArticle(article: Omit<Article, "id">): Promise<Article> {
  const { data, error } = await supabase.from<Article>("articles").insert(article).single();
  if (error) handleError(error);
  return data as Article;
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
  const { data, error } = await supabase.from<Article>("articles").update(updates).eq("id", id).single();
  if (error) handleError(error);
  return data as Article;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) handleError(error);
}

/** CLIENTS */
export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from<Client>("clients").select("*");
  if (error) handleError(error);
  return data || [];
}
export async function createClient(client: Omit<Client, "id" | "createdAt">): Promise<Client> {
  const { data, error } = await supabase.from<Client>("clients").insert({ ...client, createdAt: new Date().toISOString().slice(0,10) }).single();
  if (error) handleError(error);
  return data as Client;
}
export async function updateClient(id: string, updates: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase.from<Client>("clients").update(updates).eq("id", id).single();
  if (error) handleError(error);
  return data as Client;
}
export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) handleError(error);
}

/** EMPLOYEES */
export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from<Employee>("employees").select("*");
  if (error) handleError(error);
  return data || [];
}
export async function createEmployee(emp: Omit<Employee, "id">): Promise<Employee> {
  const { data, error } = await supabase.from<Employee>("employees").insert(emp).single();
  if (error) handleError(error);
  return data as Employee;
}
export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase.from<Employee>("employees").update(updates).eq("id", id).single();
  if (error) handleError(error);
  return data as Employee;
}
export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) handleError(error);
}

/** LOCATIONS */
export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase.from<Location>("locations").select("*");
  if (error) handleError(error);
  return data || [];
}
export async function createLocation(loc: Omit<Location, "id" | "status" | "versements" | "createdAt"> & { initialPayment?: number; versements?: Versement[] }): Promise<Location> {
  // Insert base location first
  const base = { ...loc, createdAt: new Date().toISOString().slice(0,10) };
  const { data: inserted, error } = await supabase.from<Location>("locations").insert(base).single();
  if (error) handleError(error);
  // Handle many‑to‑many articles
  if (loc.articleIds && loc.articleIds.length) {
    const junction = loc.articleIds.map((aid) => ({ location_id: inserted.id, article_id: aid }));
    const { error: jErr } = await supabase.from("location_articles").insert(junction);
    if (jErr) handleError(jErr);
  }
  // Handle initial payment as a versement if provided
  if (loc.initialPayment && loc.initialPayment > 0) {
    await supabase.from<Versement>("versements").insert({
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2,10),
      date: loc.pickupDate,
      amount: loc.initialPayment,
      type: "Versement"
    });
  }
  // Return the full location (status will be computed client‑side when needed)
  return inserted as Location;
}
export async function updateLocation(id: string, updates: Partial<Location>): Promise<Location> {
  const { data, error } = await supabase.from<Location>("locations").update(updates).eq("id", id).single();
  if (error) handleError(error);
  return data as Location;
}
export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) handleError(error);
}

/** VERSEMENTS */
export async function addVersement(locId: string, verse: Omit<Versement, "id">): Promise<Versement> {
  const payload = { ...verse, id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2,10) };
  const { data, error } = await supabase.from<Versement>("versements").insert({ ...payload, location_id: locId }).single();
  if (error) handleError(error);
  return data as Versement;
}
export async function deleteVersement(locId: string, verseId: string): Promise<void> {
  const { error } = await supabase.from("versements").delete().eq("id", verseId).eq("location_id", locId);
  if (error) handleError(error);
}

/** RESERVATIONS */
export async function getReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase.from<Reservation>("reservations").select("*");
  if (error) handleError(error);
  return data || [];
}
export async function createReservation(res: Omit<Reservation, "id" | "createdAt">): Promise<Reservation> {
  const payload = { ...res, createdAt: new Date().toISOString().slice(0,10) };
  const { data, error } = await supabase.from<Reservation>("reservations").insert(payload).single();
  if (error) handleError(error);
  // Junction table for articles
  if (res.articleIds && res.articleIds.length) {
    const junction = res.articleIds.map((aid) => ({ reservation_id: data.id, article_id: aid }));
    const { error: jErr } = await supabase.from("reservation_articles").insert(junction);
    if (jErr) handleError(jErr);
  }
  return data as Reservation;
}
export async function deleteReservation(id: string): Promise<void> {
  const { error } = await supabase.from("reservations").delete().eq("id", id);
  if (error) handleError(error);
}

/** SAVED CONTRACTS (replaces localStorage) */
export async function getSavedContracts(): Promise<SavedContract[]> {
  const { data, error } = await supabase.from<SavedContract>("saved_contracts").select("*");
  if (error) handleError(error);
  return data || [];
}
export async function saveContract(contract: Omit<SavedContract, "id" | "savedAt">): Promise<SavedContract> {
  const payload = { ...contract, savedAt: new Date().toISOString().slice(0,10) };
  const { data, error } = await supabase.from<SavedContract>("saved_contracts").insert(payload).single();
  if (error) handleError(error);
  return data as SavedContract;
}
export async function deleteSavedContract(id: string): Promise<void> {
  const { error } = await supabase.from("saved_contracts").delete().eq("id", id);
  if (error) handleError(error);
}

/** Utility to fetch all data in parallel (used on app start) */
export async function loadAllData() {
  const [articles, clients, employees, locations, reservations, savedContracts] = await Promise.all([
    getArticles(),
    getClients(),
    getEmployees(),
    getLocations(),
    getReservations(),
    getSavedContracts()
  ]);
  return { articles, clients, employees, locations, reservations, savedContracts };
}

export default {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  addVersement,
  deleteVersement,
  getReservations,
  createReservation,
  deleteReservation,
  getSavedContracts,
  saveContract,
  deleteSavedContract,
  loadAllData,
};
