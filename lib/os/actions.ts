"use server";

import { procurementDbRepository } from "@/lib/os/repositories/procurement-db-repository";
import type { ProcurementDb } from "@/lib/os/procurement/types";
import { generateOrgInsights } from "@/lib/os/reports/ai-insights";
import { buildFoodCostReport } from "@/lib/os/reports/food-cost";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function fetchOrgInsights(db: ProcurementDb, month?: string) {
  return generateOrgInsights(db, month);
}

export async function fetchFoodCostReport(db: ProcurementDb) {
  return buildFoodCostReport(db);
}

export async function persistProcurementSnapshot(db: ProcurementDb) {
  if (!isSupabaseConfigured()) {
    return { ok: false as const, reason: "supabase_not_configured" };
  }
  await procurementDbRepository.save(db);
  return { ok: true as const };
}
