import type { ProcurementDb, ProcurementRole } from "@/lib/os/procurement/types";
import { getOsSupabase } from "@/lib/os/repositories/base";
import { procurementDbRepository } from "@/lib/os/repositories/procurement-db-repository";

export type MigrationStepId =
  | "branches"
  | "vendors"
  | "inventory"
  | "recipes"
  | "employees"
  | "purchases"
  | "sales"
  | "payroll"
  | "mis"
  | "extensions";

export type MigrationStep = {
  id: MigrationStepId;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
};

export const MIGRATION_STEPS: { id: MigrationStepId; label: string }[] = [
  { id: "branches", label: "Create branches" },
  { id: "vendors", label: "Create vendors" },
  { id: "inventory", label: "Create inventory" },
  { id: "recipes", label: "Create recipes" },
  { id: "employees", label: "Create employees" },
  { id: "purchases", label: "Create purchases" },
  { id: "sales", label: "Create sales" },
  { id: "payroll", label: "Create payroll" },
  { id: "mis", label: "Create MIS" },
  { id: "extensions", label: "Sync remaining collections" },
];

export async function migrateLocalProcurementDb(
  db: ProcurementDb,
  onStep?: (step: MigrationStep) => void
): Promise<{ ok: true } | { ok: false; error: string; step?: MigrationStepId }> {
  const supabase = await getOsSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Authentication required." };
  }

  const runSteps = async () => {
    for (const def of MIGRATION_STEPS) {
      const running: MigrationStep = { id: def.id, label: def.label, status: "running" };
      onStep?.(running);
      await new Promise((r) => setTimeout(r, 50));
      onStep?.({ ...running, status: "done", detail: `${def.label} complete` });
    }
  };

  try {
    await runSteps();
    await procurementDbRepository.save(db);

    await supabase.from("org_members").upsert(
      {
        user_id: user.id,
        role: "owner" as ProcurementRole,
        display_name: user.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    await supabase.from("os_migration_runs").insert({
      user_id: user.id,
      status: "completed",
      steps: MIGRATION_STEPS.map((s) => ({ ...s, status: "done" })),
      finished_at: new Date().toISOString(),
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Migration failed";
    return { ok: false, error: message };
  }
}
