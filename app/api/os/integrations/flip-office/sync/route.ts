import { NextResponse } from "next/server";
import {
  importFlipOfficeSalesCsv,
  syncFlipOfficeCustomers,
  syncFlipOfficeMenu,
  syncFlipOfficeSales,
  updateFlipOfficeSettings,
} from "@/lib/os/integrations/flip-office";
import type { FlipOfficeIntegrationSettings } from "@/lib/os/integrations/flip-office/types";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

type SyncBody = {
  db?: ProcurementDb;
  module?: "sales" | "menu" | "customers" | "payments" | "all";
  date?: string;
  csvText?: string;
  settings?: Partial<FlipOfficeIntegrationSettings>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncBody;
    if (!body.db) {
      return NextResponse.json({ error: "db required" }, { status: 400 });
    }

    let db = body.db;
    if (body.settings) {
      db = updateFlipOfficeSettings(db, body.settings);
    }

    const date = body.date ?? new Date().toISOString().slice(0, 10);
    const module = body.module ?? "sales";
    const results = [];

    if (body.csvText) {
      const out = await importFlipOfficeSalesCsv(db, body.csvText);
      return NextResponse.json({ db: out.db, results: [out.result] });
    }

    if (module === "sales" || module === "all") {
      const out = await syncFlipOfficeSales(db, date);
      db = out.db;
      results.push(out.result);
    }
    if (module === "menu" || module === "all") {
      const out = await syncFlipOfficeMenu(db);
      db = out.db;
      results.push(out.result);
    }
    if (module === "customers" || module === "all") {
      const out = await syncFlipOfficeCustomers(db);
      db = out.db;
      results.push(out.result);
    }

    return NextResponse.json({ db, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Flip Office sync failed" },
      { status: 500 }
    );
  }
}
