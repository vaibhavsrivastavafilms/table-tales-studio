import type { ProcurementRole } from "@/lib/os/procurement/types";
import { isSupabaseConfigured } from "@/lib/supabase";

/** UI session cache — authoritative role lives in Supabase org_members when configured. */
let cachedRole: ProcurementRole = "owner";

export const PROCUREMENT_ROLE_KEY = "tts:os:procurement:role";

export function getProcurementRole(): ProcurementRole {
  return cachedRole;
}

export function setProcurementRoleLocal(role: ProcurementRole): void {
  cachedRole = role;
}

export async function loadProcurementRoleFromServer(): Promise<ProcurementRole> {
  if (!isSupabaseConfigured()) {
    cachedRole = "owner";
    return cachedRole;
  }

  try {
    const res = await fetch("/api/os/org/role", { cache: "no-store" });
    if (!res.ok) return cachedRole;
    const body = (await res.json()) as { role?: ProcurementRole };
    if (body.role) {
      cachedRole = body.role;
    }
  } catch {
    /* keep cached */
  }
  return cachedRole;
}

export async function setProcurementRole(role: ProcurementRole): Promise<void> {
  cachedRole = role;
  if (!isSupabaseConfigured()) return;

  await fetch("/api/os/org/role", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export function canApproveCreditNotes(role: ProcurementRole): boolean {
  return role === "owner" || role === "accountant";
}

export function canCloseDisputes(role: ProcurementRole): boolean {
  return role === "owner" || role === "accountant";
}

export function canAdjustLedger(role: ProcurementRole): boolean {
  return role === "owner" || role === "accountant";
}

export function canEditReceivedQty(_role: ProcurementRole): boolean {
  return true;
}

export function roleLabel(role: ProcurementRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "accountant":
      return "Accountant";
    case "procurement_manager":
      return "Procurement Manager";
    case "store_manager":
      return "Store Manager";
    case "kitchen_manager":
      return "Kitchen Manager";
  }
}
