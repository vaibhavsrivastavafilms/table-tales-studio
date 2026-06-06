import { formatPaise, paiseToRupees } from "@/lib/os/money";
import type {
  MenuIngredient,
  MenuRecipeIngredient,
  ProcurementDb,
  Recipe,
  RecipeCostSettings,
  RecipeCostSnapshot,
} from "@/lib/os/procurement/types";

export type IngredientCostBreakdown = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  ratePaise: number;
  yieldFactor: number;
  effectiveCostPaise: number;
  rateNotSet: boolean;
};

export type RecipeCostResult = {
  ingredientCostPaise: number;
  ingredientBreakdown: IngredientCostBreakdown[];
  overheadPct: number;
  overheadPaise: number;
  packagingCostPaise: number;
  totalCostPaise: number;
  sellingPricePaise: number;
  foodCostPct: number;
  marginPaise: number;
  marginPct: number;
  targetPct: number;
  status: "on_target" | "over_target" | "critical";
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function recipeSellingPricePaise(recipe: Recipe): number {
  if (recipe.sellingPricePaise != null) return recipe.sellingPricePaise;
  return Math.round(recipe.sellingPrice * 100);
}

export function getMenuRecipeIngredients(db: ProcurementDb, recipeId: string): MenuRecipeIngredient[] {
  return db.menuRecipeIngredients.filter((r) => r.recipeId === recipeId);
}

export function getRecipeCostSettings(
  db: ProcurementDb,
  recipeId: string
): RecipeCostSettings {
  return (
    db.recipeCostSettings.find((s) => s.recipeId === recipeId) ?? {
      recipeId,
      overheadPct: 5,
      packagingCostPaise: 0,
      updatedAt: new Date().toISOString(),
    }
  );
}

export function ingredientById(db: ProcurementDb, ingredientId: string): MenuIngredient | undefined {
  return db.menuIngredients.find((i) => i.id === ingredientId);
}

export function computeIngredientLineCost(
  line: MenuRecipeIngredient,
  ingredient: MenuIngredient | undefined
): IngredientCostBreakdown {
  const ratePaise = ingredient?.costPerUnitPaise ?? 0;
  const yieldFactor = ingredient?.yieldFactor || 1;
  const effectiveCostPaise = Math.round((line.quantity * ratePaise) / Math.max(yieldFactor, 0.001));
  return {
    id: line.id,
    ingredientId: line.ingredientId,
    ingredientName: ingredient?.name ?? line.ingredientId,
    quantity: line.quantity,
    unit: line.unit,
    ratePaise,
    yieldFactor,
    effectiveCostPaise,
    rateNotSet: ratePaise <= 0,
  };
}

export function calculateRecipeCost(
  db: ProcurementDb,
  recipeId: string,
  opts?: { overheadPct?: number; packagingCostPaise?: number; portions?: number }
): RecipeCostResult | null {
  const recipe = db.recipes.find((r) => r.id === recipeId);
  if (!recipe) return null;

  const settings = getRecipeCostSettings(db, recipeId);
  const overheadPct = opts?.overheadPct ?? settings.overheadPct;
  const packagingCostPaise = opts?.packagingCostPaise ?? settings.packagingCostPaise;
  const portions = opts?.portions ?? 1;

  const lines = getMenuRecipeIngredients(db, recipeId);
  const ingredientBreakdown = lines.map((line) =>
    computeIngredientLineCost(line, ingredientById(db, line.ingredientId))
  );
  const ingredientCostPaise = ingredientBreakdown.reduce((s, l) => s + l.effectiveCostPaise, 0);
  const overheadPaise = Math.round(ingredientCostPaise * (overheadPct / 100));
  const totalCostPaise = (ingredientCostPaise + overheadPaise + packagingCostPaise) * portions;
  const sellingPricePaise = recipeSellingPricePaise(recipe) * portions;
  const foodCostPct =
    sellingPricePaise > 0 ? (totalCostPaise / sellingPricePaise) * 100 : 0;
  const marginPaise = sellingPricePaise - totalCostPaise;
  const marginPct = sellingPricePaise > 0 ? (marginPaise / sellingPricePaise) * 100 : 0;
  const targetPct = recipe.foodCostTargetPct ?? 30;
  let status: RecipeCostResult["status"] = "on_target";
  if (foodCostPct > targetPct + 5) status = "critical";
  else if (foodCostPct > targetPct) status = "over_target";

  return {
    ingredientCostPaise: ingredientCostPaise * portions,
    ingredientBreakdown,
    overheadPct,
    overheadPaise: overheadPaise * portions,
    packagingCostPaise: packagingCostPaise * portions,
    totalCostPaise,
    sellingPricePaise,
    foodCostPct,
    marginPaise,
    marginPct,
    targetPct,
    status,
  };
}

export function foodCostStatusClass(
  foodCostPct: number,
  targetPct: number
): "success" | "warning" | "danger" {
  if (foodCostPct <= targetPct) return "success";
  if (foodCostPct <= targetPct + 5) return "warning";
  return "danger";
}

export function foodCostStatusLabel(
  foodCostPct: number,
  targetPct: number
): string {
  if (foodCostPct <= targetPct) return "On Target";
  const over = foodCostPct - targetPct;
  return `Over by ${over.toFixed(1)}%`;
}

export function buildRecipeCostSnapshot(
  db: ProcurementDb,
  recipeId: string,
  cost: RecipeCostResult,
  portions = 1
): RecipeCostSnapshot {
  return {
    id: uid("rcs"),
    recipeId,
    ingredientCostPaise: cost.ingredientCostPaise,
    overheadPct: cost.overheadPct,
    packagingCostPaise: cost.packagingCostPaise,
    totalCostPaise: cost.totalCostPaise,
    sellingPricePaise: cost.sellingPricePaise,
    foodCostPct: Number(cost.foodCostPct.toFixed(2)),
    marginPaise: cost.marginPaise,
    marginPct: Number(cost.marginPct.toFixed(2)),
    targetPct: cost.targetPct,
    status: cost.status,
    portions,
    createdAt: new Date().toISOString(),
  };
}

export function listMenuOverviewRows(db: ProcurementDb) {
  return db.recipes
    .filter((r) => r.isActive !== false)
    .map((recipe) => {
      const lines = getMenuRecipeIngredients(db, recipe.id);
      const costed = lines.length > 0;
      const calc = calculateRecipeCost(db, recipe.id);
      const snapshot = db.recipeCostSnapshots.find((s) => s.recipeId === recipe.id);
      return {
        recipe,
        costed,
        cost: calc,
        lastCostedAt: snapshot?.createdAt ?? null,
      };
    });
}

export function exportMenuOverviewCsv(db: ProcurementDb): string {
  const rows = listMenuOverviewRows(db);
  const header =
    "name,category,selling_price_inr,recipe_cost_inr,food_cost_pct,margin_inr,status,last_costed";
  const body = rows.map(({ recipe, costed, cost, lastCostedAt }) => {
    const selling = paiseToRupees(recipeSellingPricePaise(recipe));
    const recipeCost = cost ? paiseToRupees(cost.totalCostPaise) : 0;
    const fc = cost ? cost.foodCostPct.toFixed(1) : "";
    const margin = cost ? paiseToRupees(cost.marginPaise) : 0;
    const status = !costed
      ? "Not Costed"
      : cost
        ? foodCostStatusLabel(cost.foodCostPct, cost.targetPct)
        : "";
    return [
      `"${recipe.name.replace(/"/g, '""')}"`,
      recipe.menuCategory ?? "",
      selling.toFixed(2),
      recipeCost.toFixed(2),
      fc,
      margin.toFixed(2),
      status,
      lastCostedAt ?? "",
    ].join(",");
  });
  return [header, ...body].join("\n");
}

export { formatPaise };
