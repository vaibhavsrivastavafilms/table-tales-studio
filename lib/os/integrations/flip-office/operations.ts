import { resolveBranchId } from "@/lib/os/branches";
import { appendAuditEntry } from "@/lib/os/procurement/audit";
import { buildConsumptionMovements } from "@/lib/os/sales/sales-engine";
import { rupeesToPaise } from "@/lib/os/money";
import type {
  FlipOfficeIntegrationSettings,
  FlipOfficeSyncResult,
} from "@/lib/os/integrations/flip-office/types";
import type {
  FlipOfficeSyncLog,
  FlipOfficeSyncType,
  ProcurementDb,
  SalesChannel,
  Sale,
} from "@/lib/os/procurement/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function appendFlipSyncLog(
  db: ProcurementDb,
  log: Omit<FlipOfficeSyncLog, "id" | "createdAt">
): ProcurementDb {
  const entry: FlipOfficeSyncLog = {
    ...log,
    id: uid("fslog"),
    createdAt: new Date().toISOString(),
  };
  return {
    ...db,
    flipOfficeSyncLogs: [entry, ...db.flipOfficeSyncLogs].slice(0, 200),
  };
}

export function updateFlipOfficeSettings(
  db: ProcurementDb,
  patch: Partial<FlipOfficeIntegrationSettings>
): ProcurementDb {
  const next = {
    ...db.flipOfficeSettings,
    ...patch,
    connected: patch.connected ?? Boolean(patch.apiUrl && patch.apiKey),
  };
  return { ...db, flipOfficeSettings: next };
}

function parseChannel(raw?: string | null): SalesChannel {
  const value = (raw ?? "dine_in").toLowerCase();
  if (value.includes("swiggy")) return "swiggy";
  if (value.includes("zomato")) return "zomato";
  if (value.includes("take")) return "takeaway";
  return "dine_in";
}

function recordImportedSale(
  db: ProcurementDb,
  input: {
    branchId: string;
    outlet: string;
    recipeId: string;
    recipeName: string;
    quantity: number;
    unitPrice: number;
    channel: SalesChannel;
    consumedAt: string;
    flipOfficeOrderId: string;
    flipOfficeLineId: string;
    paymentMethod?: string | null;
    source: Sale["source"];
    actor: string;
  }
): { db: ProcurementDb; saleId: string | null } {
  if (
    db.sales.some(
      (s) =>
        s.flipOfficeLineId === input.flipOfficeLineId ||
        (s.flipOfficeOrderId === input.flipOfficeOrderId &&
          s.recipeId === input.recipeId &&
          s.quantity === input.quantity)
    )
  ) {
    return { db, saleId: null };
  }

  const sale: Sale = {
    id: uid("sal"),
    branchId: input.branchId,
    channel: input.channel,
    recipeId: input.recipeId,
    recipeName: input.recipeName,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    totalRevenue: input.unitPrice * input.quantity,
    consumedAt: input.consumedAt,
    outlet: input.outlet,
    source: input.source,
    flipOfficeOrderId: input.flipOfficeOrderId,
    flipOfficeLineId: input.flipOfficeLineId,
    paymentMethod: input.paymentMethod ?? null,
  };

  const movements = buildConsumptionMovements(db, sale, sale.id);
  let next: ProcurementDb = {
    ...db,
    sales: [sale, ...db.sales],
    inventoryMovements: [
      ...movements.map((m) => ({
        id: uid("mov"),
        branchId: sale.branchId,
        itemId: m.itemId,
        billId: null,
        type: "consumption" as const,
        quantity: m.quantity,
        note: m.note,
        createdAt: m.createdAt,
      })),
      ...db.inventoryMovements,
    ],
  };

  next = {
    ...next,
    inventoryItems: next.inventoryItems.map((item) => {
      const consumed = movements
        .filter((m) => m.itemId === item.id)
        .reduce((s, m) => s + Math.abs(m.quantity), 0);
      if (consumed <= 0) return item;
      return { ...item, currentStock: Math.max(0, item.currentStock - consumed) };
    }),
  };

  next = appendAuditEntry(next, {
    entityType: "vendor",
    entityId: sale.id,
    action: "sale_recorded",
    actionType: "create",
    detail: `${input.recipeName} × ${input.quantity} via Flip Office (${input.channel})`,
    userId: input.actor,
    userName: input.actor,
    oldValue: null,
    newValue: JSON.stringify(sale),
    reason: null,
    ip: null,
    field: "sale",
  });

  return { db: next, saleId: sale.id };
}

export function finalizeFlipSync(
  db: ProcurementDb,
  settings: FlipOfficeIntegrationSettings,
  module: FlipOfficeSyncType,
  result: FlipOfficeSyncResult
): ProcurementDb {
  const now = new Date().toISOString();
  const status = result.status;
  let next = appendFlipSyncLog(db, {
    syncType: module,
    recordsImported: result.recordsImported,
    recordsSkipped: result.recordsSkipped,
    errorCount: result.errors.length,
    date: now.slice(0, 10),
    status,
    message: result.message,
  });

  const settingsPatch: Partial<FlipOfficeIntegrationSettings> = {
    lastSyncAt: now,
    lastSyncStatus: status === "failed" ? "failed" : status === "partial" ? "partial" : "success",
    lastSyncMessage: result.message,
  };

  if (module === "sales") settingsPatch.lastSalesSyncAt = now;
  if (module === "menu") settingsPatch.lastMenuSyncAt = now;
  if (module === "customers") settingsPatch.lastCustomerSyncAt = now;
  if (module === "payments") settingsPatch.lastPaymentSyncAt = now;

  next = updateFlipOfficeSettings(next, settingsPatch);
  return next;
}

export { parseChannel, recordImportedSale, resolveBranchId, rupeesToPaise, uid };
