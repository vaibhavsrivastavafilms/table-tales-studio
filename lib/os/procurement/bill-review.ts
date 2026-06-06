import { appendAuditEntry } from "@/lib/os/procurement/audit";
import { reconcileBillTotals } from "@/lib/os/procurement/bill-totals";
import { syncDisputesForBill } from "@/lib/os/procurement/disputes";
import {
  buildOmissionFromLine,
  computeShortQty,
  deriveOmissionStatus,
  lineNeedsOmission,
} from "@/lib/os/procurement/procurement-controls";
import type {
  BillEditHistory,
  GoodsReceivedNote,
  GrnLine,
  OmissionCase,
  ProcurementDb,
  PurchaseBill,
  PurchaseItem,
} from "@/lib/os/procurement/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** @deprecated Use appendAuditEntry from audit.ts */
export function appendAudit(
  db: ProcurementDb,
  entry: {
    entityType: import("@/lib/os/procurement/types").AuditEntityType;
    entityId: string;
    action: string;
    detail: string;
    userId: string;
    reason?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    field?: string | null;
  }
): ProcurementDb {
  return appendAuditEntry(db, {
    ...entry,
    actionType: entry.action.includes("created")
      ? "create"
      : entry.action.includes("deleted")
        ? "delete"
        : "update",
    userName: entry.userId,
    reason: entry.reason ?? null,
    oldValue: entry.oldValue ?? null,
    newValue: entry.newValue ?? null,
    field: entry.field ?? null,
  });
}

function normalizeLineReceipt(line: PurchaseItem): PurchaseItem {
  const billQty = line.quantity;
  const receivedQty = Math.min(
    billQty,
    Math.max(0, line.receivedQty ?? billQty)
  );
  const shortQty = computeShortQty(billQty, receivedQty);
  return {
    ...line,
    receivedQty,
    shortQty,
    omissionStatus: deriveOmissionStatus(billQty, receivedQty),
  };
}

function syncGrnLinesFromBill(bill: PurchaseBill, grn: GoodsReceivedNote): GrnLine[] {
  return bill.items.map((line, index) => {
    const prev = grn.lines.find(
      (l) => l.itemId === line.itemId || l.itemName === line.itemName
    ) ?? grn.lines[index];
    return {
      id: prev?.id ?? uid("grl"),
      itemId: line.itemId,
      itemName: line.itemName,
      billedQty: line.quantity,
      receivedQty: line.receivedQty,
      unit: line.unit,
      variance: line.receivedQty - line.quantity,
    };
  });
}

function upsertOmissionsForBill(db: ProcurementDb, bill: PurchaseBill): ProcurementDb {
  const others = db.omissionCases.filter(
    (c) => c.billId !== bill.id || c.status === "resolved"
  );
  const existingForBill = db.omissionCases.filter(
    (c) => c.billId === bill.id && c.status === "pending"
  );
  let seq = db.omissionCases.length + 1;
  const fresh: OmissionCase[] = [];

  for (const line of bill.items) {
    if (!lineNeedsOmission(line)) continue;
    const existing = existingForBill.find((c) => c.lineItemId === line.id);
    const row = buildOmissionFromLine(line, bill, seq);
    seq += 1;
    fresh.push(
      existing
        ? {
            ...row,
            id: existing.id,
            caseNumber: existing.caseNumber,
            creditNoteId: existing.creditNoteId,
            createdAt: existing.createdAt,
            createdBy: existing.createdBy,
            editedAt: new Date().toISOString(),
            editedBy: "review",
          }
        : row
    );
  }

  const pendingLineIds = new Set(fresh.map((f) => f.lineItemId));
  const keptResolved = db.omissionCases.filter(
    (c) =>
      c.billId === bill.id &&
      c.status === "resolved" &&
      !pendingLineIds.has(c.lineItemId)
  );

  return {
    ...db,
    omissionCases: [...fresh, ...keptResolved, ...others],
  };
}

export function updateBillLineReceivedQty(
  db: ProcurementDb,
  billId: string,
  lineId: string,
  receivedQty: number,
  editedBy = "review",
  reason = "GRN receipt adjustment"
): ProcurementDb {
  const bill = db.purchaseBills.find((b) => b.id === billId);
  if (!bill || bill.status === "posted" || bill.status === "rejected") return db;

  const targetLine = bill.items.find((l) => l.id === lineId);
  const originalQty = targetLine?.receivedQty ?? targetLine?.quantity ?? 0;

  const items = bill.items.map((line) => {
    if (line.id !== lineId) return line;
    return normalizeLineReceipt({ ...line, receivedQty });
  });

  let next = {
    ...db,
    purchaseBills: db.purchaseBills.map((b) =>
      b.id === billId
        ? {
            ...b,
            items,
            editedAt: new Date().toISOString(),
            editedBy,
          }
        : b
    ),
  };

  const updatedBill = next.purchaseBills.find((b) => b.id === billId)!;
  const grn = next.grns.find((g) => g.billId === billId);
  if (grn) {
    next = {
      ...next,
      grns: next.grns.map((g) =>
        g.billId === billId
          ? { ...g, lines: syncGrnLinesFromBill(updatedBill, g) }
          : g
      ),
    };
  }

  next = upsertOmissionsForBill(next, updatedBill);
  next = syncDisputesForBill(next, updatedBill, editedBy);

  if (targetLine && originalQty !== receivedQty) {
    const editRow: BillEditHistory = {
      id: uid("edh"),
      billId,
      lineItemId: lineId,
      itemName: targetLine.itemName,
      userName: editedBy,
      originalQty,
      newQty: receivedQty,
      reason,
      createdAt: new Date().toISOString(),
    };
    next = { ...next, billEditHistory: [editRow, ...next.billEditHistory] };
  }

  next = appendAuditEntry(next, {
    entityType: "line",
    entityId: lineId,
    action: "received_qty_updated",
    actionType: "update",
    detail: `Received ${receivedQty} for ${updatedBill.items.find((l) => l.id === lineId)?.itemName}`,
    userId: editedBy,
    userName: editedBy,
    oldValue: String(originalQty),
    newValue: String(receivedQty),
    reason,
    field: "receivedQty",
  });

  return ensureRevisionForOmittedItems(next, billId, editedBy);
}

export function omitBillLineToQueue(
  db: ProcurementDb,
  billId: string,
  lineId: string,
  editedBy = "review"
): ProcurementDb {
  const line = db.purchaseBills.find((b) => b.id === billId)?.items.find((l) => l.id === lineId);
  const reason = line
    ? `Missing Item — ${line.itemName} omitted from receipt`
    : "Missing Item";
  return updateBillLineReceivedQty(db, billId, lineId, 0, editedBy, reason);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getFullyOmittedLineNames(bill: PurchaseBill): string[] {
  return bill.items
    .filter((l) => l.omissionStatus === "omitted" || l.receivedQty <= 0)
    .map((l) => l.itemName);
}

function scaleLineForRevision(line: PurchaseItem): PurchaseItem | null {
  if (line.receivedQty <= 0) return null;
  const ratio = line.quantity > 0 ? line.receivedQty / line.quantity : 1;
  const amount = round2(line.amount * ratio);
  const gstAmount = round2(line.gstAmount * ratio);
  return {
    ...line,
    id: uid("pli"),
    billId: "",
    quantity: line.receivedQty,
    receivedQty: line.receivedQty,
    shortQty: 0,
    omissionStatus: "none",
    amount,
    gstAmount,
  };
}

function buildRevisionPayloadFromParent(
  parent: PurchaseBill,
  revisionBillId: string
): Pick<
  PurchaseBill,
  "items" | "taxableAmount" | "gstAmount" | "totalValue" | "extraCharges"
> {
  const items = parent.items
    .map(scaleLineForRevision)
    .filter((l): l is PurchaseItem => l !== null)
    .map((i) => ({ ...i, billId: revisionBillId }));

  const extraCharges = (parent.extraCharges ?? []).map((c) => ({
    ...c,
    id: uid("xch"),
  }));

  const itemsSubtotal = items.reduce((s, i) => s + i.amount, 0);
  const extraTotal = extraCharges.reduce((s, c) => s + c.amount, 0);
  const reconciled = reconcileBillTotals({
    items,
    extraCharges,
    totalValue: round2(itemsSubtotal + extraTotal),
    taxableAmount: undefined,
    gstAmount: undefined,
  });

  return {
    items,
    taxableAmount: reconciled.taxableAmount,
    gstAmount: reconciled.gstAmount,
    totalValue: reconciled.totalValue,
    extraCharges: reconciled.extraCharges,
  };
}

function revisionReasonForOmissions(parent: PurchaseBill): string {
  const omitted = getFullyOmittedLineNames(parent);
  if (!omitted.length) return "Revision invoice — received quantities";
  return `Revision invoice — omitted: ${omitted.join(", ")}`;
}

function findDraftRevisionBill(
  db: ProcurementDb,
  parentBillId: string
): { revision: import("@/lib/os/procurement/types").BillRevision; bill: PurchaseBill } | null {
  for (const rev of db.billRevisions.filter((r) => r.parentBillId === parentBillId)) {
    const bill = db.purchaseBills.find(
      (b) => b.id === rev.revisionBillId && b.status === "draft"
    );
    if (bill) return { revision: rev, bill };
  }
  return null;
}

/** Auto-create or refresh revision invoice when any line is fully omitted. */
export function ensureRevisionForOmittedItems(
  db: ProcurementDb,
  parentBillId: string,
  editedBy = "review"
): ProcurementDb {
  const parent = db.purchaseBills.find((b) => b.id === parentBillId);
  if (!parent || parent.status === "posted" || parent.status === "rejected") {
    return db;
  }

  const omitted = getFullyOmittedLineNames(parent);
  if (!omitted.length) return db;

  const receivedCount = parent.items.filter((l) => l.receivedQty > 0).length;
  if (receivedCount === 0) return db;

  const reason = revisionReasonForOmissions(parent);
  const existing = findDraftRevisionBill(db, parentBillId);

  if (existing) {
    const payload = buildRevisionPayloadFromParent(parent, existing.bill.id);
    let next: ProcurementDb = {
      ...db,
      purchaseBills: db.purchaseBills.map((b) =>
        b.id === existing.bill.id
          ? {
              ...b,
              ...payload,
              editedAt: new Date().toISOString(),
              editedBy,
            }
          : b
      ),
      billRevisions: db.billRevisions.map((r) =>
        r.id === existing.revision.id ? { ...r, reason } : r
      ),
    };
    return appendAuditEntry(next, {
      entityType: "revision",
      entityId: existing.revision.id,
      action: "revision_updated",
      actionType: "update",
      detail: reason,
      userId: editedBy,
      userName: editedBy,
      reason,
    });
  }

  const result = createBillRevision(db, parentBillId, reason, editedBy);
  return result?.db ?? db;
}

export function createBillRevision(
  db: ProcurementDb,
  parentBillId: string,
  reason: string,
  createdBy = "review"
): { db: ProcurementDb; revisionBill: PurchaseBill } | null {
  const parent = db.purchaseBills.find((b) => b.id === parentBillId);
  if (!parent) return null;

  const omitted = getFullyOmittedLineNames(parent);
  const useOmissionBuilder = omitted.length > 0;
  const revCount = db.billRevisions.filter((r) => r.parentBillId === parentBillId).length;
  const invoiceSuffix = revCount > 0 ? `-REV${revCount + 1}` : "-REV";
  const revisionId = uid("bill");
  const payload = useOmissionBuilder
    ? buildRevisionPayloadFromParent(parent, revisionId)
    : null;

  if (useOmissionBuilder && !payload?.items.length) return null;

  const revisionBill: PurchaseBill = {
    ...parent,
    id: revisionId,
    status: "draft",
    revisionParentId: parentBillId,
    invoiceNumber: `${parent.invoiceNumber}${invoiceSuffix}`,
    items: payload
      ? payload.items
      : parent.items.map((line) => ({
          ...line,
          id: uid("pli"),
          billId: "",
          receivedQty: line.quantity,
          shortQty: 0,
          omissionStatus: "none" as const,
        })),
    taxableAmount: payload?.taxableAmount ?? parent.taxableAmount,
    gstAmount: payload?.gstAmount ?? parent.gstAmount,
    totalValue: payload?.totalValue ?? parent.totalValue,
    extraCharges: payload?.extraCharges ?? parent.extraCharges ?? [],
    createdAt: new Date().toISOString(),
    postedAt: null,
    rejectedAt: null,
    editedAt: null,
    editedBy: null,
    createdBy,
    imageDataUrl: null,
    pdfDataUrl: null,
    ocrJson: null,
  };
  revisionBill.items = revisionBill.items.map((i) => ({
    ...i,
    billId: revisionBill.id,
  }));

  const revision: import("@/lib/os/procurement/types").BillRevision = {
    id: uid("rev"),
    parentBillId,
    revisionBillId: revisionBill.id,
    reason,
    createdAt: new Date().toISOString(),
    createdBy,
  };

  let next: ProcurementDb = {
    ...db,
    purchaseBills: [revisionBill, ...db.purchaseBills],
    billRevisions: [revision, ...db.billRevisions],
  };

  next = appendAuditEntry(next, {
    entityType: "revision",
    entityId: revision.id,
    action: "revision_created",
    actionType: "create",
    detail: reason,
    userId: createdBy,
    userName: createdBy,
    reason,
  });

  return { db: next, revisionBill };
}

export function getBillRevisions(db: ProcurementDb, billId: string) {
  return db.billRevisions.filter(
    (r) => r.parentBillId === billId || r.revisionBillId === billId
  );
}

export function normalizePurchaseItemLine(
  line: PurchaseItem,
  billQty?: number
): PurchaseItem {
  const qty = billQty ?? line.quantity;
  return normalizeLineReceipt({
    ...line,
    quantity: qty,
    receivedQty: line.receivedQty ?? qty,
    shortQty: line.shortQty ?? 0,
    omissionStatus: line.omissionStatus ?? "none",
    creditNoteId: line.creditNoteId ?? null,
  });
}
