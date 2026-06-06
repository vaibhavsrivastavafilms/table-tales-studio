import { calculateRecipeCost, type RecipeCostResult } from "@/lib/os/kitchen/menu-cost";
import {
  bulkImportIngredientRates,
  recalculateAllRecipesForIngredient,
} from "@/lib/os/kitchen/menu-operations";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export function calculateRecipeCostAction(
  db: ProcurementDb,
  recipeId: string,
  opts?: { overheadPct?: number; packagingCostPaise?: number; portions?: number }
): RecipeCostResult | null {
  return calculateRecipeCost(db, recipeId, opts);
}

export function recalculateAllRecipesForIngredientAction(
  db: ProcurementDb,
  ingredientId: string
): ProcurementDb {
  return recalculateAllRecipesForIngredient(db, ingredientId);
}

export function bulkImportIngredientRatesAction(db: ProcurementDb, csv: string) {
  return bulkImportIngredientRates(db, csv);
}

export type { RecipeCostResult };
