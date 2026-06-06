import { NextResponse } from "next/server";
import { createExpenseSchema } from "@/lib/os/finance/expense-schema";
import { exportExpensesCsv, listExpenses } from "@/lib/os/finance/expenses";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "validate" | "export";
      db?: ProcurementDb;
      input?: unknown;
      branchId?: string;
      month?: string;
    };

    if (body.action === "validate") {
      const parsed = createExpenseSchema.safeParse(body.input);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, errors: parsed.error.flatten() },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true, data: parsed.data });
    }

    if (body.action === "export" && body.db) {
      const rows = listExpenses(body.db, body.branchId ?? "all", {
        month: body.month,
      });
      return NextResponse.json({ csv: exportExpensesCsv(rows) });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 }
    );
  }
}
