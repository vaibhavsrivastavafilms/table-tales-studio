import { NextResponse } from "next/server";
import { calculateRecipeCost } from "@/lib/os/kitchen/menu-cost";
import {
  bulkImportIngredientRates,
  recalculateAllRecipesForIngredient,
} from "@/lib/os/kitchen/menu-operations";
import { createSeedDb } from "@/lib/os/procurement/seed";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "calculate" | "recalculate" | "bulkImport";
      db?: ProcurementDb;
      recipeId?: string;
      ingredientId?: string;
      overheadPct?: number;
      packagingCostPaise?: number;
      portions?: number;
      csv?: string;
    };

    const db = body.db ?? createSeedDb();

    if (body.action === "calculate" && body.recipeId) {
      const result = calculateRecipeCost(db, body.recipeId, {
        overheadPct: body.overheadPct,
        packagingCostPaise: body.packagingCostPaise,
        portions: body.portions,
      });
      return NextResponse.json({ ok: true, result });
    }

    if (body.action === "recalculate" && body.ingredientId) {
      const next = recalculateAllRecipesForIngredient(db, body.ingredientId);
      return NextResponse.json({ ok: true, snapshotCount: next.recipeCostSnapshots.length });
    }

    if (body.action === "bulkImport" && body.csv) {
      const { db: next, result } = bulkImportIngredientRates(db, body.csv);
      return NextResponse.json({ ok: true, result, snapshotCount: next.recipeCostSnapshots.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 }
    );
  }
}
