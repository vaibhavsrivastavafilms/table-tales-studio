import { normalizeExpenseCategory } from "@/lib/os/finance/expense-schema";
import { rupeesToPaise } from "@/lib/os/money";
import type {
  ApprovalRequest,
  ExpenseStatus,
  OperatingExpense,
  ProcurementDb,
} from "@/lib/os/procurement/types";

type LegacyExpense = OperatingExpense & {
  amount?: number;
  vendor?: string | null;
  attachmentDataUrl?: string | null;
  recurring?: boolean;
  recurringDay?: number | null;
};

type LegacyApproval = ApprovalRequest & {
  amount?: number;
  reason?: string | null;
  referenceTable?: string;
};

export function normalizeOperatingExpense(raw: LegacyExpense): OperatingExpense {
  const category = normalizeExpenseCategory(String(raw.category));
  const amountPaise =
    raw.amountPaise ??
    (typeof raw.amount === "number" ? rupeesToPaise(raw.amount) : 0);
  const legacyStatus = String((raw as { status?: string }).status ?? "approved");
  const status: ExpenseStatus =
    legacyStatus === "pending_approval" || legacyStatus === "draft"
      ? "pending"
      : legacyStatus === "approved" || legacyStatus === "rejected"
        ? legacyStatus
        : "approved";

  return {
    id: raw.id,
    branchId: raw.branchId,
    date: raw.date,
    month: raw.month ?? raw.date.slice(0, 7),
    category: category as OperatingExpense["category"],
    vendorName: raw.vendorName ?? raw.vendor ?? null,
    description: raw.description,
    amountPaise,
    outlet: raw.outlet,
    attachmentUrl: raw.attachmentUrl ?? raw.attachmentDataUrl ?? null,
    status,
    isRecurring: raw.isRecurring ?? raw.recurring ?? false,
    recurrence: raw.recurrence ?? (raw.recurring ? "monthly" : null),
    createdBy: raw.createdBy ?? "system",
    approvedBy: raw.approvedBy ?? null,
    approvedAt: raw.approvedAt ?? (status === "approved" ? raw.createdAt : null),
    createdAt: raw.createdAt,
    auditLog: raw.auditLog ?? [{ action: "migrated", at: raw.createdAt, by: "system" }],
  };
}

export function normalizeApprovalRequest(raw: LegacyApproval): ApprovalRequest {
  const amountPaise =
    raw.amountPaise ??
    (typeof raw.amount === "number" ? rupeesToPaise(raw.amount) : 0);
  return {
    id: raw.id,
    branchId: raw.branchId,
    type: raw.type,
    entityId: raw.entityId,
    entityLabel: raw.entityLabel,
    referenceTable: raw.referenceTable ?? "unknown",
    amountPaise,
    requiredRole: raw.requiredRole,
    status: raw.status,
    requestedBy: raw.requestedBy,
    reviewedBy: raw.reviewedBy ?? null,
    note: raw.note ?? raw.reason ?? null,
    createdAt: raw.createdAt,
    reviewedAt: raw.reviewedAt ?? null,
  };
}

export function migrateFinanceV8(db: ProcurementDb): ProcurementDb {
  return {
    ...db,
    operatingExpenses: (db.operatingExpenses ?? []).map((e) =>
      normalizeOperatingExpense(e as LegacyExpense)
    ),
    approvalRequests: (db.approvalRequests ?? []).map((a) =>
      normalizeApprovalRequest(a as LegacyApproval)
    ),
  };
}
