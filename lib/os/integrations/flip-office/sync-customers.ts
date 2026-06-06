import { loadFlipOfficeCustomers } from "@/lib/os/integrations/flip-office/api-client";
import { finalizeFlipSync, resolveBranchId, uid } from "@/lib/os/integrations/flip-office/operations";
import type { FlipCustomer, FlipOfficeSyncResult } from "@/lib/os/integrations/flip-office/types";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export async function syncFlipOfficeCustomers(
  db: ProcurementDb,
  actor = "flip_office_sync"
): Promise<{ db: ProcurementDb; result: FlipOfficeSyncResult }> {
  void actor;
  const settings = db.flipOfficeSettings;
  if (!settings.customerSyncEnabled) {
    return {
      db,
      result: {
        module: "customers",
        recordsImported: 0,
        recordsSkipped: 0,
        errors: ["Customer sync is disabled."],
        status: "failed",
        message: "Customer sync is disabled in Flip Office settings.",
      },
    };
  }

  let next = db;
  let recordsImported = 0;
  let recordsSkipped = 0;
  const errors: string[] = [];

  try {
    const rows = await loadFlipOfficeCustomers(db, settings);
    const now = new Date().toISOString();

    for (const row of rows) {
      const existing = next.flipCustomers.find((c) => c.flipOfficeId === row.id);
      if (existing) {
        recordsSkipped += 1;
        continue;
      }

      const customer: FlipCustomer = {
        id: uid("fcust"),
        flipOfficeId: row.id,
        name: row.name,
        phone: row.phone ?? null,
        email: row.email ?? null,
        outlet: row.outlet ?? null,
        branchId: row.outlet ? resolveBranchId(row.outlet) : null,
        totalOrders: row.totalOrders ?? 0,
        totalSpendPaise: Math.round((row.totalSpend ?? 0) * 100),
        lastOrderAt: row.lastOrderAt ?? null,
        createdAt: now,
        updatedAt: now,
      };

      next = {
        ...next,
        flipCustomers: [customer, ...next.flipCustomers],
      };
      recordsImported += 1;
    }

    const result: FlipOfficeSyncResult = {
      module: "customers",
      recordsImported,
      recordsSkipped,
      errors,
      status: "success",
      message: `Imported ${recordsImported} Flip Office customers (${recordsSkipped} already on file).`,
    };

    next = finalizeFlipSync(next, settings, "customers", result);
    return { db: next, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Customer sync failed";
    const result: FlipOfficeSyncResult = {
      module: "customers",
      recordsImported: 0,
      recordsSkipped: 0,
      errors: [message],
      status: "failed",
      message,
    };
    next = finalizeFlipSync(next, settings, "customers", result);
    return { db: next, result };
  }
}
