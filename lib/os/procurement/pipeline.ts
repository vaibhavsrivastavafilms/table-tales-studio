import { resolveItemByNameOrAlias } from "@/lib/os/procurement/aliases";
import { applyOcrTotalsToBill } from "@/lib/os/procurement/bill-totals";
import { suggestCategory } from "@/lib/os/procurement/categories";
import {
  addPurchaseBillDraft,
  createGrnFromBill,
  createInventoryItem,
  findVendorByName,
} from "@/lib/os/procurement/local-db";
import type {
  AutomationSummary,
  GoodsReceivedNote,
  InventoryCategory,
  OcrBillResult,
  ProcurementDb,
  PurchaseBill,
  Vendor,
} from "@/lib/os/procurement/types";

export type { AutomationSummary };

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function ensureVendor(db: ProcurementDb, ocr: OcrBillResult): { db: ProcurementDb; vendor: Vendor; action: "matched" | "created" } {
  const name =
    ocr.vendorName.trim() ||
    (ocr.vendorGst ? `Supplier GST ${ocr.vendorGst}` : "Supplier (verify name)");

  const existing = findVendorByName(db, name);
  if (existing) {
    return { db, vendor: existing, action: "matched" };
  }

  const vendor: Vendor = {
    id: uid("vnd"),
    name,
    gstNumber: ocr.vendorGst ?? null,
    phone: ocr.vendorPhone ?? null,
    address: ocr.vendorAddress ?? null,
    email: ocr.vendorEmail ?? null,
    paymentTermsDays: 15,
    invoicePattern: null,
    category: "Food Supplier",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  return {
    db: { ...db, vendors: [...db.vendors, vendor] },
    vendor,
    action: "created",
  };
}

function ensureInventoryItems(
  db: ProcurementDb,
  ocr: OcrBillResult,
  vendorId: string
): {
  db: ProcurementDb;
  itemsCreated: number;
  itemsMatched: number;
  categoriesAssigned: { itemName: string; category: InventoryCategory }[];
} {
  let next = db;
  let itemsCreated = 0;
  let itemsMatched = 0;
  const categoriesAssigned: { itemName: string; category: InventoryCategory }[] = [];

  for (const line of ocr.items) {
    const existing = resolveItemByNameOrAlias(next, line.itemName, vendorId);
    if (existing) {
      itemsMatched += 1;
      continue;
    }

    const category = line.suggestedCategory ?? suggestCategory(line.itemName);
    const created = createInventoryItem(next, line.itemName, category);
    next = {
      ...created.db,
      inventoryItems: created.db.inventoryItems.map((i) =>
        i.id === created.item.id
          ? { ...i, unit: line.unit ?? "kg", status: "active" as const }
          : i
      ),
    };
    itemsCreated += 1;
    categoriesAssigned.push({ itemName: line.itemName, category });
  }

  return { db: next, itemsCreated, itemsMatched, categoriesAssigned };
}

export function processAutomatedBillUpload(
  db: ProcurementDb,
  ocr: OcrBillResult,
  imageDataUrl: string | null,
  pdfDataUrl: string | null = null
): {
  db: ProcurementDb;
  bill: PurchaseBill;
  grn: GoodsReceivedNote;
  vendor: Vendor;
  summary: AutomationSummary;
} {
  const { db: withVendor, vendor, action: vendorAction } = ensureVendor(db, ocr);
  const ocrLines = ocr.items.filter((row) => row.itemName?.trim() && row.quantity > 0);
  const {
    db: withItems,
    itemsCreated,
    itemsMatched,
    categoriesAssigned,
  } = ensureInventoryItems(withVendor, { ...ocr, items: ocrLines }, vendor.id);

  const totals = applyOcrTotalsToBill(ocr);

  const billPayload: Omit<
    PurchaseBill,
    "id" | "createdAt" | "postedAt" | "rejectedAt" | "editedAt" | "editedBy"
  > & { createdBy?: string } = {
    vendorId: vendor.id,
    vendorName: vendor.name,
    invoiceNumber: ocr.invoiceNumber,
    invoiceDate: ocr.invoiceDate,
    status: "draft",
    taxableAmount: totals.taxableAmount,
    gstAmount: totals.gstAmount,
    totalValue: totals.totalValue,
    extraCharges: totals.extraCharges,
    imageDataUrl,
    pdfDataUrl,
    ocrJson: JSON.stringify(ocr),
    revisionParentId: null,
    createdBy: "ocr",
    items: ocrLines.map((row) => {
      const existing = resolveItemByNameOrAlias(withItems, row.itemName, vendor.id);
      const category = row.suggestedCategory ?? suggestCategory(row.itemName);
      return {
        id: "",
        billId: "",
        itemId: existing?.id ?? null,
        itemName: row.itemName,
        quantity: row.quantity,
        unit: row.unit ?? "kg",
        rate: row.rate,
        gstPercent: row.gstPercent,
        gstAmount: row.amount - row.amount / (1 + row.gstPercent / 100),
        amount: row.amount,
        category,
        receivedQty: row.quantity,
        shortQty: 0,
        omissionStatus: "none" as const,
        creditNoteId: null,
        isNewItem: !existing,
      };
    }),
  };

  const billResult = addPurchaseBillDraft(withItems, billPayload);
  let next = billResult.db;

  const grnResult = createGrnFromBill(next, billResult.bill.id);
  if (!grnResult) {
    throw new Error("Failed to create GRN");
  }
  next = {
    ...grnResult.db,
    grns: grnResult.db.grns.map((g) =>
      g.id === grnResult.grn.id
        ? { ...g, status: "pending", receiptStatus: "pending" as const }
        : g
    ),
  };

  return {
    db: next,
    bill: billResult.bill,
    grn: { ...grnResult.grn, status: "pending", receiptStatus: "pending" },
    vendor,
    summary: {
      vendorAction,
      vendorName: vendor.name,
      itemsCreated,
      itemsMatched,
      categoriesAssigned,
      grnId: grnResult.grn.id,
      billId: billResult.bill.id,
    },
  };
}
