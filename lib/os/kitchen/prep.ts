import { computeRecipeCost, getItemLastRate } from "@/lib/os/kitchen/recipes";
import type {
  PrepIngredient,
  PrepRecipe,
  ProcurementDb,
  ProductionBatch,
} from "@/lib/os/procurement/types";

export function getPrepIngredients(
  db: ProcurementDb,
  prepRecipeId: string
): PrepIngredient[] {
  return db.prepIngredients.filter((i) => i.prepRecipeId === prepRecipeId);
}

export function computePrepInputCost(
  db: ProcurementDb,
  prepRecipeId: string
): number {
  return getPrepIngredients(db, prepRecipeId).reduce((sum, ing) => {
    const rate = getItemLastRate(db, ing.itemId);
    return sum + ing.quantity * rate;
  }, 0);
}

export function computeProductionCost(
  inputCost: number,
  outputQty: number
): number {
  if (outputQty <= 0) return inputCost;
  return inputCost / outputQty;
}

export function enrichPrepRecipe(
  db: ProcurementDb,
  prep: PrepRecipe
): PrepRecipe & {
  inputCost: number;
  unitCost: number;
  ingredientCount: number;
} {
  const inputCost = computePrepInputCost(db, prep.id);
  return {
    ...prep,
    inputCost,
    unitCost: computeProductionCost(inputCost, prep.outputYield),
    ingredientCount: getPrepIngredients(db, prep.id).length,
  };
}

export function listEnrichedPrepRecipes(db: ProcurementDb) {
  return db.prepRecipes.map((p) => enrichPrepRecipe(db, p));
}

export function summarizeBatch(batch: ProductionBatch) {
  return {
    ...batch,
    costPerUnit:
      batch.outputQty > 0 ? batch.productionCost / batch.outputQty : batch.productionCost,
  };
}

/** Fallback when prep uses same costing as menu recipes. */
export function estimatePrepCost(db: ProcurementDb, prepRecipeId: string): number {
  return computePrepInputCost(db, prepRecipeId);
}
