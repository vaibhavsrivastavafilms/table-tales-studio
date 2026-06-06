import type { ProcurementDb } from "@/lib/os/procurement/types";
import { createSeedDb } from "@/lib/os/procurement/seed";
import { getOsSupabase, type OsSupabase } from "@/lib/os/repositories/base";

const WORKSPACE_ID = "default";

/** Collections persisted in normalized tables — excluded from extension blob. */
export const NORMALIZED_KEYS: (keyof ProcurementDb)[] = [
  "branches",
  "vendors",
  "inventoryItems",
  "inventoryMovements",
  "openingStock",
  "closingStock",
  "categories",
  "purchaseBills",
  "grns",
  "recipes",
  "recipeIngredients",
  "employees",
  "attendanceRecords",
  "sales",
  "payrollRuns",
  "payrollLines",
  "operatingExpenses",
  "creditNotes",
  "vendorLedger",
  "dailyMisReports",
];

export type ExtensionPayload = Partial<
  Pick<ProcurementDb, Exclude<keyof ProcurementDb, (typeof NORMALIZED_KEYS)[number]>>
>;

export function splitProcurementDb(db: ProcurementDb): {
  normalized: Pick<ProcurementDb, (typeof NORMALIZED_KEYS)[number]>;
  extensions: ExtensionPayload;
} {
  const normalized = {} as Pick<ProcurementDb, (typeof NORMALIZED_KEYS)[number]>;
  const extensions = {} as ExtensionPayload;

  for (const key of Object.keys(db) as (keyof ProcurementDb)[]) {
    const value = db[key];
    if (NORMALIZED_KEYS.includes(key as (typeof NORMALIZED_KEYS)[number])) {
      (normalized as Record<string, unknown>)[key] = value;
    } else {
      (extensions as Record<string, unknown>)[key] = value;
    }
  }

  return { normalized, extensions };
}

export function mergeProcurementDb(
  normalized: Partial<Pick<ProcurementDb, (typeof NORMALIZED_KEYS)[number]>>,
  extensions: ExtensionPayload
): ProcurementDb {
  return { ...createSeedDb(), ...extensions, ...normalized };
}

export class ExtensionRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<ExtensionRepository> {
    return new ExtensionRepository(await getOsSupabase());
  }

  async load(): Promise<ExtensionPayload> {
    const { data, error } = await this.supabase
      .from("os_workspace_extensions")
      .select("payload")
      .eq("workspace_id", WORKSPACE_ID)
      .maybeSingle();

    if (error) throw new Error(`extensions load failed: ${error.message}`);
    return (data?.payload as ExtensionPayload) ?? {};
  }

  async save(extensions: ExtensionPayload): Promise<void> {
    const { error } = await this.supabase.from("os_workspace_extensions").upsert(
      {
        workspace_id: WORKSPACE_ID,
        payload: extensions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" }
    );
    if (error) throw new Error(`extensions save failed: ${error.message}`);
  }
}
