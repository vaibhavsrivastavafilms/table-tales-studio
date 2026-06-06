import type { ProcurementDb, UnitConversion } from "@/lib/os/procurement/types";

export function convertToBaseUnit(
  db: ProcurementDb,
  itemId: string,
  quantity: number,
  fromUnit: string
): number {
  const item = db.inventoryItems.find((i) => i.id === itemId);
  const baseUnit = item?.unit ?? "kg";
  const unit = fromUnit.trim().toLowerCase();
  const base = baseUnit.trim().toLowerCase();

  if (unit === base || unit === "") return quantity;

  const rule = db.unitConversions.find(
    (c) =>
      c.itemId === itemId &&
      c.fromUnit.toLowerCase() === unit &&
      c.toUnit.toLowerCase() === base
  );
  if (rule) return quantity * rule.factor;

  const reverse = db.unitConversions.find(
    (c) =>
      c.itemId === itemId &&
      c.fromUnit.toLowerCase() === base &&
      c.toUnit.toLowerCase() === unit
  );
  if (reverse && reverse.factor !== 0) return quantity / reverse.factor;

  return quantity;
}

export function addUnitConversion(
  db: ProcurementDb,
  conversion: Omit<UnitConversion, "id">
): ProcurementDb {
  const row: UnitConversion = {
    ...conversion,
    id: `ucv_${Date.now().toString(36)}`,
  };
  return { ...db, unitConversions: [...db.unitConversions, row] };
}
