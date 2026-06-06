import { appendAuditEntry } from "@/lib/os/procurement/audit";
import {
  computeExpectedCredit,
  computeShortQty,
  deriveOmissionStatus,
} from "@/lib/os/procurement/procurement-controls";
import type {
  DisputeReason,
  DisputeStatus,
  ProcurementDb,
  PurchaseBill,
  PurchaseItem,
  VendorDisputeRecord,
  VendorDisputeSummary,
} from "@/lib/os/procurement/types";

const DEFAULT_BRANCH = "Main Kitchen";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function inferDisputeReason(
  billQty: number,
  receivedQty: number
): DisputeReason {
  if (receivedQty <= 0) return "Missing Item";
  if (receivedQty < billQty) return "Short Supply";
  return "Other";
}

export function buildDisputeFromLine(
  line: PurchaseItem,
  bill: PurchaseBill,
  omissionId: string | null,
  reason: DisputeReason,
  createdBy: string,
  seq: number
): VendorDisputeRecord {
  const billQty = line.quantity;
  const receivedQty = Math.max(0, line.receivedQty ?? billQty);
  const differenceQty = computeShortQty(billQty, receivedQty);
  const expectedCredit = computeExpectedCredit(differenceQty, line.rate);
  const now = new Date().toISOString();

  return {
    id: `dsp_${line.id}`,
    branchId: bill.branchId,
    disputeNumber: `DSP-${String(seq).padStart(5, "0")}`,
    vendorId: bill.vendorId,
    vendorName: bill.vendorName,
    billId: bill.id,
    invoiceNumber: bill.invoiceNumber,
    invoiceDate: bill.invoiceDate,
    lineItemId: line.id,
    itemId: line.itemId,
    itemName: line.itemName,
    billQty,
    receivedQty,
    differenceQty,
    rate: line.rate,
    gstPercent: line.gstPercent,
    gstAmount: line.gstAmount,
    expectedCredit,
    receivedCredit: 0,
    pendingCredit: expectedCredit,
    reason,
    status: "open",
    omissionId,
    creditNoteId: null,
    branch: DEFAULT_BRANCH,
    internalNotes: null,
    createdBy,
    createdAt: now,
    updatedAt: now,
    closedAt: null,
    closedBy: null,
  };
}

export function syncDisputesForBill(
  db: ProcurementDb,
  bill: PurchaseBill,
  createdBy = "review",
  defaultReason?: DisputeReason
): ProcurementDb {
  const others = db.vendorDisputes.filter((d) => d.billId !== bill.id);
  const existingForBill = db.vendorDisputes.filter((d) => d.billId === bill.id);
  let seq = db.vendorDisputes.length + 1;
  const fresh: VendorDisputeRecord[] = [];

  for (const line of bill.items) {
    const received = line.receivedQty ?? line.quantity;
    if (deriveOmissionStatus(line.quantity, received) === "none") continue;

    const omission = db.omissionCases.find(
      (c) => c.billId === bill.id && c.lineItemId === line.id && c.status === "pending"
    );
    const existing = existingForBill.find((d) => d.lineItemId === line.id);
    const reason =
      defaultReason ??
      (existing?.reason as DisputeReason) ??
      inferDisputeReason(line.quantity, received);

    const row = buildDisputeFromLine(
      line,
      bill,
      omission?.id ?? existing?.omissionId ?? null,
      reason,
      createdBy,
      seq
    );
    seq += 1;

    fresh.push(
      existing
        ? {
            ...row,
            id: existing.id,
            disputeNumber: existing.disputeNumber,
            receivedCredit: existing.receivedCredit,
            pendingCredit: Math.max(
              0,
              row.expectedCredit - existing.receivedCredit
            ),
            status: resolveDisputeStatus(
              row.expectedCredit,
              existing.receivedCredit,
              existing.status
            ),
            creditNoteId: existing.creditNoteId,
            omissionId: omission?.id ?? existing.omissionId,
            internalNotes: existing.internalNotes,
            createdAt: existing.createdAt,
            createdBy: existing.createdBy,
            closedAt: existing.closedAt,
            closedBy: existing.closedBy,
          }
        : row
    );
  }

  const activeLineIds = new Set(fresh.map((f) => f.lineItemId));
  const keptClosed = existingForBill.filter(
    (d) => !activeLineIds.has(d.lineItemId) && d.status === "closed"
  );

  let next: ProcurementDb = {
    ...db,
    vendorDisputes: [...fresh, ...keptClosed, ...others],
  };

  for (const dispute of fresh) {
    next = upsertCreditRecoveryForDispute(next, dispute);
  }

  return next;
}

function resolveDisputeStatus(
  expected: number,
  received: number,
  current: DisputeStatus
): DisputeStatus {
  if (current === "closed" || current === "rejected") return current;
  if (received <= 0) return "open";
  if (received >= expected * 0.99) return "resolved";
  return "partial";
}

export function upsertCreditRecoveryForDispute(
  db: ProcurementDb,
  dispute: VendorDisputeRecord
): ProcurementDb {
  const others = db.creditRecoveries.filter((r) => r.disputeId !== dispute.id);
  const balance = Math.max(0, dispute.expectedCredit - dispute.receivedCredit);
  const status =
    balance <= 0
      ? "received"
      : dispute.receivedCredit > 0
        ? "partial"
        : "pending";

  const row = {
    id: `rcv_${dispute.id}`,
    disputeId: dispute.id,
    omissionId: dispute.omissionId,
    vendorId: dispute.vendorId,
    vendorName: dispute.vendorName,
    invoiceNumber: dispute.invoiceNumber,
    itemName: dispute.itemName,
    expectedCredit: dispute.expectedCredit,
    receivedCredit: dispute.receivedCredit,
    balance,
    status: status as "pending" | "partial" | "received" | "closed",
    creditNoteId: dispute.creditNoteId,
    updatedAt: new Date().toISOString(),
  };

  return { ...db, creditRecoveries: [row, ...others] };
}

export function applyCreditToDispute(
  db: ProcurementDb,
  disputeId: string,
  creditNoteId: string,
  amount: number,
  actor: string
): ProcurementDb {
  const dispute = db.vendorDisputes.find((d) => d.id === disputeId);
  if (!dispute) return db;

  const receivedCredit = dispute.receivedCredit + amount;
  const pendingCredit = Math.max(0, dispute.expectedCredit - receivedCredit);
  const status = resolveDisputeStatus(
    dispute.expectedCredit,
    receivedCredit,
    dispute.status
  );

  let next: ProcurementDb = {
    ...db,
    vendorDisputes: db.vendorDisputes.map((d) =>
      d.id === disputeId
        ? {
            ...d,
            receivedCredit,
            pendingCredit,
            creditNoteId,
            status,
            updatedAt: new Date().toISOString(),
            closedAt:
              status === "resolved" || status === "closed"
                ? new Date().toISOString()
                : d.closedAt,
            closedBy:
              status === "resolved" || status === "closed" ? actor : d.closedBy,
          }
        : d
    ),
    recoveryActivities: [
      {
        id: uid("ract"),
        disputeId,
        creditNoteId,
        amount,
        activityType: pendingCredit > 0 ? "credit_received" : "closed",
        note:
          pendingCredit > 0
            ? `Partial credit ₹${amount} received`
            : `Full credit ₹${amount} received — dispute closed`,
        createdBy: actor,
        createdAt: new Date().toISOString(),
      },
      ...db.recoveryActivities,
    ],
  };

  const updated = next.vendorDisputes.find((d) => d.id === disputeId)!;
  next = upsertCreditRecoveryForDispute(next, updated);

  if (dispute.omissionId && pendingCredit <= 0) {
    next = {
      ...next,
      omissionCases: next.omissionCases.map((c) =>
        c.id === dispute.omissionId
          ? {
              ...c,
              status: "resolved",
              resolvedAt: new Date().toISOString(),
              creditNoteId,
            }
          : c
      ),
    };
  }

  return appendAuditEntry(next, {
    entityType: "dispute",
    entityId: disputeId,
    action: "credit_applied",
    actionType: "apply",
    detail: `₹${amount} applied to dispute ${dispute.disputeNumber}`,
    userId: actor,
    oldValue: String(dispute.receivedCredit),
    newValue: String(receivedCredit),
  });
}

export function closeDispute(
  db: ProcurementDb,
  disputeId: string,
  actor: string,
  reason?: string
): ProcurementDb {
  let next: ProcurementDb = {
    ...db,
    vendorDisputes: db.vendorDisputes.map((d) =>
      d.id === disputeId
        ? {
            ...d,
            status: "closed",
            pendingCredit: 0,
            closedAt: new Date().toISOString(),
            closedBy: actor,
            updatedAt: new Date().toISOString(),
          }
        : d
    ),
  };

  const dispute = next.vendorDisputes.find((d) => d.id === disputeId);
  if (dispute) {
    next = upsertCreditRecoveryForDispute(next, {
      ...dispute,
      status: "closed",
    });
  }

  return appendAuditEntry(next, {
    entityType: "dispute",
    entityId: disputeId,
    action: "dispute_closed",
    actionType: "close",
    detail: reason ?? "Dispute closed by authorized user",
    userId: actor,
    reason: reason ?? null,
  });
}

export function addDisputeNote(
  db: ProcurementDb,
  disputeId: string,
  text: string,
  createdBy: string
): ProcurementDb {
  return {
    ...db,
    disputeNotes: [
      {
        id: uid("dnote"),
        disputeId,
        text,
        createdBy,
        createdAt: new Date().toISOString(),
      },
      ...db.disputeNotes,
    ],
  };
}

export function buildVendorDisputeSummaries(
  db: ProcurementDb
): VendorDisputeSummary[] {
  const vendorIds = new Set<string>();
  for (const d of db.vendorDisputes) {
    if (d.vendorId) vendorIds.add(d.vendorId);
  }

  return [...vendorIds].map((vendorId) => {
    const vendor = db.vendors.find((v) => v.id === vendorId);
    const vendorName =
      vendor?.name ??
      db.vendorDisputes.find((d) => d.vendorId === vendorId)?.vendorName ??
      "Unknown";
    const disputes = db.vendorDisputes.filter((d) => d.vendorId === vendorId);

    const purchases = db.purchaseBills
      .filter((b) => b.vendorId === vendorId && b.status === "posted")
      .reduce((s, b) => s + b.totalValue, 0);

    const recoveredCredits = disputes.reduce((s, d) => s + d.receivedCredit, 0);
    const pendingRecoverable = disputes.reduce((s, d) => s + d.pendingCredit, 0);

    return {
      id: `disp_${vendorId}`,
      vendorId,
      vendorName,
      totalPurchases: purchases,
      totalCreditNotes: recoveredCredits,
      pendingCredits: disputes.filter((d) => d.pendingCredit > 0).length,
      recoveredCredits,
      pendingRecoverable,
      caseCount: disputes.length,
      openDisputes: disputes.filter(
        (d) => d.status === "open" || d.status === "partial" || d.status === "credit_requested"
      ).length,
      closedDisputes: disputes.filter(
        (d) => d.status === "closed" || d.status === "resolved"
      ).length,
      updatedAt: new Date().toISOString(),
    };
  }).sort((a, b) => b.pendingRecoverable - a.pendingRecoverable);
}

export function computeDisputeCenterStats(db: ProcurementDb) {
  const disputes = db.vendorDisputes;
  const open = disputes.filter(
    (d) =>
      d.status === "open" ||
      d.status === "partial" ||
      d.status === "credit_requested"
  );
  const closed = disputes.filter(
    (d) => d.status === "closed" || d.status === "resolved"
  );

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthKey = monthStart.toISOString().slice(0, 7);

  const recoveredAmount = disputes.reduce((s, d) => s + d.receivedCredit, 0);
  const pendingAmount = disputes.reduce((s, d) => s + d.pendingCredit, 0);

  const resolvedWithDates = closed.filter((d) => d.closedAt && d.createdAt);
  const avgResolutionDays =
    resolvedWithDates.length > 0
      ? resolvedWithDates.reduce((s, d) => {
          const days =
            (new Date(d.closedAt!).getTime() - new Date(d.createdAt).getTime()) /
            (1000 * 60 * 60 * 24);
          return s + days;
        }, 0) / resolvedWithDates.length
      : 0;

  const byVendor = new Map<string, number>();
  for (const d of disputes) {
    byVendor.set(
      d.vendorName,
      (byVendor.get(d.vendorName) ?? 0) + d.expectedCredit
    );
  }
  const topVendors = [...byVendor.entries()]
    .map(([vendorName, amount]) => ({ vendorName, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const byItem = new Map<string, number>();
  for (const d of disputes) {
    byItem.set(d.itemName, (byItem.get(d.itemName) ?? 0) + 1);
  }
  const mostDisputedItems = [...byItem.entries()]
    .map(([itemName, count]) => ({ itemName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recoveredThisMonth = db.recoveryActivities
    .filter((a) => a.createdAt.slice(0, 7) === monthKey)
    .reduce((s, a) => s + a.amount, 0);

  return {
    totalDisputes: disputes.length,
    pendingDisputes: open.length,
    resolvedDisputes: closed.length,
    recoveredAmount,
    pendingAmount,
    recoveredThisMonth,
    avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
    topVendors,
    mostDisputedItems,
  };
}

export function getDisputeDetailBundle(db: ProcurementDb, disputeId: string) {
  const dispute = db.vendorDisputes.find((d) => d.id === disputeId);
  if (!dispute) return null;

  const bill = db.purchaseBills.find((b) => b.id === dispute.billId);
  const grn = db.grns.find((g) => g.billId === dispute.billId);
  const creditNotes = db.creditNotes.filter(
    (c) =>
      c.id === dispute.creditNoteId ||
      c.omissionId === dispute.omissionId ||
      c.billId === dispute.billId
  );
  const notes = db.disputeNotes.filter((n) => n.disputeId === disputeId);
  const activities = db.recoveryActivities.filter((a) => a.disputeId === disputeId);
  const documents = db.vendorDocuments.filter(
    (d) =>
      d.disputeId === disputeId ||
      d.billId === dispute.billId ||
      d.vendorId === dispute.vendorId
  );
  const editHistory = db.billEditHistory.filter(
    (h) => h.billId === dispute.billId && h.lineItemId === dispute.lineItemId
  );
  const auditTrail = db.auditLog.filter(
    (a) =>
      a.entityId === disputeId ||
      a.entityId === dispute.billId ||
      a.entityId === dispute.lineItemId
  );

  return {
    dispute,
    bill,
    grn,
    creditNotes,
    notes,
    activities,
    documents,
    editHistory,
    auditTrail,
    recovery: db.creditRecoveries.find((r) => r.disputeId === disputeId),
  };
}

export function migrateDisputesFromOmissions(db: ProcurementDb): ProcurementDb {
  if (db.vendorDisputes.length > 0) return db;

  let next = db;
  let seq = 1;
  for (const omission of db.omissionCases) {
    const bill = db.purchaseBills.find((b) => b.id === omission.billId);
    const line = bill?.items.find((l) => l.id === omission.lineItemId);
    if (!bill || !line) continue;

    const dispute = buildDisputeFromLine(
      line,
      bill,
      omission.id,
      omission.receivedQty <= 0 ? "Missing Item" : "Short Supply",
      omission.createdBy,
      seq
    );
    seq += 1;

    const creditNote = omission.creditNoteId
      ? db.creditNotes.find((c) => c.id === omission.creditNoteId)
      : undefined;
    const receivedCredit = creditNote?.amount ?? 0;

    next = {
      ...next,
      vendorDisputes: [
        ...next.vendorDisputes,
        {
          ...dispute,
          receivedCredit,
          pendingCredit: Math.max(0, dispute.expectedCredit - receivedCredit),
          status: resolveDisputeStatus(
            dispute.expectedCredit,
            receivedCredit,
            omission.status === "resolved" ? "resolved" : "open"
          ),
          creditNoteId: omission.creditNoteId,
        },
      ],
    };
    next = upsertCreditRecoveryForDispute(
      next,
      next.vendorDisputes[next.vendorDisputes.length - 1]!
    );
  }

  return next;
}
