import { NextResponse } from "next/server";
import {
  computeRecoveryDashboardStats,
  generateRecoveryInsights,
} from "@/lib/os/procurement/recovery";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { db?: ProcurementDb };
    if (!body.db) {
      return NextResponse.json({ error: "db required" }, { status: 400 });
    }

    return NextResponse.json({
      stats: computeRecoveryDashboardStats(body.db),
      insights: generateRecoveryInsights(body.db),
      recoveries: body.db.creditRecoveries,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
