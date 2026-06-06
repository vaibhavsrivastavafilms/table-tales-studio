import { NextResponse } from "next/server";
import { requireOsSession } from "@/lib/os/auth/server";
import {
  fetchOrgMemberRole,
  upsertOrgMemberRole,
} from "@/lib/os/repositories/org-member-repository";
import type { ProcurementRole } from "@/lib/os/procurement/types";
import { isSupabaseConfigured } from "@/lib/supabase";

const VALID_ROLES: ProcurementRole[] = [
  "owner",
  "accountant",
  "procurement_manager",
  "store_manager",
  "kitchen_manager",
];

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ role: "owner" as ProcurementRole, source: "default" });
  }

  try {
    const session = await requireOsSession();
    const role = (await fetchOrgMemberRole(session.userId)) ?? ("owner" as ProcurementRole);
    return NextResponse.json({ role, source: "supabase" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load role.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const session = await requireOsSession();
    const body = (await request.json()) as { role?: ProcurementRole };
    if (!body.role || !VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    await upsertOrgMemberRole(session.userId, body.role, session.email);
    return NextResponse.json({ ok: true, role: body.role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save role.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
