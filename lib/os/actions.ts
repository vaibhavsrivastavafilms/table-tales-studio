"use server";

/**
 * Server actions for Table Tales OS.
 * Procurement V1.5 runs on client localStorage; these actions are the Supabase migration surface.
 */

import type { ProcurementDb } from "@/lib/os/procurement/types";
import { generateOrgInsights } from "@/lib/os/reports/ai-insights";
import { buildFoodCostReport } from "@/lib/os/reports/food-cost";

export async function fetchOrgInsights(db: ProcurementDb, month?: string) {
  return generateOrgInsights(db, month);
}

export async function fetchFoodCostReport(db: ProcurementDb) {
  return buildFoodCostReport(db);
}

export async function persistProcurementSnapshot(_db: ProcurementDb) {
  // Wire to Supabase when moving off localStorage.
  return { ok: false as const, reason: "local_storage_mode" };
}
