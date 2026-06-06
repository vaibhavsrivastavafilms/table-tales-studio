import type { Sale } from "@/lib/os/procurement/types";
import { appId, getOsSupabase, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function toRow(sale: Sale) {
  return {
    legacy_id: sale.id,
    branch_id: sale.branchId,
    channel: sale.channel,
    recipe_id: sale.recipeId,
    recipe_name: sale.recipeName,
    quantity: sale.quantity,
    unit_price: sale.unitPrice,
    total_revenue: sale.totalRevenue,
    outlet: sale.outlet,
    consumed_at: sale.consumedAt,
  };
}

function fromRow(row: Record<string, unknown>): Sale {
  return {
    id: appId(row as { legacy_id?: string | null; id: string }),
    branchId: String(row.branch_id ?? "br_prahladnagar"),
    channel: row.channel as Sale["channel"],
    recipeId: String(row.recipe_id),
    recipeName: String(row.recipe_name),
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    totalRevenue: Number(row.total_revenue),
    outlet: String(row.outlet ?? ""),
    consumedAt: String(row.consumed_at ?? new Date().toISOString()),
    flipOfficeOrderId: null,
    flipOfficeLineId: null,
    paymentMethod: null,
    source: "manual",
  };
}

export class SaleRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<SaleRepository> {
    return new SaleRepository(await getOsSupabase());
  }

  async list(): Promise<Sale[]> {
    const { data, error } = await this.supabase.from("sales").select("*").order("consumed_at", { ascending: false });
    if (error) throw new Error(`sales list failed: ${error.message}`);
    return (data ?? []).map((row) => fromRow(row as Record<string, unknown>));
  }

  async saveAll(sales: Sale[]): Promise<void> {
    await upsertRows(this.supabase, "sales", sales.map(toRow), "legacy_id");
  }
}
