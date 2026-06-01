"use client";

import { resolveItemByNameOrAlias, addItemAlias } from "@/lib/os/procurement/aliases";
import { appendAuditEntry } from "@/lib/os/procurement/audit";
import { appendAudit, normalizePurchaseItemLine } from "@/lib/os/procurement/bill-review";
import { applyCreditToDispute, syncDisputesForBill } from "@/lib/os/procurement/disputes";
import { buildOmissionFromLine, lineNeedsOmission } from "@/lib/os/procurement/procurement-controls";
import { suggestCategory } from "@/lib/os/procurement/categories";
import {
  loadStoredProcurementRaw,
  STORAGE_KEY,
} from "@/lib/os/procurement/migrate";
import { createSeedDb } from "@/lib/os/procurement/seed";
import { convertToBaseUnit, addUnitConversion } from "@/lib/os/procurement/units";
import type {
  CreditNote,
  GoodsReceivedNote,
  GrnLine,
  InternalAdjustment,
  InventoryItem,
  OmissionCase,
  ProcurementDb,
  PurchaseBill,
  PurchaseItem,
  StockOcrLine,
  Vendor,
  VendorExtractResult,
  VendorLedgerEntry,
} from "@/lib/os/procurement/types";

export { STORAGE_KEY };

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function loadProcurementDb(): ProcurementDb {
  if (typeof window === "undefined") return createSeedDb();
  return loadStoredProcurementRaw();
}

export function saveProcurementDb(db: ProcurementDb): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function findVendorByName(db: ProcurementDb, name: string): Vendor | undefined {
  const norm = name.trim().toLowerCase();
  return db.vendors.find((v) => v.name.toLowerCase() === norm);
}

export function findItemByName(
  db: ProcurementDb,
  name: string,
  vendorId?: string | null
): InventoryItem | undefined {
  return resolveItemByNameOrAlias(db, name, vendorId);
}

export { addItemAlias, addUnitConversion, convertToBaseUnit };
export {
  updateBillLineReceivedQty,
  omitBillLineToQueue,
  createBillRevision,
  getBillRevisions,
} from "@/lib/os/procurement/bill-review";

export function upsertVendorFromExtract(
  db: ProcurementDb,
  extract: VendorExtractResult
): { db: ProcurementDb; vendor: Vendor } {
  const existing =
    extract.matchedVendorId
      ? db.vendors.find((v) => v.id === extract.matchedVendorId)
      : findVendorByName(db, extract.name);

  if (existing) {
    return { db, vendor: existing };
  }

  const vendor: Vendor = {
    id: uid("vnd"),
    name: extract.name,
    gstNumber: extract.gstNumber,
    phone: extract.phone,
    address: extract.address,
    email: null,
    paymentTermsDays: extract.paymentTermsDays,
    invoicePattern: extract.invoicePattern,
    category: "Food Supplier",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  return {
    db: { ...db, vendors: [...db.vendors, vendor] },
    vendor,
  };
}

export function createInventoryItem(
  db: ProcurementDb,
  name: string,
  category?: InventoryItem["category"]
): { db: ProcurementDb; item: InventoryItem } {
  const item: InventoryItem = {
    id: uid("itm"),
    name: name.trim(),
    category: category ?? suggestCategory(name),
    unit: "kg",
    currentStock: 0,
    parLevel: 10,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  return {
    db: { ...db, inventoryItems: [...db.inventoryItems, item] },
    item,
  };
}

export function addPurchaseBillDraft(
  db: ProcurementDb,
  bill: Omit<
    PurchaseBill,
    "id" | "createdAt" | "postedAt" | "rejectedAt" | "editedAt" | "editedBy"
  > & {
    status?: PurchaseBill["status"];
    createdBy?: string;
  }
): { db: ProcurementDb; bill: PurchaseBill } {
  const items: PurchaseItem[] = bill.items.map((row) => {
    const existing = findItemByName(db, row.itemName, bill.vendorId);
    const base = {
      ...row,
      id: uid("pli"),
      billId: "",
      itemId: existing?.id ?? null,
      isNewItem: !existing,
      receivedQty: row.receivedQty ?? row.quantity,
      shortQty: 0,
      omissionStatus: row.omissionStatus ?? "none",
      creditNoteId: row.creditNoteId ?? null,
    };
    return normalizePurchaseItemLine(base);
  });

  const purchaseBill: PurchaseBill = {
    id: uid("bill"),
    vendorId: bill.vendorId,
    vendorName: bill.vendorName,
    invoiceNumber: bill.invoiceNumber,
    invoiceDate: bill.invoiceDate,
    status: bill.status ?? "draft",
    taxableAmount: bill.taxableAmount ?? bill.totalValue * 0.95,
    gstAmount: bill.gstAmount ?? bill.totalValue * 0.05,
    totalValue: bill.totalValue,
    extraCharges: bill.extraCharges ?? [],
    imageDataUrl: bill.imageDataUrl,
    pdfDataUrl: bill.pdfDataUrl ?? null,
    ocrJson: bill.ocrJson ?? null,
    revisionParentId: bill.revisionParentId ?? null,
    items: items.map((i) => ({ ...i, billId: "" })),
    createdAt: new Date().toISOString(),
    postedAt: null,
    rejectedAt: null,
    createdBy: bill.createdBy ?? "system",
    editedAt: null,
    editedBy: null,
  };
  purchaseBill.items = purchaseBill.items.map((i) => ({
    ...i,
    billId: purchaseBill.id,
  }));

  return {
    db: { ...db, purchaseBills: [purchaseBill, ...db.purchaseBills] },
    bill: purchaseBill,
  };
}

export function updatePurchaseBill(
  db: ProcurementDb,
  billId: string,
  patch: Partial<PurchaseBill>
): ProcurementDb {
  return {
    ...db,
    purchaseBills: db.purchaseBills.map((b) =>
      b.id === billId ? { ...b, ...patch, items: patch.items ?? b.items } : b
    ),
  };
}

export function updateBillVendorName(
  db: ProcurementDb,
  billId: string,
  vendorName: string
): ProcurementDb {
  const bill = db.purchaseBills.find((b) => b.id === billId);
  if (!bill) return db;

  const trimmed = vendorName.trim();
  if (!trimmed) return db;

  const matched = findVendorByName(db, trimmed);
  let next = db;

  if (matched) {
    next = updatePurchaseBill(next, billId, {
      vendorName: trimmed,
      vendorId: matched.id,
    });
  } else if (bill.vendorId) {
    next = {
      ...next,
      vendors: next.vendors.map((v) =>
        v.id === bill.vendorId ? { ...v, name: trimmed } : v
      ),
    };
    next = updatePurchaseBill(next, billId, {
      vendorName: trimmed,
      vendorId: bill.vendorId,
    });
  } else {
    next = updatePurchaseBill(next, billId, {
      vendorName: trimmed,
      vendorId: null,
    });
  }

  return {
    ...next,
    grns: next.grns.map((g) =>
      g.billId === billId
        ? {
            ...g,
            vendorName: trimmed,
            vendorId:
              next.purchaseBills.find((b) => b.id === billId)?.vendorId ?? null,
          }
        : g
    ),
  };
}

function appendLedger(
  db: ProcurementDb,
  vendorId: string,
  entry: Omit<VendorLedgerEntry, "id" | "balance" | "createdAt">
): ProcurementDb {
  const prior = db.vendorLedger
    .filter((e) => e.vendorId === vendorId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const lastBalance = prior.at(-1)?.balance ?? 0;
  const balance = lastBalance + entry.debit - entry.credit;
  const row: VendorLedgerEntry = {
    ...entry,
    id: uid("led"),
    balance,
    createdAt: new Date().toISOString(),
  };
  return { ...db, vendorLedger: [...db.vendorLedger, row] };
}

export function approvePurchaseBill(db: ProcurementDb, billId: string): ProcurementDb {
  const bill = db.purchaseBills.find((b) => b.id === billId);
  if (!bill || bill.status === "posted" || bill.status === "rejected") return db;

  const grn = db.grns.find((g) => g.billId === billId);
  if (grn && grn.status !== "confirmed") {
    db = confirmGrn(db, grn.id);
  }

  const refreshedBill = db.purchaseBills.find((b) => b.id === billId);
  if (!refreshedBill) return db;

  let next = updatePurchaseBill(db, billId, {
    status: "verified",
  });

  for (const line of refreshedBill.items) {
    if (line.omissionStatus === "omitted" || line.receivedQty <= 0) {
      continue;
    }

    let item = line.itemId
      ? next.inventoryItems.find((i) => i.id === line.itemId)
      : findItemByName(next, line.itemName, refreshedBill.vendorId);

    if (!item) {
      const created = createInventoryItem(next, line.itemName);
      next = created.db;
      item = created.item;
      line.itemId = item.id;
    }

    const grnRecord = next.grns.find(
      (g) => g.billId === refreshedBill.id && g.status === "confirmed"
    );
    const grnLine = grnRecord?.lines.find(
      (l) => l.itemId === item.id || l.itemName === line.itemName
    );
    const rawReceived = grnLine?.receivedQty ?? line.receivedQty;
    const receivedQty = convertToBaseUnit(next, item.id, rawReceived, grnLine?.unit ?? item.unit);
    const movement = {
      id: uid("mov"),
      itemId: item.id,
      billId: refreshedBill.id,
      type: "purchase" as const,
      quantity: receivedQty,
      note: `Purchase ${refreshedBill.invoiceNumber}`,
      createdAt: new Date().toISOString(),
    };

    next = {
      ...next,
      inventoryMovements: [...next.inventoryMovements, movement],
      inventoryItems: next.inventoryItems.map((i) =>
        i.id === item!.id
          ? { ...i, currentStock: i.currentStock + receivedQty }
          : i
      ),
    };

    if (lineNeedsOmission(line)) {
      const omission = buildOmissionFromLine(
        line,
        refreshedBill,
        next.omissionCases.length + 1
      );
      const existing = next.omissionCases.find(
        (c) => c.billId === refreshedBill.id && c.lineItemId === line.id && c.status === "pending"
      );
      next = {
        ...next,
        omissionCases: [
          existing
            ? { ...omission, id: existing.id, caseNumber: existing.caseNumber, createdAt: existing.createdAt }
            : omission,
          ...next.omissionCases.filter(
            (c) =>
              !(
                c.billId === refreshedBill.id &&
                c.lineItemId === line.id &&
                c.status === "pending"
              )
          ),
        ],
      };
    }
  }

  next = updatePurchaseBill(next, billId, {
    status: "posted",
    postedAt: new Date().toISOString(),
    items: refreshedBill.items,
  });

  if (bill.vendorId) {
    next = appendLedger(next, bill.vendorId, {
      vendorId: bill.vendorId,
      type: "purchase",
      referenceId: refreshedBill!.id,
      description: `Invoice ${refreshedBill!.invoiceNumber}`,
      debit: refreshedBill!.totalValue,
      credit: 0,
    });
  } else {
    const vendor = findVendorByName(next, refreshedBill!.vendorName);
    if (vendor) {
      next = appendLedger(next, vendor.id, {
        vendorId: vendor.id,
        type: "purchase",
        referenceId: bill.id,
        description: `Invoice ${refreshedBill!.invoiceNumber}`,
        debit: refreshedBill!.totalValue,
        credit: 0,
      });
      next = updatePurchaseBill(next, billId, { vendorId: vendor.id });
    }
  }

  const postedBill = next.purchaseBills.find((b) => b.id === billId)!;
  next = syncDisputesForBill(next, postedBill, "review");

  if (postedBill.imageDataUrl || postedBill.pdfDataUrl) {
    next = {
      ...next,
      vendorDocuments: [
        {
          id: uid("vdoc"),
          vendorId: postedBill.vendorId,
          billId: postedBill.id,
          disputeId: null,
          creditNoteId: null,
          docType: postedBill.pdfDataUrl ? "invoice" : "invoice",
          label: `Original invoice ${postedBill.invoiceNumber}`,
          dataUrl: postedBill.pdfDataUrl ?? postedBill.imageDataUrl,
          createdAt: new Date().toISOString(),
          createdBy: "system",
        },
        ...next.vendorDocuments,
      ],
    };
  }

  return appendAuditEntry(next, {
    entityType: "bill",
    entityId: billId,
    action: "bill_posted",
    actionType: "approve",
    detail: `Posted ${postedBill.invoiceNumber}`,
    userId: "review",
    userName: "review",
  });
}

export function rejectPurchaseBill(db: ProcurementDb, billId: string): ProcurementDb {
  return {
    ...db,
    purchaseBills: db.purchaseBills.map((b) =>
      b.id === billId
        ? { ...b, status: "rejected", rejectedAt: new Date().toISOString() }
        : b
    ),
  };
}

export function applyCreditNote(
  db: ProcurementDb,
  note: Omit<CreditNote, "id" | "createdAt" | "appliedAt" | "status" | "createdBy"> & {
    createdBy?: string;
  }
): ProcurementDb {
  const creditNote: CreditNote = {
    ...note,
    id: uid("cn"),
    status: "applied",
    createdAt: new Date().toISOString(),
    appliedAt: new Date().toISOString(),
    createdBy: note.createdBy ?? "review",
    creditNoteDate: note.creditNoteDate ?? new Date().toISOString().slice(0, 10),
    taxableAmount: note.taxableAmount ?? null,
    gstAmount: note.gstAmount ?? null,
    pdfDataUrl: note.pdfDataUrl ?? null,
    ocrJson: note.ocrJson ?? null,
    omissionId: note.omissionId ?? null,
  };

  let next: ProcurementDb = {
    ...db,
    creditNotes: [creditNote, ...db.creditNotes],
  };

  next = appendLedger(next, note.vendorId, {
    vendorId: note.vendorId,
    type: "credit_note",
    referenceId: creditNote.id,
    description: `Credit note ${note.creditNoteNumber}`,
    debit: 0,
    credit: note.amount,
  });

  const omission = note.omissionId
    ? next.omissionCases.find((c) => c.id === note.omissionId)
    : undefined;
  const dispute = note.omissionId
    ? next.vendorDisputes.find((d) => d.omissionId === note.omissionId)
    : next.vendorDisputes.find(
        (d) => d.billId === note.billId && d.itemName === note.items[0]?.itemName
      );

  if (dispute) {
    next = applyCreditToDispute(
      next,
      dispute.id,
      creditNote.id,
      note.amount,
      creditNote.createdBy
    );
  } else if (note.omissionId && omission) {
    const fullRecovery = note.amount >= omission.expectedCredit * 0.99;
    next = {
      ...next,
      omissionCases: next.omissionCases.map((c) =>
        c.id === note.omissionId
          ? {
              ...c,
              status: fullRecovery ? "resolved" : "pending",
              resolvedAt: fullRecovery ? new Date().toISOString() : null,
              creditNoteId: creditNote.id,
            }
          : c
      ),
    };
  }

  if (note.imageDataUrl || note.pdfDataUrl) {
    next = {
      ...next,
      vendorDocuments: [
        {
          id: uid("vdoc"),
          vendorId: note.vendorId,
          billId: note.billId,
          disputeId: dispute?.id ?? null,
          creditNoteId: creditNote.id,
          docType: "credit_note",
          label: `Credit note ${note.creditNoteNumber}`,
          dataUrl: note.pdfDataUrl ?? note.imageDataUrl,
          createdAt: new Date().toISOString(),
          createdBy: creditNote.createdBy,
        },
        ...next.vendorDocuments,
      ],
    };
  }

  for (const row of note.items) {
    const item = findItemByName(next, row.itemName);
    if (!item) continue;
    next = {
      ...next,
      inventoryItems: next.inventoryItems.map((i) =>
        i.id === item.id
          ? { ...i, currentStock: Math.max(0, i.currentStock - row.quantity) }
          : i
      ),
      inventoryMovements: [
        ...next.inventoryMovements,
        {
          id: uid("mov"),
          itemId: item.id,
          billId: note.billId,
          type: "adjustment",
          quantity: -row.quantity,
          note: `Credit note ${note.creditNoteNumber}`,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  return appendAuditEntry(next, {
    entityType: "credit_note",
    entityId: creditNote.id,
    action: "credit_note_applied",
    actionType: "apply",
    detail: `₹${note.amount} — original bill unchanged`,
    userId: creditNote.createdBy,
    userName: creditNote.createdBy,
  });
}

export { closeDispute, addDisputeNote } from "@/lib/os/procurement/disputes";

export function createInternalAdjustment(
  db: ProcurementDb,
  adj: Omit<InternalAdjustment, "id" | "createdAt">
): ProcurementDb {
  const row: InternalAdjustment = {
    ...adj,
    id: uid("adj"),
    createdAt: new Date().toISOString(),
  };
  let next: ProcurementDb = {
    ...db,
    internalAdjustments: [row, ...db.internalAdjustments],
  };

  if (adj.vendorId) {
    next = appendLedger(next, adj.vendorId, {
      vendorId: adj.vendorId,
      type: "adjustment",
      referenceId: row.id,
      description: `${adj.reason}: ${adj.itemName}`,
      debit: 0,
      credit: adj.amount,
    });
  }

  if (adj.itemId) {
    next = {
      ...next,
      inventoryItems: next.inventoryItems.map((i) =>
        i.id === adj.itemId
          ? { ...i, currentStock: Math.max(0, i.currentStock + adj.quantity) }
          : i
      ),
    };
  }

  return next;
}

export function resolveOmission(db: ProcurementDb, caseId: string): ProcurementDb {
  return {
    ...db,
    omissionCases: db.omissionCases.map((c) =>
      c.id === caseId
        ? { ...c, status: "resolved", resolvedAt: new Date().toISOString() }
        : c
    ),
  };
}

export function getVendorOutstanding(db: ProcurementDb, vendorId: string): number {
  const entries = db.vendorLedger.filter((e) => e.vendorId === vendorId);
  if (!entries.length) {
    return db.purchaseBills
      .filter((b) => b.vendorId === vendorId && b.status === "posted")
      .reduce((sum, b) => sum + b.totalValue, 0);
  }
  return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)?.balance ?? 0;
}

export function computeDashboardStats(db: ProcurementDb) {
  const today = new Date().toISOString().slice(0, 10);
  const todaysPurchases = db.purchaseBills
    .filter((b) => b.invoiceDate === today && b.status === "posted")
    .reduce((s, b) => s + b.totalValue, 0);

  const vendorOutstanding = db.vendors.reduce(
    (s, v) => s + getVendorOutstanding(db, v.id),
    0
  );

  const pendingCreditNotes = db.creditNotes.filter((c) => c.status === "pending").length;
  const pendingOmissions = db.omissionCases.filter((c) => c.status === "pending").length;
  const lowStockItems = db.inventoryItems.filter((i) => i.currentStock < i.parLevel).length;

  const vendorTotals = new Map<string, number>();
  for (const bill of db.purchaseBills.filter((b) => b.status === "posted")) {
    vendorTotals.set(
      bill.vendorName,
      (vendorTotals.get(bill.vendorName) ?? 0) + bill.totalValue
    );
  }
  const topVendors = [...vendorTotals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthPurchases = db.purchaseBills
    .filter(
      (b) =>
        b.status === "posted" &&
        new Date(b.invoiceDate) >= monthStart
    )
    .reduce((s, b) => s + b.totalValue, 0);

  const itemTotals = new Map<string, number>();
  for (const bill of db.purchaseBills.filter((b) => b.status === "posted")) {
    for (const line of bill.items) {
      itemTotals.set(
        line.itemName,
        (itemTotals.get(line.itemName) ?? 0) + line.quantity
      );
    }
  }
  const topItems = [...itemTotals.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const stockVariances = db.inventoryItems.filter((item) => {
    const v = computeVariance(db, item.id, today);
    return v && Math.abs(v.variance) >= 0.5;
  }).length;

  return {
    todaysPurchases,
    monthPurchases,
    vendorOutstanding,
    pendingCreditNotes,
    pendingOmissions,
    lowStockItems,
    topVendors,
    topItems,
    pendingGrns: db.grns.filter((g) => g.receiptStatus === "pending" || g.status === "pending").length,
    stockVariances,
  };
}

export function saveOpeningStockOcr(
  db: ProcurementDb,
  date: string,
  lines: StockOcrLine[]
): ProcurementDb {
  let next = { ...db };
  const rows = [...next.openingStock.filter((o) => o.date !== date)];

  for (const line of lines) {
    const item =
      (line.matchedItemId
        ? next.inventoryItems.find((i) => i.id === line.matchedItemId)
        : undefined) ?? findItemByName(next, line.itemName);
    if (!item) continue;
    const qty = convertToBaseUnit(next, item.id, line.quantity, line.unit);
    rows.push({
      id: uid("opn"),
      itemId: item.id,
      date,
      quantity: qty,
      source: "ocr",
    });
    next = {
      ...next,
      inventoryItems: next.inventoryItems.map((i) =>
        i.id === item.id ? { ...i, currentStock: qty } : i
      ),
    };
  }

  return { ...next, openingStock: rows };
}

export function saveClosingStockOcr(
  db: ProcurementDb,
  date: string,
  lines: StockOcrLine[]
): ProcurementDb {
  let next = { ...db };
  const rows = [...next.closingStock.filter((c) => c.date !== date)];

  for (const line of lines) {
    const item =
      (line.matchedItemId
        ? next.inventoryItems.find((i) => i.id === line.matchedItemId)
        : undefined) ?? findItemByName(next, line.itemName);
    if (!item) continue;
    const qty = convertToBaseUnit(next, item.id, line.quantity, line.unit);
    rows.push({
      id: uid("cls"),
      itemId: item.id,
      date,
      quantity: qty,
      source: "ocr",
    });
  }

  return { ...next, closingStock: rows };
}

export function createGrnFromBill(
  db: ProcurementDb,
  billId: string
): { db: ProcurementDb; grn: GoodsReceivedNote } | null {
  const bill = db.purchaseBills.find((b) => b.id === billId);
  if (!bill) return null;
  const existing = db.grns.find((g) => g.billId === billId);
  if (existing) return { db, grn: existing };

  const lines: GrnLine[] = bill.items.map((line) => {
    const item = line.itemId
      ? db.inventoryItems.find((i) => i.id === line.itemId)
      : findItemByName(db, line.itemName, bill.vendorId);
    const received = line.receivedQty ?? line.quantity;
    return {
      id: uid("grl"),
      itemId: item?.id ?? null,
      itemName: line.itemName,
      billedQty: line.quantity,
      receivedQty: received,
      unit: item?.unit ?? "kg",
      variance: received - line.quantity,
    };
  });

  const grn: GoodsReceivedNote = {
    id: uid("grn"),
    billId: bill.id,
    vendorId: bill.vendorId,
    vendorName: bill.vendorName,
    invoiceNumber: bill.invoiceNumber,
    status: "pending",
    receiptStatus: "pending",
    lines,
    createdAt: new Date().toISOString(),
    confirmedAt: null,
  };

  return {
    db: { ...db, grns: [grn, ...db.grns] },
    grn,
  };
}

export function updateGrn(
  db: ProcurementDb,
  grnId: string,
  patch: Partial<GoodsReceivedNote>
): ProcurementDb {
  return {
    ...db,
    grns: db.grns.map((g) =>
      g.id === grnId ? { ...g, ...patch, lines: patch.lines ?? g.lines } : g
    ),
  };
}

export function confirmGrn(db: ProcurementDb, grnId: string): ProcurementDb {
  const grn = db.grns.find((g) => g.id === grnId);
  if (!grn) return db;

  const lines = grn.lines.map((l) => ({
    ...l,
    variance: l.receivedQty - l.billedQty,
  }));
  const allReceived = lines.every((l) => l.receivedQty >= l.billedQty);
  const anyReceived = lines.some((l) => l.receivedQty > 0);
  const receiptStatus = allReceived
    ? "received"
    : anyReceived
      ? "partial"
      : "pending";

  let next = updateGrn(db, grnId, {
    status: "confirmed",
    receiptStatus,
    confirmedAt: new Date().toISOString(),
    lines,
  });

  const bill = next.purchaseBills.find((b) => b.id === grn.billId);
  if (bill) {
    next = updatePurchaseBill(next, bill.id, {
      items: bill.items.map((line) => {
        const grnLine = grn.lines.find(
          (l) => l.itemId === line.itemId || l.itemName === line.itemName
        );
        return grnLine
          ? { ...line, receivedQty: grnLine.receivedQty }
          : line;
      }),
    });
  }

  return next;
}

export function computeVariance(
  db: ProcurementDb,
  itemId: string,
  date: string
): { expected: number; actual: number; variance: number } | null {
  const opening = db.openingStock.find((o) => o.itemId === itemId && o.date === date);
  const closing = db.closingStock.find((c) => c.itemId === itemId && c.date === date);
  if (!opening || !closing) return null;

  const purchases = db.inventoryMovements
    .filter(
      (m) =>
        m.itemId === itemId &&
        m.type === "purchase" &&
        m.createdAt.slice(0, 10) === date
    )
    .reduce((s, m) => s + m.quantity, 0);

  const consumption = db.inventoryMovements
    .filter(
      (m) =>
        m.itemId === itemId &&
        m.type === "consumption" &&
        m.createdAt.slice(0, 10) === date
    )
    .reduce((s, m) => s + Math.abs(m.quantity), 0);

  const expected = opening.quantity + purchases - consumption;
  return {
    expected,
    actual: closing.quantity,
    variance: closing.quantity - expected,
  };
}
