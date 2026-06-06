import { STORAGE_KEY } from "@/lib/os/procurement/migrate";
import {
  migrateLegacyProcurementDocuments,
  stripEmbeddedPayloads,
} from "@/lib/os/procurement/strip-payloads";
import type { ProcurementDb } from "@/lib/os/procurement/types";

/** Hard limit — refuse localStorage writes above this size. */
export const PROCUREMENT_STORAGE_QUOTA_BYTES = 2 * 1024 * 1024;

/** Target max for UI-only keys (filters, draft forms). */
export const PROCUREMENT_UI_STATE_QUOTA_BYTES = 100 * 1024;

export const PROCUREMENT_UI_STATE_KEY = "tts:os:procurement:ui";

export class ProcurementStorageQuotaError extends Error {
  readonly bytes: number;

  constructor(bytes: number) {
    super(
      `Procurement data (${(bytes / 1024 / 1024).toFixed(2)} MB) exceeds the ${(
        PROCUREMENT_STORAGE_QUOTA_BYTES /
        1024 /
        1024
      ).toFixed(0)} MB localStorage limit. Uploaded documents are stored externally — only metadata is kept locally.`
    );
    this.name = "ProcurementStorageQuotaError";
    this.bytes = bytes;
  }
}

export function estimateProcurementDbBytes(db: ProcurementDb): number {
  if (typeof Blob === "undefined") {
    return JSON.stringify(db).length * 2;
  }
  return new Blob([JSON.stringify(db)]).size;
}

export function sanitizeProcurementDbForPersist(db: ProcurementDb): ProcurementDb {
  return stripEmbeddedPayloads(migrateLegacyProcurementDocuments(db));
}

export function saveProcurementDbSafe(db: ProcurementDb): void {
  if (typeof window === "undefined") return;

  const sanitized = sanitizeProcurementDbForPersist(db);
  const bytes = estimateProcurementDbBytes(sanitized);

  if (bytes > PROCUREMENT_STORAGE_QUOTA_BYTES) {
    throw new ProcurementStorageQuotaError(bytes);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
}

export function saveProcurementUiState(state: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(state);
  const bytes =
    typeof Blob === "undefined" ? payload.length * 2 : new Blob([payload]).size;
  if (bytes > PROCUREMENT_UI_STATE_QUOTA_BYTES) {
    throw new Error("Procurement UI state exceeds 100 KB limit.");
  }
  localStorage.setItem(PROCUREMENT_UI_STATE_KEY, payload);
}

export function loadProcurementUiState<T extends Record<string, unknown>>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROCUREMENT_UI_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
