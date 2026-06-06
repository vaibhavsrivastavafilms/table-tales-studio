import { appendAuditEntry } from "@/lib/os/procurement/audit";
import { buildApprovalRequest } from "@/lib/os/approvals/engine";
import { createDefaultBranches } from "@/lib/os/branches";
import { syncVaultFromProcurement, updateVaultDocumentTags } from "@/lib/os/documents/vault";
import {
  buildExpenseRecord,
  needsExpenseApproval,
} from "@/lib/os/finance/expenses";
import { generateNotifications, defaultNotificationPreferences } from "@/lib/os/notifications/engine";
import { generateDailyMis } from "@/lib/os/automation/daily-mis";
import { rupeesToPaise } from "@/lib/os/money";
import type {
  ApprovalRequest,
  ApprovalStatus,
  Branch,
  ExpenseCategory,
  ExpenseRecurrence,
  NotificationPreferences,
  OperatingExpense,
  ProcurementDb,
  VaultDocument,
} from "@/lib/os/procurement/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function upsertBranch(
  db: ProcurementDb,
  branch: Omit<Branch, "createdAt"> & { createdAt?: string },
  actor: string
): ProcurementDb {
  const now = branch.createdAt ?? new Date().toISOString();
  const existing = db.branches.find((b) => b.id === branch.id);
  const nextBranch: Branch = { ...branch, createdAt: existing?.createdAt ?? now };
  let next: ProcurementDb = {
    ...db,
    branches: existing
      ? db.branches.map((b) => (b.id === branch.id ? nextBranch : b))
      : [...db.branches, nextBranch],
  };
  next = appendAuditEntry(next, {
    entityType: "branch",
    entityId: branch.id,
    action: existing ? "branch_updated" : "branch_created",
    actionType: existing ? "update" : "create",
    detail: `Branch ${branch.name}`,
    userId: actor,
    userName: actor,
    oldValue: existing ? JSON.stringify(existing) : null,
    newValue: JSON.stringify(nextBranch),
    reason: null,
    ip: null,
    field: "branch",
  });
  return next;
}

export function createBranch(
  db: ProcurementDb,
  input: Omit<Branch, "id" | "createdAt">,
  actor: string
): ProcurementDb {
  return upsertBranch(db, { ...input, id: uid("br"), createdAt: new Date().toISOString() }, actor);
}

export function addExpenseRecord(
  db: ProcurementDb,
  input: {
    branchId: string;
    date: string;
    category: ExpenseCategory;
    vendorName: string | null;
    description: string;
    amountPaise: number;
    outlet: string;
    attachmentUrl?: string | null;
    isRecurring?: boolean;
    recurrence?: ExpenseRecurrence;
    createdBy: string;
  },
  actor: string
): ProcurementDb {
  const expense = buildExpenseRecord(
    {
      branchId: input.branchId,
      date: input.date,
      category: input.category,
      vendorName: input.vendorName,
      description: input.description,
      amountPaise: input.amountPaise,
      outlet: input.outlet,
      attachmentUrl: input.attachmentUrl ?? null,
      isRecurring: input.isRecurring ?? false,
      recurrence: input.recurrence ?? null,
      createdBy: input.createdBy,
    },
    uid("exp"),
    new Date().toISOString()
  );

  let next: ProcurementDb = {
    ...db,
    operatingExpenses: [expense, ...db.operatingExpenses],
  };

  if (needsExpenseApproval(expense.amountPaise)) {
    const approval = buildApprovalRequest(
      {
        branchId: expense.branchId,
        type: "expense",
        entityId: expense.id,
        entityLabel: expense.description,
        referenceTable: "operatingExpenses",
        amountPaise: expense.amountPaise,
        requestedBy: actor,
        note: null,
      },
      uid("apr"),
      new Date().toISOString()
    );
    next = { ...next, approvalRequests: [approval, ...next.approvalRequests] };
  }

  if (expense.attachmentUrl) {
    const doc: VaultDocument = {
      id: uid("doc"),
      branchId: expense.branchId,
      category: "expense",
      folder: "Expenses",
      title: expense.description,
      tags: ["expense", expense.category],
      dataUrl: expense.attachmentUrl,
      mimeType: "image/jpeg",
      entityId: expense.id,
      createdAt: expense.createdAt,
      createdBy: actor,
    };
    next = { ...next, vaultDocuments: [doc, ...next.vaultDocuments] };
  }

  return appendAuditEntry(next, {
    entityType: "expense",
    entityId: expense.id,
    action: "expense_created",
    actionType: "create",
    detail: expense.description,
    userId: actor,
    userName: actor,
    oldValue: null,
    newValue: JSON.stringify(expense),
    reason: null,
    ip: null,
    field: "expense",
  });
}

export function reviewApproval(
  db: ProcurementDb,
  approvalId: string,
  status: ApprovalStatus,
  actor: string,
  note?: string
): ProcurementDb {
  const req = db.approvalRequests.find((a) => a.id === approvalId);
  if (!req) return db;

  if (status === "rejected" && !note?.trim()) {
    return db;
  }

  const now = new Date().toISOString();
  let next: ProcurementDb = {
    ...db,
    approvalRequests: db.approvalRequests.map((a) =>
      a.id === approvalId
        ? {
            ...a,
            status,
            reviewedBy: actor,
            reviewedAt: now,
            note: note ?? a.note,
          }
        : a
    ),
  };

  if (req.type === "expense") {
    next = {
      ...next,
      operatingExpenses: next.operatingExpenses.map((e) => {
        if (e.id !== req.entityId) return e;
        if (status === "approved") {
          return {
            ...e,
            status: "approved",
            approvedBy: actor,
            approvedAt: now,
            auditLog: [
              ...e.auditLog,
              { action: "approved", at: now, by: actor, note: note ?? null },
            ],
          };
        }
        if (status === "rejected") {
          return {
            ...e,
            status: "rejected",
            auditLog: [
              ...e.auditLog,
              { action: "rejected", at: now, by: actor, note: note ?? null },
            ],
          };
        }
        return e;
      }),
    };
  }

  return appendAuditEntry(next, {
    entityType: "approval",
    entityId: approvalId,
    action: `approval_${status}`,
    actionType: status === "approved" ? "approve" : "reject",
    detail: `${req.type} · ${req.entityLabel}`,
    userId: actor,
    userName: actor,
    oldValue: JSON.stringify({ status: req.status }),
    newValue: JSON.stringify({ status, note }),
    reason: note ?? null,
    ip: null,
    field: "approval",
  });
}

export function refreshNotifications(db: ProcurementDb, branchId = "all"): ProcurementDb {
  const generated = generateNotifications(
    db,
    db.notificationPreferences ?? defaultNotificationPreferences(),
    branchId
  );
  return { ...db, notifications: [...generated, ...db.notifications.filter((n) => n.read)].slice(0, 80) };
}

export function markNotificationRead(db: ProcurementDb, id: string): ProcurementDb {
  return {
    ...db,
    notifications: db.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  };
}

export function updateNotificationPreferences(
  db: ProcurementDb,
  prefs: Partial<NotificationPreferences>
): ProcurementDb {
  return {
    ...db,
    notificationPreferences: {
      ...(db.notificationPreferences ?? defaultNotificationPreferences()),
      ...prefs,
    },
  };
}

export function syncDocumentVault(db: ProcurementDb): ProcurementDb {
  return { ...db, vaultDocuments: syncVaultFromProcurement(db) };
}

export function updateDocumentTags(
  db: ProcurementDb,
  documentId: string,
  tags: string[]
): ProcurementDb {
  return updateVaultDocumentTags(db, documentId, tags);
}

export function runDailyMisAutomation(
  db: ProcurementDb,
  date: string,
  branchId = "all"
): ProcurementDb {
  const report = generateDailyMis(db, date, branchId);
  return {
    ...db,
    dailyMisReports: [report, ...db.dailyMisReports.filter((r) => r.date !== date)].slice(0, 90),
  };
}

export function ensurePlatformDefaults(db: ProcurementDb): ProcurementDb {
  const now = new Date().toISOString();
  let next = {
    ...db,
    branches: db.branches?.length ? db.branches : createDefaultBranches(now),
    approvalRequests: db.approvalRequests ?? [],
    notifications: db.notifications ?? [],
    notificationPreferences:
      db.notificationPreferences ?? defaultNotificationPreferences(),
    vaultDocuments: db.vaultDocuments ?? [],
    dailyMisReports: (db.dailyMisReports ?? []).map(normalizeDailyMisReport),
  };
  next = syncDocumentVault(next);
  return next;
}

function normalizeDailyMisReport(
  report: ProcurementDb["dailyMisReports"][number]
): ProcurementDb["dailyMisReports"][number] {
  return {
    ...report,
    ordersCount: report.ordersCount ?? 0,
    attendancePresent: report.attendancePresent ?? 0,
    attendanceAbsent: report.attendanceAbsent ?? 0,
    attendanceLate: report.attendanceLate ?? 0,
    laborCostEst: report.laborCostEst ?? 0,
    expensesTotal: report.expensesTotal ?? 0,
    exportPdfUrl: report.exportPdfUrl ?? null,
    exportExcelUrl: report.exportExcelUrl ?? null,
    generatedAt: report.generatedAt ?? report.createdAt,
  };
}

export function requestPurchaseApproval(
  db: ProcurementDb,
  billId: string,
  actor: string
): ProcurementDb {
  const bill = db.purchaseBills.find((b) => b.id === billId);
  if (!bill) return db;
  const amountPaise = rupeesToPaise(bill.totalValue);
  if (amountPaise < 1_000_000) return db;
  const existing = db.approvalRequests.find(
    (a) => a.entityId === billId && a.type === "purchase" && a.status === "pending"
  );
  if (existing) return db;
  const approval = buildApprovalRequest(
    {
      branchId: bill.branchId,
      type: "purchase",
      entityId: bill.id,
      entityLabel: `${bill.vendorName} · ${bill.invoiceNumber}`,
      referenceTable: "purchaseBills",
      amountPaise,
      requestedBy: actor,
      note: null,
    },
    uid("apr"),
    new Date().toISOString()
  );
  return { ...db, approvalRequests: [approval, ...db.approvalRequests] };
}

export function hasBlockingPurchaseApproval(db: ProcurementDb, billId: string): boolean {
  const bill = db.purchaseBills.find((b) => b.id === billId);
  if (!bill) return false;
  const amountPaise = rupeesToPaise(bill.totalValue);
  if (amountPaise < 1_000_000) return false;
  return db.approvalRequests.some(
    (a) =>
      a.entityId === billId &&
      a.type === "purchase" &&
      a.status === "pending"
  );
}

export type { ApprovalRequest, OperatingExpense };
