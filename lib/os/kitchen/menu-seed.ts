import type { Recipe } from "@/lib/os/procurement/types";
import { MENU_CATALOG, menuRecipeId, menuRecipeSlug } from "@/lib/os/kitchen/menu-catalog";

export function buildMenuRecipes(now: string): Recipe[] {
  const slugCounts = new Map<string, number>();
  return MENU_CATALOG.map((item) => {
    const base = menuRecipeSlug(item.name);
    const count = slugCounts.get(base) ?? 0;
    slugCounts.set(base, count + 1);
    const id = menuRecipeId(item.name, count);
    return {
      id,
      branchId: null,
      name: item.name,
      sellingPrice: item.sellingPricePaise / 100,
      sellingPricePaise: item.sellingPricePaise,
      yield: 1,
      yieldUnit: item.servingSize,
      status: item.isActive ? "active" : "inactive",
      outlet: "Table Tales",
      menuCategory: item.menuCategory,
      menuSubcategory: item.menuSubcategory,
      description: item.description,
      servingSize: item.servingSize,
      isSignature: item.isSignature,
      isSpicy: item.isSpicy,
      isJainAvailable: item.isJainAvailable,
      isActive: item.isActive,
      foodCostTargetPct: item.foodCostTargetPct,
      createdAt: now,
    };
  });
}

export function mergeMenuRecipes(existing: Recipe[], menuRecipes: Recipe[]): Recipe[] {
  const byName = new Map(existing.map((r) => [r.name.toLowerCase(), r]));
  const merged = [...existing];
  for (const recipe of menuRecipes) {
    if (byName.has(recipe.name.toLowerCase())) continue;
    merged.push(recipe);
  }
  return merged;
}
