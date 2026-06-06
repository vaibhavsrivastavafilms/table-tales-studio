import type { Vendor } from "@/lib/os/procurement/types";
import { appId, getOsSupabase, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function toRow(vendor: Vendor) {
  return {
    legacy_id: vendor.id,
    name: vendor.name,
    gst_number: vendor.gstNumber,
    pan_number: vendor.panNumber,
    phone: vendor.phone,
    email: vendor.email,
    contact_person: vendor.contactPerson,
    address: vendor.address,
    payment_terms_days: vendor.paymentTermsDays,
    invoice_pattern: vendor.invoicePattern,
    status: vendor.status,
    created_at: vendor.createdAt,
    updated_at: vendor.createdAt,
  };
}

function fromRow(row: Record<string, unknown>): Vendor {
  return {
    id: appId(row as { legacy_id?: string | null; id: string }),
    name: String(row.name),
    gstNumber: (row.gst_number as string | null) ?? null,
    panNumber: (row.pan_number as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    contactPerson: (row.contact_person as string | null) ?? null,
    paymentTermsDays: Number(row.payment_terms_days ?? 15),
    invoicePattern: (row.invoice_pattern as string | null) ?? null,
    category: "Food Supplier",
    status: (row.status as Vendor["status"]) ?? "active",
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export class VendorRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<VendorRepository> {
    return new VendorRepository(await getOsSupabase());
  }

  async list(): Promise<Vendor[]> {
    const { data, error } = await this.supabase.from("vendors").select("*").order("name");
    if (error) throw new Error(`vendors list failed: ${error.message}`);
    return (data ?? []).map((row) => fromRow(row as Record<string, unknown>));
  }

  async saveAll(vendors: Vendor[]): Promise<void> {
    await upsertRows(this.supabase, "vendors", vendors.map(toRow), "legacy_id");
  }
}
