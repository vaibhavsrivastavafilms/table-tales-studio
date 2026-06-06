import type { ProcurementRole } from "@/lib/os/procurement/types";

export const PROCUREMENT_ROLE_KEY = "tts:os:procurement:role";

export function getProcurementRole(): ProcurementRole {
  if (typeof window === "undefined") return "owner";
  const stored = localStorage.getItem(PROCUREMENT_ROLE_KEY);
  if (
    stored === "owner" ||
    stored === "accountant" ||
    stored === "procurement_manager" ||
    stored === "store_manager" ||
    stored === "kitchen_manager"
  ) {
    return stored;
  }
  return "owner";
}

export function setProcurementRole(role: ProcurementRole): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROCUREMENT_ROLE_KEY, role);
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
