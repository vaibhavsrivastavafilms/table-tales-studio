import type { Branch } from "@/lib/os/procurement/types";
import { appId, getOsSupabase, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function toRow(branch: Branch) {
  return {
    id: branch.id,
    name: branch.name,
    code: branch.code,
    address: branch.address,
    manager_name: branch.managerName,
    manager_phone: branch.managerPhone,
    gst_number: null,
    status: branch.status,
    settings: branch.settings,
    created_at: branch.createdAt,
    updated_at: branch.createdAt,
  };
}

function fromRow(row: Record<string, unknown>): Branch {
  return {
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    address: (row.address as string | null) ?? null,
    managerName: (row.manager_name as string | null) ?? null,
    managerPhone: (row.manager_phone as string | null) ?? null,
    settings: (row.settings as Branch["settings"]) ?? {
      timezone: "Asia/Kolkata",
      currency: "INR",
      targetFoodCostPercent: 32,
      targetLaborCostPercent: 28,
    },
    status: (row.status as Branch["status"]) ?? "active",
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export class BranchRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<BranchRepository> {
    return new BranchRepository(await getOsSupabase());
  }

  async list(): Promise<Branch[]> {
    const { data, error } = await this.supabase.from("branches").select("*").order("name");
    if (error) throw new Error(`branches list failed: ${error.message}`);
    return (data ?? []).map((row) => fromRow(row as Record<string, unknown>));
  }

  async saveAll(branches: Branch[]): Promise<void> {
    await upsertRows(this.supabase, "branches", branches.map(toRow), "id");
  }
}

export { appId };
