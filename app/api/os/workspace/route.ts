import { NextResponse } from "next/server";
import { OsUnauthorizedError, requireOsApiSession } from "@/lib/os/auth/server";
import { procurementDbRepository } from "@/lib/os/repositories/procurement-db-repository";
import type { ProcurementDb } from "@/lib/os/procurement/types";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requireOsApiSession();
    const db = await procurementDbRepository.load();
    return NextResponse.json({ db });
  } catch (error) {
    if (error instanceof OsUnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to load workspace.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requireOsApiSession();
    const body = (await request.json()) as { db?: ProcurementDb };
    if (!body.db) {
      return NextResponse.json({ error: "Missing db payload." }, { status: 400 });
    }
    await procurementDbRepository.save(body.db);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OsUnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to save workspace.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
