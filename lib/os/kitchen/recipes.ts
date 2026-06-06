import { coalesceBranchId } from "@/lib/os/branches";
import type {
  ProcurementDb,
  Recipe,
  RecipeIngredient,
  RecipeStatus,
} from "@/lib/os/procurement/types";

export function getRecipeIngredients(
  db: ProcurementDb,
  recipeId: string
): RecipeIngredient[] {
  return db.recipeIngredients.filter((i) => i.recipeId === recipeId);
}

export function getItemLastRate(db: ProcurementDb, itemId: string): number {
  for (const bill of db.purchaseBills.filter((b) => b.status === "posted")) {
    for (const line of bill.items) {
      if (line.itemId === itemId && line.rate > 0) {
        return line.rate;
      }
    }
  }
  return 0;
}

export function computeRecipeCost(db: ProcurementDb, recipeId: string): number {
  const ingredients = getRecipeIngredients(db, recipeId);
  return ingredients.reduce((sum, ing) => {
    const rate = getItemLastRate(db, ing.itemId);
    return sum + ing.quantity * rate;
  }, 0);
}

export function computeFoodCostPercent(
  recipeCost: number,
  sellingPrice: number
): number {
  if (sellingPrice <= 0) return 0;
  return (recipeCost / sellingPrice) * 100;
}

export function computeMargin(sellingPrice: number, recipeCost: number) {
  const margin = sellingPrice - recipeCost;
  const marginPercent = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
  return { margin, marginPercent };
}

export function enrichRecipe(
  db: ProcurementDb,
  recipe: Recipe
): Recipe & {
  recipeCost: number;
  foodCostPercent: number;
  margin: number;
  marginPercent: number;
  ingredientCount: number;
} {
  const recipeCost = computeRecipeCost(db, recipe.id);
  const { margin, marginPercent } = computeMargin(recipe.sellingPrice, recipeCost);
  return {
    ...recipe,
    recipeCost,
    foodCostPercent: computeFoodCostPercent(recipeCost, recipe.sellingPrice),
    margin,
    marginPercent,
    ingredientCount: getRecipeIngredients(db, recipe.id).length,
  };
}

export function listEnrichedRecipes(db: ProcurementDb) {
  return db.recipes.map((r) => enrichRecipe(db, r));
}

export type CreateRecipeInput = {
  name: string;
  sellingPrice: number;
  yield: number;
  yieldUnit: string;
  status?: RecipeStatus;
  outlet?: string;
  ingredients: Omit<RecipeIngredient, "id" | "recipeId">[];
};

export function buildRecipePayload(
  input: CreateRecipeInput,
  recipeId: string,
  now: string
): { recipe: Recipe; ingredients: RecipeIngredient[] } {
  const recipe: Recipe = {
    id: recipeId,
    branchId: coalesceBranchId(input.outlet),
    name: input.name,
    sellingPrice: input.sellingPrice,
    yield: input.yield,
    yieldUnit: input.yieldUnit,
    status: input.status ?? "active",
    outlet: input.outlet ?? "Table Tales",
    createdAt: now,
  };
  const ingredients: RecipeIngredient[] = input.ingredients.map((ing, idx) => ({
    id: `${recipeId}_ing_${idx}`,
    recipeId,
    ...ing,
  }));
  return { recipe, ingredients };
}
