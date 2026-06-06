import { loadFlipOfficeMenu } from "@/lib/os/integrations/flip-office/api-client";
import {
  matchFlipMenuItemToRecipe,
  upsertFlipMenuMapping,
} from "@/lib/os/integrations/flip-office/menu-mapper";
import { finalizeFlipSync } from "@/lib/os/integrations/flip-office/operations";
import type { FlipOfficeSyncResult } from "@/lib/os/integrations/flip-office/types";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export async function syncFlipOfficeMenu(
  db: ProcurementDb,
  actor = "flip_office_sync"
): Promise<{ db: ProcurementDb; result: FlipOfficeSyncResult }> {
  void actor;
  const settings = db.flipOfficeSettings;
  if (!settings.menuSyncEnabled) {
    return {
      db,
      result: {
        module: "menu",
        recordsImported: 0,
        recordsSkipped: 0,
        errors: ["Menu sync is disabled."],
        status: "failed",
        message: "Menu sync is disabled in Flip Office settings.",
      },
    };
  }

  let next = db;
  let recordsImported = 0;
  const errors: string[] = [];

  try {
    const rows = await loadFlipOfficeMenu(db, settings);
    for (const row of rows) {
      const match = matchFlipMenuItemToRecipe(next, row.name, row.code, row.outlet ?? undefined);
      next = upsertFlipMenuMapping(next, {
        flipMenuItemId: row.id,
        flipMenuItemName: row.name,
        flipMenuItemCode: row.code ?? null,
        recipeId: match.recipeId,
        recipeName: match.recipeName,
        matchMethod: match.matchMethod,
        confidence: match.confidence,
      });
      recordsImported += 1;
      if (!match.recipeId) {
        errors.push(`Unmapped menu item: ${row.name}`);
      }
    }

    const status =
      errors.length && recordsImported === errors.length
        ? "partial"
        : errors.length
          ? "partial"
          : "success";

    const result: FlipOfficeSyncResult = {
      module: "menu",
      recordsImported,
      recordsSkipped: 0,
      errors,
      status,
      message: `Synced ${recordsImported} Flip Office menu items · ${recordsImported - errors.length} mapped to recipes.`,
    };

    next = finalizeFlipSync(next, settings, "menu", result);
    return { db: next, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Menu sync failed";
    const result: FlipOfficeSyncResult = {
      module: "menu",
      recordsImported: 0,
      recordsSkipped: 0,
      errors: [message],
      status: "failed",
      message,
    };
    next = finalizeFlipSync(next, settings, "menu", result);
    return { db: next, result };
  }
}
