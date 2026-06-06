import type { ProcurementRole } from "@/lib/os/procurement/types";
import type { OsSession } from "@/lib/os/auth/types";
import { getOsSupabase } from "@/lib/os/repositories/base";

export async function fetchOrgMemberRole(userId: string): Promise<ProcurementRole | null> {
  const supabase = await getOsSupabase();
  const { data, error } = await supabase
    .from("org_members")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.role) return null;
  return data.role as ProcurementRole;
}

export async function upsertOrgMemberRole(
  userId: string,
  role: ProcurementRole,
  displayName?: string | null
): Promise<void> {
  const supabase = await getOsSupabase();
  const { error } = await supabase.from("org_members").upsert(
    {
      user_id: userId,
      role,
      display_name: displayName ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(`org_members upsert failed: ${error.message}`);
}

/** First authenticated user becomes org owner when no row exists yet. */
export async function ensureInitialOrgOwner(session: OsSession): Promise<void> {
  if (session.devBypass) return;

  const existing = await fetchOrgMemberRole(session.userId);
  if (existing) return;

  await upsertOrgMemberRole(session.userId, "owner", "Table Tales Owner");
}

export async function listOrgMembers(): Promise<
  { userId: string; role: ProcurementRole; displayName: string | null }[]
> {
  const supabase = await getOsSupabase();
  const { data, error } = await supabase.from("org_members").select("user_id, role, display_name");
  if (error) throw new Error(`org_members list failed: ${error.message}`);
  return (data ?? []).map((row) => ({
    userId: String((row as { user_id: string }).user_id),
    role: (row as { role: ProcurementRole }).role,
    displayName: ((row as { display_name?: string | null }).display_name ?? null) as string | null,
  }));
}
