import { NextResponse } from "next/server";
import {
  buildVendorDisputeSummaries,
  computeDisputeCenterStats,
  getDisputeDetailBundle,
} from "@/lib/os/procurement/disputes";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      db?: ProcurementDb;
      disputeId?: string;
    };
    if (!body.db) {
      return NextResponse.json({ error: "db required" }, { status: 400 });
    }

    if (body.disputeId) {
      const bundle = getDisputeDetailBundle(body.db, body.disputeId);
      if (!bundle) {
        return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
      }
      return NextResponse.json({ bundle });
    }

    return NextResponse.json({
      summaries: buildVendorDisputeSummaries(body.db),
      stats: computeDisputeCenterStats(body.db),
      disputes: body.db.vendorDisputes,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
