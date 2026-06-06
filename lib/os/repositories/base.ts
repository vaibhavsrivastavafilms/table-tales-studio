import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export type OsSupabase = SupabaseClient;

export async function getOsSupabase(): Promise<OsSupabase> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createServerClient();
}

export function appId(row: { legacy_id?: string | null; id: string }): string {
  return row.legacy_id ?? row.id;
}

export function legacyId(id: string): { legacy_id: string } {
  return { legacy_id: id };
}

async function logRepositoryOperation(
  supabase: OsSupabase,
  table: string,
  operation: string
): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role = user
      ? ((
          await supabase.from("org_members").select("role").eq("user_id", user.id).maybeSingle()
        ).data?.role ?? null)
      : null;
    console.log("[os-repository]", {
      operation,
      table,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      role,
    });
  } catch {
    console.log("[os-repository]", { operation, table, userId: null, email: null, role: null });
  }
}

export async function upsertRows(
  supabase: OsSupabase,
  table: string,
  rows: Record<string, unknown>[],
  onConflict = "legacy_id"
): Promise<void> {
  if (!rows.length) return;
  await logRepositoryOperation(supabase, table, "upsert");
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
}

export async function replaceChildRows(
  supabase: OsSupabase,
  table: string,
  parentColumn: string,
  parentIds: string[],
  rows: Record<string, unknown>[]
): Promise<void> {
  if (parentIds.length) {
    await logRepositoryOperation(supabase, table, "delete");
    const { error: delError } = await supabase.from(table).delete().in(parentColumn, parentIds);
    if (delError) throw new Error(`${table} delete failed: ${delError.message}`);
  }
  if (rows.length) {
    await logRepositoryOperation(supabase, table, "insert");
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw new Error(`${table} insert failed: ${error.message}`);
  }
}
