import {
  EXPENSE_MANAGER_THRESHOLD_PAISE,
  EXPENSE_OWNER_THRESHOLD_PAISE,
  PURCHASE_MANAGER_THRESHOLD_PAISE,
  PURCHASE_OWNER_THRESHOLD_PAISE,
  rupeesToPaise,
} from "@/lib/os/money";
import type {
  ApprovalRequest,
  ApprovalType,
  ProcurementDb,
  ProcurementRole,
} from "@/lib/os/procurement/types";

export const APPROVAL_THRESHOLDS = {
  purchase: { manager: PURCHASE_MANAGER_THRESHOLD_PAISE, owner: PURCHASE_OWNER_THRESHOLD_PAISE },
  expense: { manager: EXPENSE_MANAGER_THRESHOLD_PAISE, owner: EXPENSE_OWNER_THRESHOLD_PAISE },
} as const;

export function requiredRoleForAmountPaise(
  type: "purchase" | "expense",
  amountPaise: number
): ProcurementRole {
  const t = APPROVAL_THRESHOLDS[type];
  if (amountPaise >= t.owner) return "owner";
  if (amountPaise >= t.manager) return "procurement_manager";
  return "store_manager";
}

/** @deprecated pass paise — kept for bill.totalValue (rupees) callers */
export function requiredRoleForAmount(
  type: "purchase" | "expense",
  amountRupees: number
): ProcurementRole {
  return requiredRoleForAmountPaise(type, rupeesToPaise(amountRupees));
}

export function requiredRoleForApproval(
  type: ApprovalType,
  amountPaise: number
): ProcurementRole {
  switch (type) {
    case "purchase":
    case "expense":
      return requiredRoleForAmountPaise(type, amountPaise);
    case "credit_note":
      return "accountant";
    case "inventory_adjustment":
      return "procurement_manager";
    case "payroll":
      return "owner";
  }
}

export function listPendingApprovals(db: ProcurementDb, branchId?: string) {
  return db.approvalRequests.filter(
    (a) =>
      a.status === "pending" &&
      (!branchId || branchId === "all" || a.branchId === branchId)
  );
}

export function listApprovalsByStatus(
  db: ProcurementDb,
  status: ApprovalRequest["status"] | "all",
  branchId?: string
) {
  return db.approvalRequests.filter((a) => {
    const branchOk = !branchId || branchId === "all" || a.branchId === branchId;
    const statusOk = status === "all" || a.status === status;
    return branchOk && statusOk;
  });
}

export function countPendingApprovals(db: ProcurementDb, branchId?: string): number {
  return listPendingApprovals(db, branchId).length;
}

export function buildApprovalRequest(
  input: Omit<
    ApprovalRequest,
    "id" | "createdAt" | "reviewedAt" | "reviewedBy" | "status" | "requiredRole"
  >,
  id: string,
  now: string
): ApprovalRequest {
  return {
    ...input,
    id,
    requiredRole: requiredRoleForApproval(input.type, input.amountPaise),
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: now,
  };
}

export function canReviewApproval(role: ProcurementRole, request: ApprovalRequest): boolean {
  if (role === "owner") return true;
  if (request.requiredRole === "accountant") return role === "accountant";
  if (request.requiredRole === "owner") return false;
  if (request.requiredRole === "procurement_manager") {
    return role === "procurement_manager" || role === "accountant";
  }
  return role === "store_manager" || role === "procurement_manager";
}

export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  purchase: "Purchase",
  expense: "Expense",
  credit_note: "Credit Note",
  inventory_adjustment: "Inventory Adj.",
  payroll: "Payroll",
};
