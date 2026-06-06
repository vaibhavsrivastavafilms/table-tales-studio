import type { ProcurementDb } from "@/lib/os/procurement/types";
import type { FlipMenuMapping } from "@/lib/os/integrations/flip-office/types";

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalizeName(a).split(" ").filter(Boolean));
  const tb = new Set(normalizeName(b).split(" ").filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let overlap = 0;
  for (const t of ta) {
    if (tb.has(t)) overlap += 1;
  }
  return overlap / Math.max(ta.size, tb.size);
}

export type MenuMatchResult = {
  recipeId: string | null;
  recipeName: string | null;
  matchMethod: FlipMenuMapping["matchMethod"];
  confidence: number;
};

export function matchFlipMenuItemToRecipe(
  db: ProcurementDb,
  menuItemName: string,
  menuItemCode?: string | null,
  outlet?: string | null
): MenuMatchResult {
  const existing = db.flipMenuMappings.find(
    (m) =>
      m.flipMenuItemName.toLowerCase() === menuItemName.toLowerCase() ||
      (menuItemCode && m.flipMenuItemCode?.toLowerCase() === menuItemCode.toLowerCase())
  );
  if (existing?.recipeId) {
    return {
      recipeId: existing.recipeId,
      recipeName: existing.recipeName,
      matchMethod: existing.matchMethod,
      confidence: existing.confidence,
    };
  }

  const recipes = db.recipes.filter((r) => r.status === "active" || r.isActive !== false);
  const scoped = outlet
    ? recipes.filter((r) => !r.outlet || r.outlet === outlet || r.outlet === "Table Tales")
    : recipes;

  if (menuItemCode) {
    const byCode = scoped.find(
      (r) => r.id.toLowerCase() === menuItemCode.toLowerCase()
    );
    if (byCode) {
      return {
        recipeId: byCode.id,
        recipeName: byCode.name,
        matchMethod: "auto_code",
        confidence: 0.95,
      };
    }
  }

  const exact = scoped.find(
    (r) => normalizeName(r.name) === normalizeName(menuItemName)
  );
  if (exact) {
    return {
      recipeId: exact.id,
      recipeName: exact.name,
      matchMethod: "auto_name",
      confidence: 0.98,
    };
  }

  let best: { recipeId: string; recipeName: string; score: number } | null = null;
  for (const recipe of scoped) {
    const score = tokenOverlap(recipe.name, menuItemName);
    if (score >= 0.6 && (!best || score > best.score)) {
      best = { recipeId: recipe.id, recipeName: recipe.name, score };
    }
  }

  if (best) {
    return {
      recipeId: best.recipeId,
      recipeName: best.recipeName,
      matchMethod: "auto_fuzzy",
      confidence: best.score,
    };
  }

  return {
    recipeId: null,
    recipeName: null,
    matchMethod: "unmapped",
    confidence: 0,
  };
}

export function upsertFlipMenuMapping(
  db: ProcurementDb,
  input: {
    flipMenuItemId: string;
    flipMenuItemName: string;
    flipMenuItemCode?: string | null;
    recipeId: string | null;
    recipeName: string | null;
    matchMethod: FlipMenuMapping["matchMethod"];
    confidence: number;
  }
): ProcurementDb {
  const now = new Date().toISOString();
  const existing = db.flipMenuMappings.find(
    (m) =>
      m.flipMenuItemId === input.flipMenuItemId ||
      m.flipMenuItemName.toLowerCase() === input.flipMenuItemName.toLowerCase()
  );

  const row: FlipMenuMapping = {
    id: existing?.id ?? `fmap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    flipMenuItemId: input.flipMenuItemId,
    flipMenuItemName: input.flipMenuItemName,
    flipMenuItemCode: input.flipMenuItemCode ?? null,
    recipeId: input.recipeId,
    recipeName: input.recipeName,
    matchMethod: input.matchMethod,
    confidence: input.confidence,
    updatedAt: now,
  };

  return {
    ...db,
    flipMenuMappings: existing
      ? db.flipMenuMappings.map((m) => (m.id === existing.id ? row : m))
      : [row, ...db.flipMenuMappings],
  };
}

export function setManualMenuMapping(
  db: ProcurementDb,
  flipMenuItemName: string,
  recipeId: string
): ProcurementDb {
  const recipe = db.recipes.find((r) => r.id === recipeId);
  if (!recipe) return db;

  return upsertFlipMenuMapping(db, {
    flipMenuItemId: `manual_${normalizeName(flipMenuItemName).replace(/\s/g, "_")}`,
    flipMenuItemName,
    recipeId,
    recipeName: recipe.name,
    matchMethod: "manual",
    confidence: 1,
  });
}

export function listUnmappedFlipMenuItems(db: ProcurementDb): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of db.flipSaleItems.filter((i) => i.mappingStatus === "unmapped")) {
    counts.set(item.menuItemName, (counts.get(item.menuItemName) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
