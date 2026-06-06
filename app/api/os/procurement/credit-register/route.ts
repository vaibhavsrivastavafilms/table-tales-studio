import { NextResponse } from "next/server";
import {
  buildCreditRegister,
  computeCreditRegisterStats,
  generateCreditRegisterInsights,
  registerToCsv,
} from "@/lib/os/procurement/credit-register";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { db?: ProcurementDb; format?: "json" | "csv" };
    if (!body.db) {
      return NextResponse.json({ error: "db required" }, { status: 400 });
    }

    const rows = buildCreditRegister(body.db);
    const stats = computeCreditRegisterStats(body.db, rows);
    const insights = generateCreditRegisterInsights(body.db, rows);

    if (body.format === "csv") {
      return new NextResponse(registerToCsv(rows), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="credit-note-register.csv"',
        },
      });
    }

    return NextResponse.json({ rows, stats, insights });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
