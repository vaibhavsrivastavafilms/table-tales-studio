import type {
  MenuRecipeIngredient,
  ProcurementDb,
  RecipeCostSettings,
  RecipeCostSnapshot,
  MenuRecipeIngredientInput,
} from "@/lib/os/procurement/types";
import {
  buildRecipeCostSnapshot,
  calculateRecipeCost,
  ingredientById,
} from "@/lib/os/kitchen/menu-cost";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function upsertMenuIngredientRate(
  db: ProcurementDb,
  ingredientId: string,
  costPerUnitPaise: number
): ProcurementDb {
  const now = new Date().toISOString();
  return {
    ...db,
    menuIngredients: db.menuIngredients.map((ing) =>
      ing.id === ingredientId
        ? { ...ing, costPerUnitPaise, lastUpdated: now }
        : ing
    ),
  };
}

export function upsertMenuRecipeIngredient(
  db: ProcurementDb,
  line: MenuRecipeIngredientInput
): ProcurementDb {
  const now = new Date().toISOString();
  const id = line.id ?? uid("rin");
  const ingredient = ingredientById(db, line.ingredientId);
  const nextLine: MenuRecipeIngredient = {
    id,
    recipeId: line.recipeId,
    ingredientId: line.ingredientId,
    quantity: line.quantity,
    unit: line.unit || ingredient?.unit || "kg",
    notes: line.notes,
    createdAt: now,
  };
  const existing = db.menuRecipeIngredients.filter(
    (r) => r.id !== id && !(r.recipeId === line.recipeId && r.ingredientId === line.ingredientId)
  );
  return {
    ...db,
    menuRecipeIngredients: [nextLine, ...existing],
  };
}

export function removeMenuRecipeIngredient(
  db: ProcurementDb,
  lineId: string
): ProcurementDb {
  return {
    ...db,
    menuRecipeIngredients: db.menuRecipeIngredients.filter((r) => r.id !== lineId),
  };
}

export function saveRecipeCostSettings(
  db: ProcurementDb,
  recipeId: string,
  settings: Pick<RecipeCostSettings, "overheadPct" | "packagingCostPaise">
): ProcurementDb {
  const now = new Date().toISOString();
  const next: RecipeCostSettings = {
    recipeId,
    overheadPct: settings.overheadPct,
    packagingCostPaise: settings.packagingCostPaise,
    updatedAt: now,
  };
  const rest = db.recipeCostSettings.filter((s) => s.recipeId !== recipeId);
  return { ...db, recipeCostSettings: [next, ...rest] };
}

function createFoodCostAlert(
  db: ProcurementDb,
  recipeId: string,
  foodCostPct: number,
  targetPct: number
): ProcurementDb {
  const recipe = db.recipes.find((r) => r.id === recipeId);
  if (!recipe) return db;
  const notification = {
    id: uid("ntf"),
    branchId: null,
    type: "food_cost_alert" as const,
    title: "Recipe food cost alert",
    detail: `${recipe.name} at ${foodCostPct.toFixed(1)}% (target ${targetPct.toFixed(1)}%).`,
    severity: "critical" as const,
    read: false,
    href: `/os/recipes/${recipeId}/cost-calculator`,
    createdAt: new Date().toISOString(),
  };
  return { ...db, notifications: [notification, ...db.notifications].slice(0, 50) };
}

export function saveRecipeCostSnapshot(
  db: ProcurementDb,
  recipeId: string,
  portions = 1
): ProcurementDb {
  const cost = calculateRecipeCost(db, recipeId, { portions });
  if (!cost) return db;
  const snapshot = buildRecipeCostSnapshot(db, recipeId, cost, portions);
  let next: ProcurementDb = {
    ...db,
    recipeCostSnapshots: [
      snapshot,
      ...db.recipeCostSnapshots.filter((s) => s.recipeId !== recipeId),
    ].slice(0, 200),
  };
  if (cost.status === "critical") {
    next = createFoodCostAlert(next, recipeId, cost.foodCostPct, cost.targetPct);
  }
  return next;
}

export function recalculateAllRecipesForIngredient(
  db: ProcurementDb,
  ingredientId: string
): ProcurementDb {
  const recipeIds = new Set(
    db.menuRecipeIngredients
      .filter((l) => l.ingredientId === ingredientId)
      .map((l) => l.recipeId)
  );
  let next = db;
  for (const recipeId of recipeIds) {
    const cost = calculateRecipeCost(next, recipeId);
    if (!cost) continue;
    const snapshot = buildRecipeCostSnapshot(next, recipeId, cost);
    next = {
      ...next,
      recipeCostSnapshots: [
        snapshot,
        ...next.recipeCostSnapshots.filter((s) => s.recipeId !== recipeId),
      ].slice(0, 200),
    };
    if (cost.status === "critical") {
      next = createFoodCostAlert(next, recipeId, cost.foodCostPct, cost.targetPct);
    }
  }
  return next;
}

export type BulkRateImportResult = {
  updated: number;
  errors: string[];
  recalculated: number;
};

export function bulkImportIngredientRates(
  db: ProcurementDb,
  csv: string
): { db: ProcurementDb; result: BulkRateImportResult } {
  const lines = csv.trim().split(/\r?\n/);
  const errors: string[] = [];
  let updated = 0;
  let next = db;
  const header = lines[0]?.toLowerCase();
  const start = header?.includes("ingredient") ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    const [nameRaw, rateRaw] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    if (!nameRaw) continue;
    const ingredient = next.menuIngredients.find(
      (ing) => ing.name.toLowerCase() === nameRaw.toLowerCase()
    );
    if (!ingredient) {
      errors.push(`Unknown ingredient: ${nameRaw}`);
      continue;
    }
    const rupees = Number(rateRaw);
    if (Number.isNaN(rupees) || rupees < 0) {
      errors.push(`Invalid rate for ${nameRaw}: ${rateRaw}`);
      continue;
    }
    next = upsertMenuIngredientRate(next, ingredient.id, Math.round(rupees * 100));
    updated++;
  }

  const affected = new Set<string>();
  for (const ing of next.menuIngredients) {
    if (csv.toLowerCase().includes(ing.name.toLowerCase())) {
      affected.add(ing.id);
    }
  }
  let recalculated = 0;
  for (const ingredientId of affected) {
    const before = next.recipeCostSnapshots.length;
    next = recalculateAllRecipesForIngredient(next, ingredientId);
    if (next.recipeCostSnapshots.length >= before) recalculated++;
  }

  return { db: next, result: { updated, errors, recalculated } };
}
