// src/lib/api.ts
import { supabase } from "./supabaseClient";
import type {
  Article,
  Client,
  Employee,
  Location,
  Note,
  Reservation,
  SavedContract,
  Versement,
} from "./types";

/** Helper to handle errors – logs context then re-throws */
function handleError(error: any, context?: string) {
  const msg = context ? `Supabase error [${context}]` : "Supabase error";
  console.error(msg, error?.message ?? error);
  if (error?.hint) console.error("Hint:", error.hint);
  if (error?.details) console.error("Details:", error.details);
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
  articleId: "article_id",
  articleName: "article_name",
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
const RESERVATION_EXTRA = ["articleIds", "articlePrices", "versements"];
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

  const locations = (data ?? []).map((r: any) => fromDB(r)) as Location[];

  if (locations.length === 0) return locations;

  const locationIds = locations.map((l) => l.id);

  // Batch fetch all junction rows for all locations in ONE query
  const { data: allJunctionRows, error: jErr } = await supabase
    .from("location_articles")
    .select("location_id, article_id, custom_price")
    .in("location_id", locationIds);
  if (jErr) handleError(jErr);

  // Group by location_id
  const junctionByLoc: Record<string, { article_id: string; custom_price: number | null }[]> = {};
  for (const row of allJunctionRows ?? []) {
    if (!junctionByLoc[row.location_id]) junctionByLoc[row.location_id] = [];
    junctionByLoc[row.location_id].push(row);
  }

  for (const loc of locations) {
    const rows = junctionByLoc[loc.id] ?? [];
    const articleIds = rows.map((r: any) => r.article_id);
    const articlePricesMap: Record<string, number> = {};
    for (const row of rows) {
      if (row.custom_price != null) {
        articlePricesMap[row.article_id] = Number(row.custom_price);
      }
    }
    (loc as any).articleIds = articleIds;
    if (Object.keys(articlePricesMap).length > 0) {
      (loc as any).articlePrices = articlePricesMap;
    }
  }

  return locations;
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

  // Build the return object with articleIds
  const saved = fromDB(inserted) as any;
  saved.articleIds = articleIds ?? [];
  if (articlePrices) saved.articlePrices = articlePrices;
  return saved;
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

// ── RESERVATION VERSEMENTS ─────────────────────────────────────────

export async function addReservationVersement(
  resId: string,
  verse: Omit<Versement, "id">,
): Promise<Versement> {
  const payload = {
    ...verse,
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
  };
  const { data, error } = await supabase
    .from("reservation_versements")
    .insert({ ...payload, reservation_id: resId })
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function deleteReservationVersement(
  resId: string,
  verseId: string,
): Promise<void> {
  const { error } = await supabase
    .from("reservation_versements")
    .delete()
    .eq("id", verseId)
    .eq("reservation_id", resId);
  if (error) handleError(error);
}

// ── RESERVATIONS ───────────────────────────────────────────────────

export async function getReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase.from("reservations").select("*");
  if (error) handleError(error);

  const reservations = (data ?? []).map((r: any) => fromDB(r)) as Reservation[];

  if (reservations.length === 0) return reservations;

  const resIds = reservations.map((r) => r.id);

  // Batch fetch ALL junction rows and versements in just 2 queries (instead of 2N)
  const [articlesResult, versementsResult] = await Promise.all([
    supabase
      .from("reservation_articles")
      .select("reservation_id, article_id, custom_price")
      .in("reservation_id", resIds),
    supabase
      .from("reservation_versements")
      .select("*")
      .in("reservation_id", resIds)
      .order("date", { ascending: false }),
  ]);

  if (articlesResult.error) handleError(articlesResult.error);
  if (versementsResult.error) handleError(versementsResult.error);

  // Group article junction rows by reservation_id
  const articlesByRes: Record<string, { article_id: string; custom_price: number | null }[]> = {};
  for (const row of articlesResult.data ?? []) {
    if (!articlesByRes[row.reservation_id]) articlesByRes[row.reservation_id] = [];
    articlesByRes[row.reservation_id].push(row);
  }

  // Group versements by reservation_id
  const versementsByRes: Record<string, any[]> = {};
  for (const row of versementsResult.data ?? []) {
    if (!versementsByRes[row.reservation_id]) versementsByRes[row.reservation_id] = [];
    versementsByRes[row.reservation_id].push(row);
  }

  for (const res of reservations) {
    const rows = articlesByRes[res.id] ?? [];
    const articleIds = rows.map((r: any) => r.article_id);
    const articlePricesMap: Record<string, number> = {};
    for (const row of rows) {
      if (row.custom_price != null) {
        articlePricesMap[row.article_id] = Number(row.custom_price);
      }
    }
    (res as any).articleIds = articleIds;
    if (Object.keys(articlePricesMap).length > 0) {
      (res as any).articlePrices = articlePricesMap;
    }

    const versRows = versementsByRes[res.id] ?? [];
    (res as any).versements = versRows.map((v: any) => fromDB(v));
  }

  return reservations;
}

export async function createReservation(
  res: Omit<Reservation, "id" | "createdAt">,
): Promise<Reservation> {
  const { articleIds, articlePrices, versements: _vers, ...rest } = res;
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

  // Junction table for articles (with optional custom prices)
  if (articleIds && articleIds.length) {
    const junction = articleIds.map((aid) => ({
      reservation_id: (data as any).id,
      article_id: aid,
      custom_price: articlePrices?.[aid] ?? null,
    }));
    const { error: jErr } = await supabase
      .from("reservation_articles")
      .insert(junction);
    if (jErr) handleError(jErr);
  }

  // Build the return object with articleIds
  const saved = fromDB(data) as any;
  saved.articleIds = articleIds ?? [];
  if (articlePrices) saved.articlePrices = articlePrices;
  return saved;
}

export async function deleteReservation(id: string): Promise<void> {
  // Delete child/junction rows first
  await supabase.from("reservation_articles").delete().eq("reservation_id", id);
  await supabase.from("reservation_versements").delete().eq("reservation_id", id);
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

  const contracts = (data ?? []).map((r: any) => fromDB(r)) as SavedContract[];

  if (contracts.length === 0) return contracts;

  const contractIds = contracts.map((c) => c.id);

  // Batch fetch ALL articles for ALL contracts in ONE query (instead of N queries)
  const { data: allArticles, error: artsErr } = await supabase
    .from("saved_contract_articles")
    .select("saved_contract_id, name, price")
    .in("saved_contract_id", contractIds);
  if (artsErr) handleError(artsErr);

  // Group by saved_contract_id
  const articlesByContract: Record<string, { name: string; price: number }[]> = {};
  for (const row of allArticles ?? []) {
    if (!articlesByContract[row.saved_contract_id]) articlesByContract[row.saved_contract_id] = [];
    articlesByContract[row.saved_contract_id].push({
      name: row.name,
      price: Number(row.price),
    });
  }

  for (const contract of contracts) {
    (contract as any).articles = articlesByContract[contract.id] ?? [];
  }

  return contracts;
}

export async function saveContract(
  contract: Omit<SavedContract, "id" | "savedAt">,
): Promise<SavedContract> {
  const { articles, ...rest } = contract as any;
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

  // Insert articles into junction table
  if (articles && articles.length) {
    const articleRows = articles.map((a: { name: string; price: number }) => ({
      saved_contract_id: (data as any).id,
      name: a.name,
      price: a.price,
    }));
    const { error: aErr } = await supabase
      .from("saved_contract_articles")
      .insert(articleRows);
    if (aErr) handleError(aErr);
  }

  const saved = fromDB(data) as any;
  saved.articles = articles ?? [];
  return saved;
}

export async function deleteSavedContract(id: string): Promise<void> {
  const { error } = await supabase
    .from("saved_contracts")
    .delete()
    .eq("id", id);
  if (error) handleError(error);
}

// ── Utility ────────────────────────────────────────────────────────

/** Fetch only employees (used on login page) */
export async function loadEmployees(): Promise<Employee[]> {
  return getEmployees();
}

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

/** Delete reservation and all related data (used after validation) */
export async function deleteReservationFull(id: string): Promise<void> {
  await supabase.from("reservation_articles").delete().eq("reservation_id", id);
  await supabase.from("reservation_versements").delete().eq("reservation_id", id);
  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", id);
  if (error) handleError(error);
}

// ── NOTES ─────────────────────────────────────────────────────────

export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) handleError(error);
  return (data ?? []).map((r: any) => fromDB(r)) as Note[];
}

export async function createNote(
  note: Omit<Note, "id" | "createdAt">,
): Promise<Note> {
  const payload = toDB({
    ...note,
    createdAt: new Date().toISOString(),
  });
  const { data, error } = await supabase
    .from("notes")
    .insert(payload)
    .select()
    .single();
  if (error) handleError(error);
  return fromDB(data) as any;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) handleError(error);
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
  addReservationVersement,
  deleteReservationVersement,
  getReservations,
  createReservation,
  deleteReservation,
  deleteReservationFull,
  getSavedContracts,
  saveContract,
  deleteSavedContract,
  loadAllData,
  loadEmployees,
  getNotes,
  createNote,
  deleteNote,
};
