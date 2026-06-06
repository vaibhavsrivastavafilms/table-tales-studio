import { NextResponse } from "next/server";
import { getEntityAuditTrail } from "@/lib/os/procurement/audit";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      db?: ProcurementDb;
      entityId?: string;
      limit?: number;
    };
    if (!body.db) {
      return NextResponse.json({ error: "db required" }, { status: 400 });
    }

    const limit = body.limit ?? 200;
    const trail = body.entityId
      ? getEntityAuditTrail(body.db, body.entityId)
      : body.db.auditLog;

    return NextResponse.json({
      auditLog: trail.slice(0, limit),
      total: trail.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
