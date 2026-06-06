import { NextResponse } from "next/server";
import { importAttendanceCsv } from "@/lib/os/hr/hr-operations";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { db?: ProcurementDb; csv?: string };
    if (!body.db || !body.csv) {
      return NextResponse.json({ error: "db and csv required" }, { status: 400 });
    }
    const result = importAttendanceCsv(body.db, body.csv, "api");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ imported: 0, skipped: 0, db: null }, { status: 500 });
  }
}
