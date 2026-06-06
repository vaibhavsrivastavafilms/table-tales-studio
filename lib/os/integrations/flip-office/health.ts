import { listUnmappedFlipMenuItems } from "@/lib/os/integrations/flip-office/menu-mapper";
import type { FlipOfficeSyncHealth } from "@/lib/os/integrations/flip-office/types";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export function buildFlipOfficeSyncHealth(db: ProcurementDb): FlipOfficeSyncHealth {
  const today = new Date().toISOString().slice(0, 10);
  const settings = db.flipOfficeSettings;
  const todayLogs = db.flipOfficeSyncLogs.filter((l) => l.date === today);
  const salesLogs = db.flipOfficeSyncLogs.filter((l) => l.syncType === "sales");
  const lastSalesLog = salesLogs[0];

  const recordsImportedToday = todayLogs.reduce((s, l) => s + l.recordsImported, 0);
  const errorCount = todayLogs.reduce((s, l) => s + (l.errorCount ?? 0), 0);
  const unmappedMenuItems = listUnmappedFlipMenuItems(db);
  const missingRecipeMappings = db.flipMenuMappings.filter((m) => !m.recipeId).length;

  return {
    lastSyncAt: settings.lastSyncAt,
    lastSyncStatus: settings.lastSyncStatus,
    lastSyncMessage: settings.lastSyncMessage,
    recordsImportedToday,
    errorCount,
    unmappedMenuItems,
    missingRecipeMappings,
    unmappedMenuItemCount: unmappedMenuItems.length,
    connected: settings.connected,
    modules: {
      sales: { enabled: settings.salesSyncEnabled, lastSyncAt: settings.lastSalesSyncAt },
      menu: { enabled: settings.menuSyncEnabled, lastSyncAt: settings.lastMenuSyncAt },
      customers: {
        enabled: settings.customerSyncEnabled,
        lastSyncAt: settings.lastCustomerSyncAt,
      },
      payments: {
        enabled: settings.paymentSyncEnabled,
        lastSyncAt: settings.lastPaymentSyncAt,
      },
    },
  };
}

export function recentFlipSyncLogs(db: ProcurementDb, limit = 12) {
  return db.flipOfficeSyncLogs.slice(0, limit);
}

export function flipSalesSummary(db: ProcurementDb, date?: string) {
  const target = date ?? new Date().toISOString().slice(0, 10);
  const sales = db.flipSales.filter((s) => s.saleDate === target);
  const imported = sales.filter((s) => s.status === "imported" || s.status === "partial");
  return {
    orders: sales.length,
    imported: imported.length,
    failed: sales.filter((s) => s.status === "failed").length,
    revenuePaise: imported.reduce((s, r) => s + r.totalPaise, 0),
    lastImportedAt: lastSalesLogTime(db),
  };
}

function lastSalesLogTime(db: ProcurementDb): string | null {
  const log = db.flipOfficeSyncLogs.find((l) => l.syncType === "sales");
  return log?.createdAt ?? null;
}
