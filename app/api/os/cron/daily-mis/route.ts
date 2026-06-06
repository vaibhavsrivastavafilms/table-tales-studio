import { NextResponse } from "next/server";
import {
  generateDailyMisForAllBranches,
  yesterdayKey,
} from "@/lib/os/automation/daily-mis";
import { createSeedDb } from "@/lib/os/procurement/seed";
import type { DailyMisReport, ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

/** Vercel cron: daily at 11:55 PM IST — pass ?date=YYYY-MM-DD to override. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateParam = new URL(request.url).searchParams.get("date");
    const date = dateParam ?? yesterdayKey();

    const db: ProcurementDb = createSeedDb();

    const reports = generateDailyMisForAllBranches(db, date);
    return NextResponse.json({
      ok: true,
      date,
      count: reports.length,
      reports: reports.map(summarizeReport),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { db?: ProcurementDb; date?: string };
    const db = body.db ?? createSeedDb();
    const date = body.date ?? yesterdayKey();
    const reports = generateDailyMisForAllBranches(db, date);
    return NextResponse.json({ ok: true, date, reports });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 }
    );
  }
}

function summarizeReport(r: DailyMisReport) {
  return {
    id: r.id,
    branchId: r.branchId,
    sales: r.sales,
    ordersCount: r.ordersCount,
    profitEstimate: r.profitEstimate,
  };
}
