// src/lib/api.ts
import { supabase } from "./supabaseClient";
import type {
  Article,
  Client,
  Employee,
  Location,
  Reservation,
  SavedContract,
  Versement,
} from "./types";

/** Helper to handle errors */
function handleError(error: any) {
  console.error("Supabase error", error);
  throw error;
}

// ── Column-name mapping (camelCase ↔ snake_case) ──────────────────
// The DB uses snake_case; the frontend TypeScript uses camelCase.

const CAMEL_TO_SNAKE: Record<string, string> = {
  clientId: "client_id",
  pickupDate: "pickup_date",
  returnDate: "return_date",
  actualReturnDate: "actual_return_date",
  cautionReturned: "caution_returned",
  createdAt: "created_at",
  updatedAt: "updated_at",
  locationId: "location_id",
  clientName: "client_name",
  clientPhone: "client_phone",
  savedAt: "saved_at",
};

const SNAKE_TO_CAMEL: Record<string, string> = Object.fromEntries(
  Object.entries(CAMEL_TO_SNAKE).map(([c, s]) => [s, c]),
);

function remap(
  obj: Record<string, any>,
  map: Record<string, string>,
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[map[k] ?? k] = v;
  }
  return out;
}

/** App (camelCase) → DB (snake_case) */
function toDB(obj: Record<string, any>): Record<string, any> {
  return remap(obj, CAMEL_TO_SNAKE);
}

/** DB (snake_case) → App (camelCase) */
function fromDB(obj: Record<string, any>): Record<string, any> {
  return remap(obj, SNAKE_TO_CAMEL);
}

/** Remove keys that don't correspond to DB columns */
function omit(
  obj: Record<string, any>,
  keys: string[],
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!keys.includes(k)) out[k] = v;
  }
  return out;
}

/** Fields that live in junction / child tables – must be stripped before parent insert */
const LOCATION_EXTRA = ["articleIds", "articlePrices", "versements"];
const RESERVATION_EXTRA = ["articleIds", "articlePrices"];
const SAVED_CONTRACT_EXTRA = ["articles"];
const ARTICLE_EXTRA = ["title"]; // exists in TS type but not in DB

// ── ARTICLES ───────────────────────────────────────────────────────

export async function getArticles(): Promise<Article[]> {
  const { data, error } = await supabase.from("articles").select("*");
  if (error) handleError(error);
  return (data ?? []).map((r: any) => fromDB(r)) as Article[];
}

export async function createArticle(
  article: Omit<Article, "id">,
): Promise<Article> {
  const payload = toDB(omit(article as any, ARTICLE_EXTRA));
  const { data, error } = await supabase
    .from("articles")
    .insert(payload)
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function updateArticle(
  id: string,
  updates: Partial<Article>,
): Promise<Article> {
  const payload = toDB(omit(updates as any, ARTICLE_EXTRA));
  const { data, error } = await supabase
    .from("articles")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) handleError(error);
}

// ── CLIENTS ────────────────────────────────────────────────────────

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase.from("clients").select("*");
  if (error) handleError(error);
  return (data ?? []).map((r: any) => fromDB(r)) as Client[];
}

export async function createClient(
  client: Omit<Client, "id">,
): Promise<Client> {
  const payload = toDB({
    ...client,
    createdAt: new Date().toISOString().slice(0, 10),
  });
  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function updateClient(
  id: string,
  updates: Partial<Client>,
): Promise<Client> {
  const payload = toDB(updates as any);
  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) handleError(error);
}

// ── EMPLOYEES ──────────────────────────────────────────────────────

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from("employees").select("*");
  if (error) handleError(error);
  return (data ?? []).map((r: any) => fromDB(r)) as Employee[];
}

export async function createEmployee(
  emp: Omit<Employee, "id">,
): Promise<Employee> {
  const payload = toDB(emp as any);
  const { data, error } = await supabase
    .from("employees")
    .insert(payload)
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function updateEmployee(
  id: string,
  updates: Partial<Employee>,
): Promise<Employee> {
  const payload = toDB(updates as any);
  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) handleError(error);
}

// ── LOCATIONS ──────────────────────────────────────────────────────

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase.from("locations").select("*");
  if (error) handleError(error);
  return (data ?? []).map((r: any) => fromDB(r)) as Location[];
}

export async function createLocation(
  loc: Omit<Location, "id" | "status" | "versements" | "createdAt"> & {
    initialPayment?: number;
    versements?: Versement[];
  },
): Promise<Location> {
  // Strip fields that live in junction / child tables
  const {
    articleIds,
    articlePrices,
    initialPayment,
    versements: _vers,
    ...rest
  } = loc;
  const base = toDB({
    ...rest,
    status: "En cours",
    createdAt: new Date().toISOString().slice(0, 10),
  });
  const { data: inserted, error } = await supabase
    .from("locations")
    .insert(base)
    .select()
    .single();
  if (error) handleError(error);

  // Junction table for articles
  if (articleIds && articleIds.length) {
    const junction = articleIds.map((aid) => ({
      location_id: (inserted as any).id,
      article_id: aid,
    }));
    const { error: jErr } = await supabase
      .from("location_articles")
      .insert(junction);
    if (jErr) handleError(jErr);
  }

  // Handle initial payment as a versement if provided
  if (initialPayment && initialPayment > 0) {
    await supabase.from("versements").insert({
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
      location_id: (inserted as any).id,
      date: loc.pickupDate,
      amount: loc.initialPayment,
      type: "Versement",
    });
  }

  return fromDB(inserted) as any;
}

export async function updateLocation(
  id: string,
  updates: Partial<Location>,
): Promise<Location> {
  const payload = toDB(omit(updates as any, LOCATION_EXTRA));
  const { data, error } = await supabase
    .from("locations")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function deleteLocation(id: string): Promise<void> {
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) handleError(error);
}

// ── VERSEMENTS ─────────────────────────────────────────────────────

export async function addVersement(
  locId: string,
  verse: Omit<Versement, "id">,
): Promise<Versement> {
  const payload = {
    ...verse,
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
  };
  const { data, error } = await supabase
    .from("versements")
    .insert({ ...payload, location_id: locId })
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function deleteVersement(
  locId: string,
  verseId: string,
): Promise<void> {
  const { error } = await supabase
    .from("versements")
    .delete()
    .eq("id", verseId)
    .eq("location_id", locId);
  if (error) handleError(error);
}

// ── RESERVATIONS ───────────────────────────────────────────────────

export async function getReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase.from("reservations").select("*");
  if (error) handleError(error);
  return (data ?? []).map((r: any) => fromDB(r)) as Reservation[];
}

export async function createReservation(
  res: Omit<Reservation, "id" | "createdAt">,
): Promise<Reservation> {
  const { articleIds, articlePrices, ...rest } = res;
  const payload = toDB({
    ...rest,
    createdAt: new Date().toISOString().slice(0, 10),
  });
  const { data, error } = await supabase
    .from("reservations")
    .insert(payload)
    .select()
    .single();
  if (error) handleError(error);

  // Junction table for articles
  if (articleIds && articleIds.length) {
    const junction = articleIds.map((aid) => ({
      reservation_id: (data as any).id,
      article_id: aid,
    }));
    const { error: jErr } = await supabase
      .from("reservation_articles")
      .insert(junction);
    if (jErr) handleError(jErr);
  }

  return fromDB(data) as any;
}

export async function deleteReservation(id: string): Promise<void> {
  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", id);
  if (error) handleError(error);
}

// ── SAVED CONTRACTS ────────────────────────────────────────────────

export async function getSavedContracts(): Promise<SavedContract[]> {
  const { data, error } = await supabase
    .from("saved_contracts")
    .select("*");
  if (error) handleError(error);
  return (data ?? []).map((r: any) => fromDB(r)) as SavedContract[];
}

export async function saveContract(
  contract: Omit<SavedContract, "id" | "savedAt">,
): Promise<SavedContract> {
  const { articles: _arts, ...rest } = contract as any;
  const payload = toDB({
    ...rest,
    savedAt: new Date().toISOString().slice(0, 10),
  });
  const { data, error } = await supabase
    .from("saved_contracts")
    .insert(payload)
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function deleteSavedContract(id: string): Promise<void> {
  const { error } = await supabase
    .from("saved_contracts")
    .delete()
    .eq("id", id);
  if (error) handleError(error);
}

// ── Utility ────────────────────────────────────────────────────────

/** Fetch all data in parallel (used on app start) */
export async function loadAllData() {
  const [articles, clients, employees, locations, reservations, savedContracts] =
    await Promise.all([
      getArticles(),
      getClients(),
      getEmployees(),
      getLocations(),
      getReservations(),
      getSavedContracts(),
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