import type {
  InventoryItem,
  InventoryMovement,
  OpeningStock,
  ClosingStock,
  Category,
} from "@/lib/os/procurement/types";
import { appId, getOsSupabase, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function itemToRow(item: InventoryItem) {
  return {
    legacy_id: item.id,
    name: item.name,
    category: item.category,
    unit: item.unit,
    current_stock: item.currentStock,
    par_level: item.parLevel,
    status: item.status,
    created_at: item.createdAt,
  };
}

function itemFromRow(row: Record<string, unknown>): InventoryItem {
  return {
    id: appId(row as { legacy_id?: string | null; id: string }),
    name: String(row.name),
    category: row.category as InventoryItem["category"],
    unit: String(row.unit ?? "kg"),
    currentStock: Number(row.current_stock ?? 0),
    parLevel: Number(row.par_level ?? 0),
    status: (row.status as InventoryItem["status"]) ?? "active",
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export class InventoryRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<InventoryRepository> {
    return new InventoryRepository(await getOsSupabase());
  }

  async listItems(): Promise<InventoryItem[]> {
    const { data, error } = await this.supabase.from("inventory_items").select("*").order("name");
    if (error) throw new Error(`inventory_items list failed: ${error.message}`);
    return (data ?? []).map((row) => itemFromRow(row as Record<string, unknown>));
  }

  async saveItems(items: InventoryItem[]): Promise<void> {
    await upsertRows(this.supabase, "inventory_items", items.map(itemToRow), "legacy_id");
  }

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase.from("categories").select("*");
    if (error) throw new Error(`categories list failed: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: String((row as { id: string }).id),
      name: (row as { name: Category["name"] }).name,
    }));
  }

  async saveCategories(categories: Category[]): Promise<void> {
    if (!categories.length) return;
    const rows = categories.map((c) => ({ id: c.id, name: c.name }));
    const { error } = await this.supabase.from("categories").upsert(rows, { onConflict: "name" });
    if (error) throw new Error(`categories upsert failed: ${error.message}`);
  }

  async listMovements(): Promise<InventoryMovement[]> {
    const { data, error } = await this.supabase.from("inventory_movements").select("*");
    if (error) throw new Error(`inventory_movements list failed: ${error.message}`);
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        branchId: (r.branch_id as string | null) ?? "br_prahladnagar",
        itemId: String(r.item_id),
        billId: (r.bill_id as string | null) ?? null,
        type: r.type as InventoryMovement["type"],
        quantity: Number(r.quantity),
        note: (r.note as string | null) ?? null,
        createdAt: String(r.created_at ?? new Date().toISOString()),
      };
    });
  }

  async saveMovements(movements: InventoryMovement[], itemIdMap: Map<string, string>): Promise<void> {
    const rows = movements.map((m) => ({
      id: m.id.length === 36 ? m.id : undefined,
      branch_id: m.branchId,
      item_id: itemIdMap.get(m.itemId) ?? m.itemId,
      bill_id: m.billId,
      type: m.type,
      quantity: m.quantity,
      note: m.note,
      created_at: m.createdAt,
    }));
    if (!rows.length) return;
    const { error } = await this.supabase.from("inventory_movements").upsert(rows);
    if (error) throw new Error(`inventory_movements upsert failed: ${error.message}`);
  }

  async listOpeningStock(): Promise<OpeningStock[]> {
    const { data, error } = await this.supabase.from("opening_stock").select("*");
    if (error) throw new Error(`opening_stock list failed: ${error.message}`);
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        itemId: String(r.item_id),
        date: String(r.date),
        quantity: Number(r.quantity),
        source: (r.source as OpeningStock["source"]) ?? "manual",
      };
    });
  }

  async listClosingStock(): Promise<ClosingStock[]> {
    const { data, error } = await this.supabase.from("closing_stock").select("*");
    if (error) throw new Error(`closing_stock list failed: ${error.message}`);
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        itemId: String(r.item_id),
        date: String(r.date),
        quantity: Number(r.quantity),
        source: (r.source as ClosingStock["source"]) ?? "manual",
      };
    });
  }
}
