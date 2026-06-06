import { createMenuIngredientSeed } from "@/lib/os/kitchen/menu-ingredients-seed";
import { buildMenuRecipes, mergeMenuRecipes } from "@/lib/os/kitchen/menu-seed";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export function migrateMenuV9(db: ProcurementDb): ProcurementDb {
  const now = new Date().toISOString();
  const menuRecipes = buildMenuRecipes(now);
  const menuIngredients =
    db.menuIngredients?.length > 0 ? db.menuIngredients : createMenuIngredientSeed(now);

  return {
    ...db,
    recipes: mergeMenuRecipes(db.recipes ?? [], menuRecipes),
    menuIngredients,
    menuRecipeIngredients: db.menuRecipeIngredients ?? [],
    recipeCostSettings: db.recipeCostSettings ?? [],
    recipeCostSnapshots: db.recipeCostSnapshots ?? [],
  };
}
