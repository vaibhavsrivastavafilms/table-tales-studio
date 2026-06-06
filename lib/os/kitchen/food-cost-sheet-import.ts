import { recipeSellingPricePaise } from "@/lib/os/kitchen/menu-cost";
import type { FoodCostSummaryRow } from "@/lib/os/kitchen/food-cost-sheet-parser";
import type { ProcurementDb, Recipe, RecipeCostSnapshot } from "@/lib/os/procurement/types";

export type RecipeMatchMethod = "exact" | "fuzzy" | "alias" | "none";

export type FoodCostImportMatch = {
  row: FoodCostSummaryRow;
  recipe: Recipe | null;
  method: RecipeMatchMethod;
  score: number;
};

export type FoodCostImportReport = {
  sourceDate: string;
  totalRows: number;
  matched: FoodCostImportMatch[];
  unmatched: FoodCostImportMatch[];
  duplicateNames: string[];
  importedSnapshots: number;
  avgFoodCostPct: number;
  overTarget: number;
};

const ALIAS_MAP: Record<string, string> = {
  "mexican bean soup": "mexican bean",
  "margherita": "margherita pizza",
  "mozzarella pizza": "margherita pizza",
  "veggie blast": "veggie blast pizza",
  "classic hawaian pizza": "classic hawaiian pizza",
  "classic hawaiian pizza": "classic hawaiian pizza",
  "paneer tikka grill": "paneer tikka",
  "haryali paneer tikka": "hariyali paneer tikka",
  "hariyali paneer tikka": "hariyali paneer tikka",
  "chinese noodle": "chinese noodle soup",
  "cheesy veg": "cheesy veg soup",
  "hot and sour": "hot and sour soup",
  "sweet corn soup": "sweet corn soup",
  "spinach corn": "spinach corn soup",
  "dahi ke kabab": "dahi ke kebab",
  "hara bhara kabab": "hara bhara kebab",
  "mac & cheese": "mac and cheese",
  "penne roseo": "penne rosso",
  "spaghetti neopolitian": "spaghetti neapolitan",
  "bankok street style noodles": "bangkok street style noodles",
  "burnt garlic corn fried rice with curry": "burnt garlic corn fried rice",
  "burmese yellow curry with steamed rice": "burmese yellow curry",
  "red thai curry with steamed rice": "red thai curry",
  "asian satay curry with steamed rice": "asian satay curry",
  "not so basic chilli garlic noodles": "chilli garlic noodles",
  "veg dum biryani": "veg dum biryani",
  "og hydrabadi biryani": "the og biryani",
  "dal makhni": "dal makhani",
  "dal makhani": "dal makhani",
  "indain breads": "indian breads",
};

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeName(value).split(" ").filter((t) => t.length > 2));
}

function scoreMatch(pdfName: string, recipeName: string): number {
  const a = normalizeName(pdfName);
  const b = normalizeName(recipeName);
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 85;

  const aliasTarget = ALIAS_MAP[a];
  if (aliasTarget && normalizeName(recipeName) === aliasTarget) return 90;

  const ta = tokenSet(pdfName);
  const tb = tokenSet(recipeName);
  if (!ta.size || !tb.size) return 0;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  const ratio = overlap / Math.max(ta.size, tb.size);
  return Math.round(ratio * 75);
}

function matchRecipe(db: ProcurementDb, row: FoodCostSummaryRow): FoodCostImportMatch {
  const recipes = db.recipes.filter((r) => r.isActive !== false);
  let best: Recipe | null = null;
  let bestScore = 0;
  let method: RecipeMatchMethod = "none";

  for (const recipe of recipes) {
    const score = scoreMatch(row.name, recipe.name);
    if (score > bestScore) {
      bestScore = score;
      best = recipe;
    }
  }

  if (best && bestScore >= 100) method = "exact";
  else if (best && ALIAS_MAP[normalizeName(row.name)]) method = "alias";
  else if (best && bestScore >= 70) method = "fuzzy";

  if (bestScore < 70) {
    return { row, recipe: null, method: "none", score: bestScore };
  }
  return { row, recipe: best, method, score: bestScore };
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function snapshotFromImportedCost(recipe: Recipe, foodCostRs: number): RecipeCostSnapshot {
  const totalCostPaise = Math.round(foodCostRs * 100);
  const sellingPricePaise = recipeSellingPricePaise(recipe);
  const foodCostPct =
    sellingPricePaise > 0 ? (totalCostPaise / sellingPricePaise) * 100 : 0;
  const marginPaise = sellingPricePaise - totalCostPaise;
  const marginPct =
    sellingPricePaise > 0 ? (marginPaise / sellingPricePaise) * 100 : 0;
  const targetPct = recipe.foodCostTargetPct ?? 30;
  let status: RecipeCostSnapshot["status"] = "on_target";
  if (foodCostPct > targetPct + 5) status = "critical";
  else if (foodCostPct > targetPct) status = "over_target";

  return {
    id: uid("rcs"),
    recipeId: recipe.id,
    ingredientCostPaise: totalCostPaise,
    overheadPct: 0,
    packagingCostPaise: 0,
    totalCostPaise,
    sellingPricePaise,
    foodCostPct: Number(foodCostPct.toFixed(2)),
    marginPaise,
    marginPct: Number(marginPct.toFixed(2)),
    targetPct,
    status,
    portions: 1,
    createdAt: new Date().toISOString(),
  };
}

export function importFoodCostSummary(
  db: ProcurementDb,
  rows: FoodCostSummaryRow[],
  sourceDate = "2025-03-29"
): { db: ProcurementDb; report: FoodCostImportReport } {
  const matches = rows.map((row) => matchRecipe(db, row));
  const matched = matches.filter((m) => m.recipe);
  const unmatched = matches.filter((m) => !m.recipe);

  const nameCounts = new Map<string, number>();
  for (const row of rows) {
    const key = normalizeName(row.name);
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }
  const duplicateNames = [...nameCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name);

  let next = db;
  const snapshots: RecipeCostSnapshot[] = [...db.recipeCostSnapshots];

  for (const { row, recipe } of matched) {
    if (!recipe) continue;
    const snapshot = snapshotFromImportedCost(recipe, row.foodCostRs);
    const rest = snapshots.filter((s) => s.recipeId !== recipe.id);
    snapshots.splice(0, snapshots.length, snapshot, ...rest);
  }

  next = { ...next, recipeCostSnapshots: snapshots.slice(0, 200) };

  const imported = matched.length;
  const avgFoodCostPct =
    imported > 0
      ? matched.reduce((sum, m) => {
          const snap = snapshots.find((s) => s.recipeId === m.recipe!.id);
          return sum + (snap?.foodCostPct ?? 0);
        }, 0) / imported
      : 0;
  const overTarget = matched.filter((m) => {
    const snap = snapshots.find((s) => s.recipeId === m.recipe!.id);
    return snap && snap.foodCostPct > snap.targetPct;
  }).length;

  return {
    db: next,
    report: {
      sourceDate,
      totalRows: rows.length,
      matched,
      unmatched,
      duplicateNames,
      importedSnapshots: imported,
      avgFoodCostPct,
      overTarget,
    },
  };
}

export function analyzeFoodCostSheet(
  db: ProcurementDb,
  rows: FoodCostSummaryRow[],
  sourceDate = "2025-03-29"
): FoodCostImportReport {
  const matches = rows.map((row) => matchRecipe(db, row));
  const matched = matches.filter((m) => m.recipe);
  const unmatched = matches.filter((m) => !m.recipe);
  const nameCounts = new Map<string, number>();
  for (const row of rows) {
    const key = normalizeName(row.name);
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }
  return {
    sourceDate,
    totalRows: rows.length,
    matched,
    unmatched,
    duplicateNames: [...nameCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([name]) => name),
    importedSnapshots: 0,
    avgFoodCostPct: 0,
    overTarget: 0,
  };
}
