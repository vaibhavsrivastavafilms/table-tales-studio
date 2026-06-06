import { loadStoredProcurementRaw } from "@/lib/os/procurement/migrate";
import { saveProcurementDbSafe } from "@/lib/os/procurement/persist";
import { createSeedDb } from "@/lib/os/procurement/seed";
import type { ProcurementDb } from "@/lib/os/procurement/types";
import { isSupabaseConfigured } from "@/lib/supabase";

export type DataStoreMode = "supabase" | "local";

export function getDataStoreMode(): DataStoreMode {
  return isSupabaseConfigured() ? "supabase" : "local";
}

export function loadProcurementDbLocal(): ProcurementDb {
  if (typeof window === "undefined") return createSeedDb();
  return loadStoredProcurementRaw();
}

export function saveProcurementDbLocal(db: ProcurementDb): void {
  saveProcurementDbSafe(db);
}

export async function loadProcurementDbRemote(): Promise<ProcurementDb> {
  const res = await fetch("/api/os/workspace", { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to load workspace from Supabase.");
  }
  const body = (await res.json()) as { db: ProcurementDb };
  return body.db;
}

export async function saveProcurementDbRemote(db: ProcurementDb): Promise<void> {
  const res = await fetch("/api/os/workspace", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ db }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to save workspace to Supabase.");
  }
}

export async function loadProcurementDbFromStore(): Promise<ProcurementDb> {
  if (getDataStoreMode() === "supabase") {
    return loadProcurementDbRemote();
  }
  return loadProcurementDbLocal();
}

export async function saveProcurementDbToStore(db: ProcurementDb): Promise<void> {
  if (getDataStoreMode() === "supabase") {
    await saveProcurementDbRemote(db);
    return;
  }
  saveProcurementDbLocal(db);
}

export function readLocalStorageProcurementDb(): ProcurementDb {
  return loadProcurementDbLocal();
}
