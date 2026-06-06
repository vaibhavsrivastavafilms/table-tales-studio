import { NextResponse } from "next/server";
import { OsUnauthorizedError, requireOsApiSession } from "@/lib/os/auth/server";
import {
  migrateLocalProcurementDb,
} from "@/lib/os/repositories/migration-service";
import { formatRepositoryAuditMarkdown } from "@/lib/os/repositories/audit";
import type { ProcurementDb } from "@/lib/os/procurement/types";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requireOsApiSession();
    return NextResponse.json({ report: formatRepositoryAuditMarkdown() });
  } catch (error) {
    if (error instanceof OsUnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Audit failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requireOsApiSession();
    const body = (await request.json()) as { db?: ProcurementDb };
    if (!body.db) {
      return NextResponse.json({ error: "Missing local db payload." }, { status: 400 });
    }

    const result = await migrateLocalProcurementDb(body.db);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OsUnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Migration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
