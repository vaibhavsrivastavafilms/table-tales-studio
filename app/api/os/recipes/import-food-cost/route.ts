import { NextResponse } from "next/server";
import { createSeedDb } from "@/lib/os/procurement/seed";
import { parseFoodCostSummaryFromPdf } from "@/lib/os/kitchen/food-cost-sheet-parser";
import {
  analyzeFoodCostSheet,
  importFoodCostSummary,
} from "@/lib/os/kitchen/food-cost-sheet-import";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const dryRun = form.get("dryRun") === "1" || form.get("dryRun") === "true";
  const dbRaw = form.get("db");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload the Food Cost Sheet PDF." }, { status: 400 });
  }

  let db: ProcurementDb = createSeedDb();
  if (typeof dbRaw === "string" && dbRaw.trim()) {
    try {
      db = JSON.parse(dbRaw) as ProcurementDb;
    } catch {
      return NextResponse.json({ error: "Invalid db payload" }, { status: 400 });
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = await parseFoodCostSummaryFromPdf(buffer);

    if (dryRun) {
      const report = analyzeFoodCostSheet(db, rows);
      return NextResponse.json({ report, rows: rows.length });
    }

    const { db: nextDb, report } = importFoodCostSummary(db, rows);
    return NextResponse.json({ report, db: nextDb, rows: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
