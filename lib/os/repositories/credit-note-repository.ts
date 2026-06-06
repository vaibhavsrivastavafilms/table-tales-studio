import type { CreditNote, VendorLedgerEntry } from "@/lib/os/procurement/types";
import { appId, getOsSupabase, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function creditToRow(note: CreditNote) {
  return {
    legacy_id: note.id,
    branch_id: note.branchId,
    vendor_id: note.vendorId,
    bill_id: note.billId,
    credit_note_number: note.creditNoteNumber,
    credit_note_date: note.creditNoteDate,
    amount: note.amount,
    taxable_amount: note.taxableAmount,
    gst_amount: note.gstAmount,
    items: note.items,
    status: note.status,
    image_url: note.document?.storageUrl ?? note.imageDataUrl,
    pdf_url: note.pdfDataUrl,
    ocr_json: note.ocrJson ? JSON.parse(note.ocrJson) : null,
    created_at: note.createdAt,
    applied_at: note.appliedAt,
  };
}

function creditFromRow(row: Record<string, unknown>): CreditNote {
  const docUrl = (row.image_url as string | null) ?? null;
  return {
    id: appId(row as { legacy_id?: string | null; id: string }),
    branchId: String(row.branch_id ?? "br_prahladnagar"),
    vendorId: String(row.vendor_id),
    billId: (row.bill_id as string | null) ?? null,
    omissionId: null,
    creditNoteNumber: String(row.credit_note_number),
    creditNoteDate: String(row.credit_note_date ?? new Date().toISOString().slice(0, 10)),
    amount: Number(row.amount),
    taxableAmount: (row.taxable_amount as number | null) ?? null,
    gstAmount: (row.gst_amount as number | null) ?? null,
    items: (row.items as CreditNote["items"]) ?? [],
    status: row.status as CreditNote["status"],
    document: docUrl
      ? { id: `doc_${row.id}`, filename: "credit-note", size: 0, mimeType: "application/octet-stream", storageUrl: docUrl }
      : null,
    ocrJsonUrl: null,
    imageDataUrl: null,
    pdfDataUrl: null,
    ocrJson: null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    appliedAt: (row.applied_at as string | null) ?? null,
    createdBy: "system",
  };
}

export class CreditNoteRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<CreditNoteRepository> {
    return new CreditNoteRepository(await getOsSupabase());
  }

  async list(): Promise<CreditNote[]> {
    const { data, error } = await this.supabase.from("credit_notes").select("*");
    if (error) throw new Error(`credit_notes list failed: ${error.message}`);
    return (data ?? []).map((row) => creditFromRow(row as Record<string, unknown>));
  }

  async saveAll(notes: CreditNote[]): Promise<void> {
    await upsertRows(this.supabase, "credit_notes", notes.map(creditToRow), "legacy_id");
  }
}

function ledgerToRow(entry: VendorLedgerEntry) {
  return {
    id: entry.id.length === 36 ? entry.id : undefined,
    branch_id: entry.branchId,
    vendor_id: entry.vendorId,
    type: entry.type,
    reference_id: entry.referenceId ?? undefined,
    description: entry.description,
    debit: entry.debit,
    credit: entry.credit,
    balance: entry.balance,
    created_at: entry.createdAt,
  };
}

function ledgerFromRow(row: Record<string, unknown>): VendorLedgerEntry {
  return {
    id: String(row.id),
    branchId: String(row.branch_id ?? "br_prahladnagar"),
    vendorId: String(row.vendor_id),
    type: row.type as VendorLedgerEntry["type"],
    referenceId: (row.reference_id as string | null) ?? "",
    description: String(row.description),
    debit: Number(row.debit ?? 0),
    credit: Number(row.credit ?? 0),
    balance: Number(row.balance ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export class VendorLedgerRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<VendorLedgerRepository> {
    return new VendorLedgerRepository(await getOsSupabase());
  }

  async list(): Promise<VendorLedgerEntry[]> {
    const { data, error } = await this.supabase.from("vendor_ledger").select("*");
    if (error) throw new Error(`vendor_ledger list failed: ${error.message}`);
    return (data ?? []).map((row) => ledgerFromRow(row as Record<string, unknown>));
  }

  async saveAll(entries: VendorLedgerEntry[]): Promise<void> {
    if (!entries.length) return;
    const { error } = await this.supabase.from("vendor_ledger").upsert(entries.map(ledgerToRow));
    if (error) throw new Error(`vendor_ledger upsert failed: ${error.message}`);
  }
}
