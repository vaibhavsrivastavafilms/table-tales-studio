import { loadFlipOfficeOrders } from "@/lib/os/integrations/flip-office/api-client";
import {
  matchFlipMenuItemToRecipe,
  upsertFlipMenuMapping,
} from "@/lib/os/integrations/flip-office/menu-mapper";
import {
  finalizeFlipSync,
  parseChannel,
  recordImportedSale,
  resolveBranchId,
  rupeesToPaise,
  uid,
} from "@/lib/os/integrations/flip-office/operations";
import type {
  FlipOfficeOrderRow,
  FlipOfficeSyncResult,
  FlipSale,
  FlipSaleItem,
} from "@/lib/os/integrations/flip-office/types";
import type { ProcurementDb } from "@/lib/os/procurement/types";

function alreadyImported(db: ProcurementDb, flipOfficeId: string): boolean {
  return db.flipSales.some((s) => s.flipOfficeId === flipOfficeId);
}

function importOrder(
  db: ProcurementDb,
  order: FlipOfficeOrderRow,
  actor: string,
  source: "flip_office" | "csv" = "flip_office"
): { db: ProcurementDb; imported: number; skipped: number; errors: string[] } {
  if (alreadyImported(db, order.id)) {
    return { db, imported: 0, skipped: 1, errors: [] };
  }

  const branchId = resolveBranchId(order.outlet);
  const consumedAt = `${order.date}T${order.time ?? "12:00"}:00.000Z`;
  const channel = parseChannel(order.channel);
  const errors: string[] = [];
  let imported = 0;
  let next = db;

  const flipSaleId = uid("fsal");
  const flipItems: FlipSaleItem[] = [];
  let mappedCount = 0;

  for (const line of order.items) {
    const match = matchFlipMenuItemToRecipe(
      next,
      line.name,
      line.code ?? line.menuItemId,
      order.outlet
    );

    next = upsertFlipMenuMapping(next, {
      flipMenuItemId: line.menuItemId ?? line.id,
      flipMenuItemName: line.name,
      flipMenuItemCode: line.code ?? null,
      recipeId: match.recipeId,
      recipeName: match.recipeName,
      matchMethod: match.matchMethod,
      confidence: match.confidence,
    });

    const flipItemId = uid("fsli");
    let saleId: string | null = null;
    let mappingStatus: FlipSaleItem["mappingStatus"] = "unmapped";
    let itemError: string | null = null;

    if (match.recipeId) {
      const out = recordImportedSale(next, {
        branchId,
        outlet: order.outlet,
        recipeId: match.recipeId,
        recipeName: match.recipeName ?? line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        channel,
        consumedAt,
        flipOfficeOrderId: order.id,
        flipOfficeLineId: line.id,
        paymentMethod: order.paymentMethod ?? null,
        source,
        actor,
      });
      next = out.db;
      saleId = out.saleId;
      if (saleId) {
        imported += 1;
        mappedCount += 1;
        mappingStatus = match.matchMethod === "manual" ? "manual" : "mapped";
      } else {
        mappingStatus = "mapped";
      }
    } else {
      itemError = `No recipe mapping for "${line.name}"`;
      errors.push(itemError);
    }

    flipItems.push({
      id: flipItemId,
      flipSaleId,
      flipMenuItemId: line.menuItemId ?? null,
      menuItemName: line.name,
      recipeId: match.recipeId,
      quantity: line.quantity,
      unitPricePaise: rupeesToPaise(line.unitPrice),
      totalPaise: rupeesToPaise(line.total),
      mappingStatus,
      saleId,
      errorMessage: itemError,
    });
  }

  const status: FlipSale["status"] =
    mappedCount === order.items.length
      ? "imported"
      : mappedCount > 0
        ? "partial"
        : "failed";

  const flipSale: FlipSale = {
    id: flipSaleId,
    flipOfficeId: order.id,
    branchId,
    saleDate: order.date,
    saleTime: order.time ?? "12:00",
    outlet: order.outlet,
    orderNumber: order.orderNumber,
    channel,
    customerId: order.customerId ?? null,
    customerName: order.customerName ?? null,
    subtotalPaise: rupeesToPaise(order.subtotal ?? order.total),
    taxPaise: rupeesToPaise(order.tax ?? 0),
    discountPaise: rupeesToPaise(order.discount ?? 0),
    totalPaise: rupeesToPaise(order.total),
    paymentMethod: order.paymentMethod ?? null,
    status,
    errorMessage: errors.length ? errors.join("; ") : null,
    importedAt: mappedCount > 0 ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
  };

  next = {
    ...next,
    flipSales: [flipSale, ...next.flipSales],
    flipSaleItems: [...flipItems, ...next.flipSaleItems],
  };

  return { db: next, imported, skipped: 0, errors };
}

export function syncFlipOfficeSales(
  db: ProcurementDb,
  date: string = new Date().toISOString().slice(0, 10),
  actor = "flip_office_sync"
): Promise<{ db: ProcurementDb; result: FlipOfficeSyncResult }> {
  return syncFlipOfficeSalesFromOrders(db, date, actor);
}

export async function syncFlipOfficeSalesFromOrders(
  db: ProcurementDb,
  date: string,
  actor: string,
  orders?: FlipOfficeOrderRow[]
): Promise<{ db: ProcurementDb; result: FlipOfficeSyncResult }> {
  const settings = db.flipOfficeSettings;
  if (!settings.salesSyncEnabled) {
    return {
      db,
      result: {
        module: "sales",
        recordsImported: 0,
        recordsSkipped: 0,
        errors: ["Sales sync is disabled."],
        status: "failed",
        message: "Sales sync is disabled in Flip Office settings.",
      },
    };
  }

  let next = db;
  let recordsImported = 0;
  let recordsSkipped = 0;
  const errors: string[] = [];

  try {
    const rows = orders ?? (await loadFlipOfficeOrders(db, settings, date));
    for (const order of rows) {
      const out = importOrder(next, order, actor, orders ? "csv" : "flip_office");
      next = out.db;
      recordsImported += out.imported;
      recordsSkipped += out.skipped;
      errors.push(...out.errors);
    }

    const status =
      errors.length && recordsImported === 0
        ? "failed"
        : errors.length
          ? "partial"
          : "success";

    const result: FlipOfficeSyncResult = {
      module: "sales",
      recordsImported,
      recordsSkipped,
      errors,
      status,
      message:
        recordsImported > 0
          ? `Imported ${recordsImported} sale lines from ${rows.length} orders for ${date}.`
          : rows.length
            ? `Processed ${rows.length} orders — ${recordsSkipped} skipped, ${errors.length} mapping errors.`
            : `No Flip Office orders found for ${date}.`,
    };

    next = finalizeFlipSync(next, settings, "sales", result);
    return { db: next, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sales sync failed";
    const result: FlipOfficeSyncResult = {
      module: "sales",
      recordsImported: 0,
      recordsSkipped: 0,
      errors: [message],
      status: "failed",
      message,
    };
    next = finalizeFlipSync(next, settings, "sales", result);
    return { db: next, result };
  }
}

export function syncFlipOfficePayments(
  db: ProcurementDb,
  date: string = new Date().toISOString().slice(0, 10),
  actor = "flip_office_sync"
): Promise<{ db: ProcurementDb; result: FlipOfficeSyncResult }> {
  if (!db.flipOfficeSettings.paymentSyncEnabled) {
    return Promise.resolve({
      db,
      result: {
        module: "payments",
        recordsImported: 0,
        recordsSkipped: 0,
        errors: [],
        status: "success",
        message: "Payment sync runs with sales import — payment methods attached to orders.",
      },
    });
  }

  return syncFlipOfficeSales(db, date, actor).then(({ db: next, result }) => ({
    db: finalizeFlipSync(next, next.flipOfficeSettings, "payments", {
      ...result,
      module: "payments",
      message: `Payment methods synced for ${next.flipSales.filter((s) => s.saleDate === date && s.paymentMethod).length} orders on ${date}.`,
    }),
    result: {
      module: "payments",
      recordsImported: next.flipSales.filter((s) => s.saleDate === date && s.paymentMethod).length,
      recordsSkipped: 0,
      errors: [],
      status: "success",
      message: `Payment methods synced for ${date}.`,
    },
  }));
}
