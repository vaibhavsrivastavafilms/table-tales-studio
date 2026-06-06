import { buildVendorDisputeSummaries } from "@/lib/os/procurement/disputes";
import { getVendorOutstanding } from "@/lib/os/procurement/local-db";
import type {
  BillEditHistory,
  BillRevision,
  CreditNote,
  CreditRegisterFilters,
  CreditRegisterInsight,
  CreditRegisterRow,
  CreditRegisterStats,
  CreditRegisterStatus,
  GoodsReceivedNote,
  OmissionCase,
  ProcurementDb,
  PurchaseBill,
  VendorDisputeRecord,
  VendorDisputeSummary,
  VendorLedgerEntry,
} from "@/lib/os/procurement/types";

const DEFAULT_BRANCH = "Main Kitchen";

function resolveRegisterStatus(
  dispute: VendorDisputeRecord,
  creditNote: CreditNote | undefined,
  hasAdjustment: boolean
): CreditRegisterStatus {
  if (hasAdjustment) return "adjusted";
  if (dispute.status === "rejected") return "rejected";
  if (dispute.status === "closed") return "closed";
  if (creditNote?.status === "applied") {
    if (dispute.pendingCredit > 0) return "partial";
    return "received";
  }
  if (dispute.creditNoteId && creditNote?.status === "pending") return "requested";
  if (dispute.receivedCredit > 0 && dispute.pendingCredit > 0) return "partial";
  return "pending";
}

export function buildCreditRegister(db: ProcurementDb): CreditRegisterRow[] {
  return db.vendorDisputes.map((dispute) => {
    const bill = db.purchaseBills.find((b) => b.id === dispute.billId);
    const line = bill?.items.find((l) => l.id === dispute.lineItemId);
    const creditNote = dispute.creditNoteId
      ? db.creditNotes.find((c) => c.id === dispute.creditNoteId)
      : db.creditNotes.find(
          (c) =>
            c.omissionId === dispute.omissionId || c.billId === dispute.billId
        );
    const hasAdjustment = db.internalAdjustments.some(
      (a) =>
        a.billId === dispute.billId &&
        a.itemName === dispute.itemName &&
        a.reason === "Short Supply"
    );
    const expectedCredit = dispute.expectedCredit;
    const actualCredit = dispute.receivedCredit;
    const balance = dispute.pendingCredit;

    return {
      id: `reg_${dispute.id}`,
      omissionId: dispute.omissionId ?? dispute.id,
      vendorId: dispute.vendorId,
      vendorName: dispute.vendorName,
      billId: dispute.billId,
      invoiceNumber: dispute.invoiceNumber,
      invoiceDate: dispute.invoiceDate,
      itemId: dispute.itemId,
      itemName: dispute.itemName,
      lineItemId: dispute.lineItemId,
      billQty: dispute.billQty,
      receivedQty: dispute.receivedQty,
      shortQty: dispute.differenceQty,
      rate: dispute.rate,
      unit: line?.unit ?? "kg",
      expectedCredit,
      actualCredit,
      balance,
      creditNoteNumber: creditNote?.creditNoteNumber ?? null,
      creditNoteDate: creditNote?.creditNoteDate ?? null,
      creditNoteId: creditNote?.id ?? null,
      status: resolveRegisterStatus(dispute, creditNote, hasAdjustment),
      createdBy: dispute.createdBy,
      createdAt: dispute.createdAt,
      branch: dispute.branch,
      disputeId: dispute.id,
      disputeReason: dispute.reason,
    };
  });
}

export function filterCreditRegister(
  rows: CreditRegisterRow[],
  filters: CreditRegisterFilters
): CreditRegisterRow[] {
  return rows.filter((row) => {
    if (filters.pendingOnly && row.balance <= 0 && row.status !== "pending") {
      return false;
    }
    if (filters.vendor && !row.vendorName.toLowerCase().includes(filters.vendor.toLowerCase())) {
      return false;
    }
    if (filters.invoice && !row.invoiceNumber.toLowerCase().includes(filters.invoice.toLowerCase())) {
      return false;
    }
    if (filters.item && !row.itemName.toLowerCase().includes(filters.item.toLowerCase())) {
      return false;
    }
    if (
      filters.creditNoteNumber &&
      !(row.creditNoteNumber ?? "")
        .toLowerCase()
        .includes(filters.creditNoteNumber.toLowerCase())
    ) {
      return false;
    }
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.branch && row.branch !== filters.branch) return false;
    if (filters.dateFrom && row.invoiceDate < filters.dateFrom) return false;
    if (filters.dateTo && row.invoiceDate > filters.dateTo) return false;
    if (
      filters.minAmount != null &&
      row.expectedCredit < filters.minAmount &&
      row.balance < filters.minAmount
    ) {
      return false;
    }
    if (
      filters.disputeReason !== "all" &&
      row.disputeReason !== filters.disputeReason
    ) {
      return false;
    }
    return true;
  });
}

export function computeCreditRegisterStats(
  db: ProcurementDb,
  rows: CreditRegisterRow[]
): CreditRegisterStats {
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthKey = monthStart.toISOString().slice(0, 7);

  const pendingRows = rows.filter(
    (r) =>
      r.status === "pending" ||
      r.status === "requested" ||
      r.status === "partial" ||
      r.balance > 0
  );

  const receivedRows = rows.filter(
    (r) => r.status === "received" || r.status === "closed"
  );

  const recoveredThisMonth = db.creditNotes
    .filter(
      (c) =>
        c.status === "applied" &&
        (c.appliedAt ?? c.createdAt).slice(0, 7) === monthKey
    )
    .reduce((s, c) => s + c.amount, 0);

  const vendorTotals = new Map<string, number>();
  for (const row of rows) {
    vendorTotals.set(
      row.vendorName,
      (vendorTotals.get(row.vendorName) ?? 0) + row.expectedCredit
    );
  }

  return {
    totalCreditNotes: db.creditNotes.length,
    pendingCreditNotes: pendingRows.length,
    receivedCreditNotes: receivedRows.length,
    totalRecoverable: pendingRows.reduce((s, r) => s + r.balance, 0),
    recoveredThisMonth,
    topVendorCredits: [...vendorTotals.entries()]
      .map(([vendorName, amount]) => ({ vendorName, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
  };
}

/** @deprecated Use buildVendorDisputeSummaries */
export function buildVendorDisputes(db: ProcurementDb): VendorDisputeSummary[] {
  return buildVendorDisputeSummaries(db);
}

export function generateCreditRegisterInsights(
  db: ProcurementDb,
  rows: CreditRegisterRow[]
): CreditRegisterInsight[] {
  const insights: CreditRegisterInsight[] = [];

  const byVendor = new Map<string, number>();
  for (const row of rows) {
    byVendor.set(row.vendorName, (byVendor.get(row.vendorName) ?? 0) + row.shortQty);
  }
  const topShort = [...byVendor.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topShort) {
    insights.push({
      id: "vendor-short",
      title: "Vendor with highest shortages",
      detail: `${topShort[0]} — ${topShort[1]} units short across lines`,
      severity: "warning",
    });
  }

  const byCredit = new Map<string, number>();
  for (const row of rows) {
    byCredit.set(row.vendorName, (byCredit.get(row.vendorName) ?? 0) + row.expectedCredit);
  }
  const topCredit = [...byCredit.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCredit) {
    insights.push({
      id: "vendor-credit",
      title: "Vendor with highest dispute value",
      detail: `${topCredit[0]} — ₹${Math.round(topCredit[1]).toLocaleString("en-IN")} expected`,
      severity: "info",
    });
  }

  const byItem = new Map<string, number>();
  for (const row of rows) {
    byItem.set(row.itemName, (byItem.get(row.itemName) ?? 0) + 1);
  }
  const topItem = [...byItem.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topItem && topItem[1] > 0) {
    insights.push({
      id: "disputed-item",
      title: "Most disputed item",
      detail: `${topItem[0]} — ${topItem[1]} dispute(s)`,
      severity: "warning",
    });
  }

  const pendingRecoverable = rows.reduce((s, r) => s + r.balance, 0);
  insights.push({
    id: "recoverable",
    title: "Pending recoverable amount",
    detail: `₹${Math.round(pendingRecoverable).toLocaleString("en-IN")} outstanding from vendors`,
    severity: pendingRecoverable > 10000 ? "critical" : "info",
  });

  const resolved = db.vendorDisputes.filter((d) => d.closedAt);
  if (resolved.length) {
    const avgDays =
      resolved.reduce((s, d) => {
        const days =
          (new Date(d.closedAt!).getTime() - new Date(d.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return s + days;
      }, 0) / resolved.length;
    insights.push({
      id: "avg-recovery",
      title: "Average credit recovery days",
      detail: `${Math.round(avgDays * 10) / 10} days`,
      severity: "info",
    });
  }

  const topOmissions = [...rows]
    .sort((a, b) => b.expectedCredit - a.expectedCredit)
    .slice(0, 3)
    .map((r) => `${r.itemName} (₹${Math.round(r.expectedCredit)})`)
    .join(" · ");
  if (topOmissions) {
    insights.push({
      id: "top-items",
      title: "Top 10 omission items by value",
      detail: topOmissions,
      severity: "info",
    });
  }

  const editedBills = new Set(db.billEditHistory.map((h) => h.billId)).size;
  if (editedBills) {
    insights.push({
      id: "edited-bills",
      title: "Bills with quantity edits",
      detail: `${editedBills} invoice(s) had received qty changes (immutable audit trail)`,
      severity: "info",
    });
  }

  return insights;
}

export type BillHistoryBundle = {
  bill: PurchaseBill;
  grn: GoodsReceivedNote | undefined;
  revisions: BillRevision[];
  omissions: OmissionCase[];
  disputes: VendorDisputeRecord[];
  creditNotes: CreditNote[];
  editHistory: BillEditHistory[];
  auditTrail: ProcurementDb["auditLog"];
  registerRows: CreditRegisterRow[];
  documents: ProcurementDb["vendorDocuments"];
};

export function getBillHistoryBundle(
  db: ProcurementDb,
  billId: string
): BillHistoryBundle | null {
  const bill = db.purchaseBills.find((b) => b.id === billId);
  if (!bill) return null;
  const rows = buildCreditRegister(db);
  return {
    bill,
    grn: db.grns.find((g) => g.billId === billId),
    revisions: db.billRevisions.filter(
      (r) => r.parentBillId === billId || r.revisionBillId === billId
    ),
    omissions: db.omissionCases.filter((c) => c.billId === billId),
    disputes: db.vendorDisputes.filter((d) => d.billId === billId),
    creditNotes: db.creditNotes.filter((c) => c.billId === billId),
    editHistory: db.billEditHistory.filter((h) => h.billId === billId),
    auditTrail: db.auditLog.filter(
      (a) =>
        a.entityId === billId ||
        bill.items.some((l) => l.id === a.entityId) ||
        db.vendorDisputes
          .filter((d) => d.billId === billId)
          .some((d) => a.entityId === d.id)
    ),
    registerRows: rows.filter((r) => r.billId === billId),
    documents: db.vendorDocuments.filter((d) => d.billId === billId),
  };
}

export type VendorCreditProfile = {
  dispute: VendorDisputeSummary;
  registerRows: CreditRegisterRow[];
  disputes: VendorDisputeRecord[];
  ledger: VendorLedgerEntry[];
  outstanding: number;
};

export function getVendorCreditProfile(
  db: ProcurementDb,
  vendorId: string
): VendorCreditProfile | null {
  const vendor = db.vendors.find((v) => v.id === vendorId);
  if (!vendor) return null;
  const summaries = buildVendorDisputeSummaries(db);
  const dispute = summaries.find((d) => d.vendorId === vendorId);
  if (!dispute) return null;
  const rows = buildCreditRegister(db).filter((r) => r.vendorId === vendorId);
  return {
    dispute,
    registerRows: rows,
    disputes: db.vendorDisputes.filter((d) => d.vendorId === vendorId),
    ledger: db.vendorLedger.filter((e) => e.vendorId === vendorId),
    outstanding: getVendorOutstanding(db, vendorId),
  };
}

export function registerToCsv(rows: CreditRegisterRow[]): string {
  const headers = [
    "Credit Note",
    "Vendor",
    "Invoice",
    "Invoice Date",
    "Credit Date",
    "Item",
    "Expected Credit",
    "Received Credit",
    "Pending Credit",
    "Status",
    "Reason",
    "Created By",
    "Created At",
    "Branch",
  ];
  const lines = rows.map((r) =>
    [
      r.creditNoteNumber ?? "",
      r.vendorName,
      r.invoiceNumber,
      r.invoiceDate,
      r.creditNoteDate ?? "",
      r.itemName,
      r.expectedCredit,
      r.actualCredit,
      r.balance,
      r.status,
      r.disputeReason ?? "",
      r.createdBy,
      r.createdAt,
      r.branch,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

export function disputesToCsv(disputes: VendorDisputeRecord[]): string {
  const headers = [
    "Dispute #",
    "Vendor",
    "Invoice",
    "Item",
    "Bill Qty",
    "Received",
    "Difference",
    "Rate",
    "Expected Credit",
    "Received Credit",
    "Pending",
    "Reason",
    "Status",
    "Created By",
    "Created At",
  ];
  const lines = disputes.map((d) =>
    [
      d.disputeNumber,
      d.vendorName,
      d.invoiceNumber,
      d.itemName,
      d.billQty,
      d.receivedQty,
      d.differenceQty,
      d.rate,
      d.expectedCredit,
      d.receivedCredit,
      d.pendingCredit,
      d.reason,
      d.status,
      d.createdBy,
      d.createdAt,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
