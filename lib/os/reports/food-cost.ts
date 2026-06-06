import {
  computeFoodCostPercent,
  computeMargin,
  computeRecipeCost,
  listEnrichedRecipes,
} from "@/lib/os/kitchen/recipes";
import type {
  FoodCostReportRow,
  ProcurementDb,
} from "@/lib/os/procurement/types";

export function buildFoodCostReport(db: ProcurementDb): FoodCostReportRow[] {
  return listEnrichedRecipes(db).map((recipe) => ({
    recipeId: recipe.id,
    recipeName: recipe.name,
    recipeCost: recipe.recipeCost,
    sellingPrice: recipe.sellingPrice,
    foodCostPercent: recipe.foodCostPercent,
    margin: recipe.margin,
    marginPercent: recipe.marginPercent,
    outlet: recipe.outlet,
  }));
}

export function computeOutletFoodCost(db: ProcurementDb) {
  const rows = buildFoodCostReport(db);
  if (!rows.length) {
    return { avgFoodCostPercent: 0, avgMarginPercent: 0, recipeCount: 0 };
  }
  const avgFoodCostPercent =
    rows.reduce((s, r) => s + r.foodCostPercent, 0) / rows.length;
  const avgMarginPercent =
    rows.reduce((s, r) => s + r.marginPercent, 0) / rows.length;
  return {
    avgFoodCostPercent,
    avgMarginPercent,
    recipeCount: rows.length,
  };
}

export function getHighMarginItems(db: ProcurementDb, limit = 5) {
  return buildFoodCostReport(db)
    .sort((a, b) => b.marginPercent - a.marginPercent)
    .slice(0, limit);
}

export function getLowMarginItems(db: ProcurementDb, limit = 5) {
  return buildFoodCostReport(db)
    .sort((a, b) => a.marginPercent - b.marginPercent)
    .slice(0, limit);
}

export function getRecipeCostTrends(db: ProcurementDb) {
  return db.recipes.map((recipe) => {
    const cost = computeRecipeCost(db, recipe.id);
    const { margin, marginPercent } = computeMargin(recipe.sellingPrice, cost);
    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      recipeCost: cost,
      foodCostPercent: computeFoodCostPercent(cost, recipe.sellingPrice),
      margin,
      marginPercent,
    };
  });
}

export function compareOutlets(db: ProcurementDb) {
  const map = new Map<string, FoodCostReportRow[]>();
  for (const row of buildFoodCostReport(db)) {
    const list = map.get(row.outlet) ?? [];
    list.push(row);
    map.set(row.outlet, list);
  }
  return [...map.entries()].map(([outlet, rows]) => ({
    outlet,
    avgFoodCostPercent:
      rows.reduce((s, r) => s + r.foodCostPercent, 0) / rows.length,
    avgMarginPercent:
      rows.reduce((s, r) => s + r.marginPercent, 0) / rows.length,
    recipeCount: rows.length,
  }));
}
