import type { PurchaseBill, GoodsReceivedNote } from "@/lib/os/procurement/types";
import { appId, getOsSupabase, replaceChildRows, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function billToRow(bill: PurchaseBill) {
  return {
    legacy_id: bill.id,
    branch_id: bill.branchId,
    vendor_id: bill.vendorId,
    vendor_name: bill.vendorName,
    invoice_number: bill.invoiceNumber,
    invoice_date: bill.invoiceDate,
    status: bill.status,
    taxable_amount: bill.taxableAmount,
    gst_amount: bill.gstAmount,
    total_value: bill.totalValue,
    extra_charges: bill.extraCharges,
    image_url: bill.document?.storageUrl ?? bill.imageDataUrl,
    pdf_url: bill.pdfDataUrl,
    ocr_json: bill.ocrJsonUrl
      ? { url: bill.ocrJsonUrl }
      : bill.ocrJson
        ? (() => {
            try {
              return JSON.parse(bill.ocrJson);
            } catch {
              return { raw: bill.ocrJson };
            }
          })()
        : null,
    revision_parent_id: bill.revisionParentId,
    posted_at: bill.postedAt,
    rejected_at: bill.rejectedAt,
    created_by: bill.createdBy,
    created_at: bill.createdAt,
  };
}

function billFromRow(row: Record<string, unknown>, items: PurchaseBill["items"]): PurchaseBill {
  const docUrl = (row.image_url as string | null) ?? null;
  return {
    id: appId(row as { legacy_id?: string | null; id: string }),
    branchId: String(row.branch_id ?? "br_prahladnagar"),
    vendorId: (row.vendor_id as string | null) ?? null,
    vendorName: String(row.vendor_name),
    invoiceNumber: String(row.invoice_number),
    invoiceDate: String(row.invoice_date),
    status: row.status as PurchaseBill["status"],
    taxableAmount: Number(row.taxable_amount ?? 0),
    gstAmount: Number(row.gst_amount ?? 0),
    totalValue: Number(row.total_value ?? 0),
    extraCharges: (row.extra_charges as PurchaseBill["extraCharges"]) ?? [],
    document: docUrl
      ? {
          id: `doc_${row.id}`,
          filename: "invoice",
          size: 0,
          mimeType: "application/octet-stream",
          storageUrl: docUrl,
        }
      : null,
    ocrJsonUrl: null,
    imageDataUrl: null,
    pdfDataUrl: null,
    ocrJson: null,
    items,
    revisionParentId: (row.revision_parent_id as string | null) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    postedAt: (row.posted_at as string | null) ?? null,
    rejectedAt: (row.rejected_at as string | null) ?? null,
    createdBy: String(row.created_by ?? "system"),
    editedAt: null,
    editedBy: null,
  };
}

export class PurchaseRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<PurchaseRepository> {
    return new PurchaseRepository(await getOsSupabase());
  }

  async listBills(): Promise<PurchaseBill[]> {
    const { data: bills, error } = await this.supabase.from("purchase_bills").select("*");
    if (error) throw new Error(`purchase_bills list failed: ${error.message}`);

    const { data: items, error: itemError } = await this.supabase.from("purchase_items").select("*");
    if (itemError) throw new Error(`purchase_items list failed: ${itemError.message}`);

    const itemsByBill = new Map<string, PurchaseBill["items"]>();
    for (const raw of items ?? []) {
      const row = raw as Record<string, unknown>;
      const billUuid = String(row.bill_id);
      const list = itemsByBill.get(billUuid) ?? [];
      list.push({
        id: String(row.id),
        billId: billUuid,
        itemId: (row.item_id as string | null) ?? null,
        itemName: String(row.item_name),
        quantity: Number(row.quantity),
        unit: String(row.unit ?? "kg"),
        rate: Number(row.rate),
        gstPercent: Number(row.gst_percent ?? 0),
        gstAmount: Number(row.gst_amount ?? 0),
        amount: Number(row.amount),
        category: "Dry Store",
        receivedQty: (row.received_qty as number | null) ?? Number(row.quantity),
        shortQty: Number(row.short_qty ?? 0),
        omissionStatus: "none",
        creditNoteId: null,
        isNewItem: Boolean(row.is_new_item),
      });
      itemsByBill.set(billUuid, list);
    }

    const billUuidToLegacy = new Map<string, string>();
    for (const row of bills ?? []) {
      const r = row as { id: string; legacy_id?: string | null };
      billUuidToLegacy.set(r.id, r.legacy_id ?? r.id);
    }

    return (bills ?? []).map((row) => {
      const r = row as Record<string, unknown> & { id: string };
      const legacyBillId = appId(r as { legacy_id?: string | null; id: string });
      const lineItems = (itemsByBill.get(r.id) ?? []).map((line) => ({
        ...line,
        billId: legacyBillId,
      }));
      return billFromRow(r, lineItems);
    });
  }

  async saveBills(bills: PurchaseBill[]): Promise<void> {
    await upsertRows(this.supabase, "purchase_bills", bills.map(billToRow), "legacy_id");

    const { data: billRows } = await this.supabase.from("purchase_bills").select("id, legacy_id");
    const billUuidByLegacy = new Map<string, string>();
    for (const row of billRows ?? []) {
      const legacy = (row as { legacy_id?: string | null }).legacy_id;
      if (legacy) billUuidByLegacy.set(legacy, String((row as { id: string }).id));
    }

    const parentIds = [...billUuidByLegacy.values()];
    const itemRows = bills.flatMap((bill) => {
      const billUuid = billUuidByLegacy.get(bill.id) ?? bill.id;
      return bill.items.map((line) => ({
        id: line.id.length === 36 ? line.id : undefined,
        bill_id: billUuid,
        item_id: line.itemId,
        item_name: line.itemName,
        quantity: line.quantity,
        unit: line.unit,
        rate: line.rate,
        gst_percent: line.gstPercent,
        gst_amount: line.gstAmount,
        amount: line.amount,
        received_qty: line.receivedQty,
        short_qty: line.shortQty,
        is_new_item: line.isNewItem ?? false,
      }));
    });

    await replaceChildRows(this.supabase, "purchase_items", "bill_id", parentIds, itemRows);
  }

  async listGrns(): Promise<GoodsReceivedNote[]> {
    const { data, error } = await this.supabase.from("grn_receipts").select("*");
    if (error) throw new Error(`grn_receipts list failed: ${error.message}`);
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: appId(r as { legacy_id?: string | null; id: string }),
        branchId: String(r.branch_id ?? "br_prahladnagar"),
        billId: String(r.bill_id),
        vendorId: (r.vendor_id as string | null) ?? null,
        vendorName: String(r.vendor_name ?? ""),
        invoiceNumber: String(r.invoice_number ?? ""),
        status: (r.status as GoodsReceivedNote["status"]) ?? "pending",
        receiptStatus: (r.receipt_status as GoodsReceivedNote["receiptStatus"]) ?? "pending",
        lines: (r.lines as GoodsReceivedNote["lines"]) ?? [],
        confirmedAt: (r.confirmed_at as string | null) ?? null,
        createdAt: String(r.created_at ?? new Date().toISOString()),
      };
    });
  }

  async saveGrns(grns: GoodsReceivedNote[]): Promise<void> {
    const rows = grns.map((g) => ({
      legacy_id: g.id,
      branch_id: g.branchId,
      bill_id: g.billId,
      vendor_id: g.vendorId,
      vendor_name: g.vendorName,
      invoice_number: g.invoiceNumber,
      status: g.status,
      receipt_status: g.receiptStatus,
      lines: g.lines,
      confirmed_at: g.confirmedAt,
      created_at: g.createdAt,
    }));
    await upsertRows(this.supabase, "grn_receipts", rows, "legacy_id");
  }
}
