import { resolveItemByNameOrAlias } from "@/lib/os/procurement/aliases";
import { suggestCategory } from "@/lib/os/procurement/categories";
import type {
  InventoryCategory,
  InventoryItem,
  ItemAlias,
  ProcurementDb,
  UnitConversion,
} from "@/lib/os/procurement/types";

export function listItemsWithAliases(db: ProcurementDb) {
  return db.inventoryItems.map((item) => ({
    ...item,
    aliases: db.itemAliases.filter((a) => a.itemId === item.id),
    conversions: db.unitConversions.filter((c) => c.itemId === item.id),
  }));
}

export function resolveCanonicalName(
  db: ProcurementDb,
  rawName: string
): InventoryItem | undefined {
  return resolveItemByNameOrAlias(db, rawName);
}

export type ItemMasterInput = {
  name: string;
  category: InventoryCategory;
  unit: string;
  parLevel: number;
  aliases?: string[];
};

export function buildItemPayload(
  input: ItemMasterInput,
  itemId: string,
  now: string
): { item: InventoryItem; aliases: ItemAlias[] } {
  const item: InventoryItem = {
    id: itemId,
    name: input.name,
    category: input.category ?? suggestCategory(input.name),
    unit: input.unit,
    currentStock: 0,
    parLevel: input.parLevel,
    status: "active",
    createdAt: now,
  };
  const aliases: ItemAlias[] = (input.aliases ?? []).map((alias, idx) => ({
    id: `${itemId}_als_${idx}`,
    itemId,
    alias,
    vendorId: null,
    createdAt: now,
  }));
  return { item, aliases };
}

export function buildUnitConversion(
  itemId: string,
  fromUnit: string,
  toUnit: string,
  factor: number,
  id: string
): UnitConversion {
  return { id, itemId, fromUnit, toUnit, factor };
}
