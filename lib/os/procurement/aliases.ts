import type { InventoryItem, ItemAlias, ProcurementDb } from "@/lib/os/procurement/types";

export function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveItemByNameOrAlias(
  db: ProcurementDb,
  rawName: string,
  vendorId?: string | null
): InventoryItem | undefined {
  const norm = normalizeAlias(rawName);
  const direct = db.inventoryItems.find((i) => normalizeAlias(i.name) === norm);
  if (direct) return direct;

  const aliasRow = db.itemAliases.find((a) => {
    if (normalizeAlias(a.alias) !== norm) return false;
    if (!a.vendorId || !vendorId) return true;
    return a.vendorId === vendorId;
  });
  if (!aliasRow) return undefined;
  return db.inventoryItems.find((i) => i.id === aliasRow.itemId);
}

export function addItemAlias(
  db: ProcurementDb,
  itemId: string,
  alias: string,
  vendorId?: string | null
): ProcurementDb {
  const norm = normalizeAlias(alias);
  if (
    db.itemAliases.some(
      (a) =>
        normalizeAlias(a.alias) === norm &&
        (a.vendorId ?? null) === (vendorId ?? null)
    )
  ) {
    return db;
  }
  const row: ItemAlias = {
    id: `als_${Date.now().toString(36)}`,
    itemId,
    alias: alias.trim(),
    vendorId: vendorId ?? null,
    createdAt: new Date().toISOString(),
  };
  return { ...db, itemAliases: [...db.itemAliases, row] };
}
