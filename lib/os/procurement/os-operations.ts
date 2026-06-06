import { coalesceBranchId } from "@/lib/os/branches";
import { appendAuditEntry } from "@/lib/os/procurement/audit";
import { buildItemPayload, type ItemMasterInput } from "@/lib/os/inventory/item-master";
import {
  buildRecipePayload,
  getItemLastRate,
  type CreateRecipeInput,
} from "@/lib/os/kitchen/recipes";
import { computePrepInputCost, computeProductionCost } from "@/lib/os/kitchen/prep";
import { buildConsumptionMovements } from "@/lib/os/sales/sales-engine";
import type { CreatePaymentInput } from "@/lib/os/procurement/payments";
import type {
  InventoryItem,
  ProcurementDb,
  ProductionBatch,
  Sale,
  SalesChannel,
  VendorLedgerEntry,
  VendorPayment,
} from "@/lib/os/procurement/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function appendLedgerPayment(
  db: ProcurementDb,
  vendorId: string,
  paymentId: string,
  amount: number,
  description: string
): VendorLedgerEntry[] {
  const prev = db.vendorLedger
    .filter((e) => e.vendorId === vendorId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .at(-1);
  const balance = (prev?.balance ?? 0) - amount;
  const entry: VendorLedgerEntry = {
    id: uid("led"),
    vendorId,
    branchId: coalesceBranchId(),
    type: "payment",
    referenceId: paymentId,
    description,
    debit: 0,
    credit: amount,
    balance,
    createdAt: new Date().toISOString(),
  };
  return [...db.vendorLedger, entry];
}

export function recordVendorPayment(
  db: ProcurementDb,
  input: CreatePaymentInput,
  actor: string
): ProcurementDb {
  const vendor = db.vendors.find((v) => v.id === input.vendorId);
  if (!vendor) return db;

  const payment: VendorPayment = {
    id: uid("pay"),
    vendorId: vendor.id,
    vendorName: vendor.name,
    amount: input.amount,
    paymentDate: input.paymentDate,
    reference: input.reference,
    note: input.note,
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };

  let next: ProcurementDb = {
    ...db,
    vendorPayments: [payment, ...db.vendorPayments],
    vendorLedger: appendLedgerPayment(
      db,
      vendor.id,
      payment.id,
      payment.amount,
      `Payment ${payment.reference}`
    ),
  };

  next = appendAuditEntry(next, {
    entityType: "vendor",
    entityId: vendor.id,
    action: "payment_recorded",
    actionType: "create",
    detail: `Payment ₹${payment.amount} recorded`,
    userId: actor,
    userName: actor,
    oldValue: null,
    newValue: JSON.stringify(payment),
    reason: input.note,
    ip: null,
    field: "payment",
  });

  return next;
}

export function upsertInventoryItem(
  db: ProcurementDb,
  itemId: string,
  patch: Partial<InventoryItem>
): ProcurementDb {
  return {
    ...db,
    inventoryItems: db.inventoryItems.map((item) =>
      item.id === itemId ? { ...item, ...patch } : item
    ),
  };
}

export function createItemMaster(
  db: ProcurementDb,
  input: ItemMasterInput,
  actor: string
): ProcurementDb {
  const now = new Date().toISOString();
  const itemId = uid("itm");
  const { item, aliases } = buildItemPayload(input, itemId, now);
  let next: ProcurementDb = {
    ...db,
    inventoryItems: [...db.inventoryItems, item],
    itemAliases: [...db.itemAliases, ...aliases],
  };
  next = appendAuditEntry(next, {
    entityType: "vendor",
    entityId: item.id,
    action: "item_created",
    actionType: "create",
    detail: `Item master ${item.name} created`,
    userId: actor,
    userName: actor,
    oldValue: null,
    newValue: JSON.stringify(item),
    reason: null,
    ip: null,
    field: "inventory_item",
  });
  return next;
}

export function createRecipe(
  db: ProcurementDb,
  input: CreateRecipeInput,
  actor: string
): ProcurementDb {
  const now = new Date().toISOString();
  const recipeId = uid("rcp");
  const { recipe, ingredients } = buildRecipePayload(input, recipeId, now);
  let next: ProcurementDb = {
    ...db,
    recipes: [...db.recipes, recipe],
    recipeIngredients: [...db.recipeIngredients, ...ingredients],
  };
  next = appendAuditEntry(next, {
    entityType: "vendor",
    entityId: recipe.id,
    action: "recipe_created",
    actionType: "create",
    detail: `Recipe ${recipe.name} created`,
    userId: actor,
    userName: actor,
    oldValue: null,
    newValue: JSON.stringify(recipe),
    reason: null,
    ip: null,
    field: "recipe",
  });
  return next;
}

export function recordProductionBatch(
  db: ProcurementDb,
  prepRecipeId: string,
  outputQty: number,
  actor: string
): ProcurementDb {
  const prep = db.prepRecipes.find((p) => p.id === prepRecipeId);
  if (!prep) return db;

  const inputCost = computePrepInputCost(db, prepRecipeId);
  const productionCost = computeProductionCost(inputCost, outputQty);
  const batch: ProductionBatch = {
    id: uid("bat"),
    branchId: coalesceBranchId(),
    prepRecipeId,
    prepRecipeName: prep.name,
    inputCost,
    outputQty,
    productionCost,
    status: "completed",
    createdAt: new Date().toISOString(),
    createdBy: actor,
  };

  return {
    ...db,
    productionBatches: [batch, ...db.productionBatches],
  };
}

export function recordSale(
  db: ProcurementDb,
  recipeId: string,
  quantity: number,
  channel: SalesChannel,
  outlet: string,
  actor: string
): ProcurementDb {
  const recipe = db.recipes.find((r) => r.id === recipeId);
  if (!recipe || quantity <= 0) return db;

  const now = new Date().toISOString();
  const sale: Sale = {
    id: uid("sal"),
    branchId: coalesceBranchId(outlet),
    channel,
    recipeId,
    recipeName: recipe.name,
    quantity,
    unitPrice: recipe.sellingPrice,
    totalRevenue: recipe.sellingPrice * quantity,
    consumedAt: now,
    outlet,
    source: "manual",
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
    detail: `${recipe.name} × ${quantity} via ${channel}`,
    userId: actor,
    userName: actor,
    oldValue: null,
    newValue: JSON.stringify(sale),
    reason: null,
    ip: null,
    field: "sale",
  });

  return next;
}

export function persistStockVariances(
  db: ProcurementDb,
  date: string
): ProcurementDb {
  const rows = db.inventoryItems
    .map((item) => {
      const opening = db.openingStock.find(
        (o) => o.itemId === item.id && o.date === date
      );
      const closing = db.closingStock.find(
        (c) => c.itemId === item.id && c.date === date
      );
      if (!opening || !closing) return null;

      const purchases = db.inventoryMovements
        .filter(
          (m) =>
            m.itemId === item.id &&
            m.type === "purchase" &&
            m.createdAt.slice(0, 10) === date
        )
        .reduce((s, m) => s + m.quantity, 0);
      const consumption = db.inventoryMovements
        .filter(
          (m) =>
            m.itemId === item.id &&
            m.type === "consumption" &&
            m.createdAt.slice(0, 10) === date
        )
        .reduce((s, m) => s + Math.abs(m.quantity), 0);
      const expected = opening.quantity + purchases - consumption;
      const variance = closing.quantity - expected;
      const rate = getItemLastRate(db, item.id);
      return {
        id: uid("svr"),
        itemId: item.id,
        itemName: item.name,
        date,
        expected,
        actual: closing.quantity,
        variance,
        valueLoss: Math.abs(variance) * rate,
        unit: item.unit,
        createdAt: new Date().toISOString(),
      };
    })
    .filter(Boolean) as ProcurementDb["stockVariances"];

  return {
    ...db,
    stockVariances: [
      ...db.stockVariances.filter((v) => v.date !== date),
      ...rows,
    ],
  };
}

export type { CreateRecipeInput };
