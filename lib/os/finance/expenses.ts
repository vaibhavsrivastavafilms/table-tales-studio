import { filterByBranch } from "@/lib/os/branches";
import {
  EXPENSE_MANAGER_THRESHOLD_PAISE,
  EXPENSE_OWNER_THRESHOLD_PAISE,
  formatPaise,
  paiseToRupees,
} from "@/lib/os/money";
import { requiredRoleForApproval } from "@/lib/os/approvals/engine";
import type {
  ExpenseCategory,
  ExpenseStatus,
  OperatingExpense,
  ProcurementDb,
} from "@/lib/os/procurement/types";
import type { ExpenseCategoryDb } from "@/lib/os/finance/expense-schema";
import { EXPENSE_CATEGORIES } from "@/lib/os/finance/expense-schema";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  Rent: "Rent",
  Electricity: "Electricity",
  Gas: "Gas",
  Water: "Water",
  Internet: "Internet",
  Marketing: "Marketing",
  Maintenance: "Maintenance",
  Repairs: "Repairs",
  Licenses: "Licenses",
  Software: "Software",
  PettyCash: "Petty Cash",
  Housekeeping: "Housekeeping",
  Uniforms: "Uniforms",
  Transport: "Transport",
  Miscellaneous: "Miscellaneous",
};

export function expenseAmountRupees(expense: OperatingExpense): number {
  return paiseToRupees(expense.amountPaise);
}

export function listExpenses(
  db: ProcurementDb,
  branchId = "all",
  opts?: {
    month?: string;
    fromDate?: string;
    toDate?: string;
    category?: ExpenseCategory;
    status?: ExpenseStatus;
  }
) {
  let rows = filterByBranch(db.operatingExpenses, branchId);
  if (opts?.month) rows = rows.filter((e) => e.month === opts.month);
  if (opts?.fromDate) rows = rows.filter((e) => e.date >= opts.fromDate!);
  if (opts?.toDate) rows = rows.filter((e) => e.date <= opts.toDate!);
  if (opts?.category) rows = rows.filter((e) => e.category === opts.category);
  if (opts?.status) rows = rows.filter((e) => e.status === opts.status);
  return [...rows].sort((a, b) => b.date.localeCompare(a.date));
}

export function monthlyExpenseTotalPaise(
  db: ProcurementDb,
  month: string,
  branchId = "all"
): number {
  return listExpenses(db, branchId, { month })
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + e.amountPaise, 0);
}

export function dailyExpenseTotalPaise(
  db: ProcurementDb,
  date: string,
  branchId = "all"
): number {
  return listExpenses(db, branchId, { fromDate: date, toDate: date })
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + e.amountPaise, 0);
}

/** @deprecated use monthlyExpenseTotalPaise */
export function monthlyExpenseTotal(db: ProcurementDb, month: string, branchId = "all") {
  return paiseToRupees(monthlyExpenseTotalPaise(db, month, branchId));
}

export function expensesByCategory(db: ProcurementDb, month: string, branchId = "all") {
  const map = new Map<ExpenseCategory, number>();
  for (const e of listExpenses(db, branchId, { month }).filter((x) => x.status === "approved")) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amountPaise);
  }
  return EXPENSE_CATEGORIES.map((category) => ({
    category,
    label: EXPENSE_CATEGORY_LABELS[category as ExpenseCategory],
    totalPaise: map.get(category as ExpenseCategory) ?? 0,
    totalRupees: paiseToRupees(map.get(category as ExpenseCategory) ?? 0),
  })).filter((r) => r.totalPaise > 0);
}

export function needsExpenseApproval(amountPaise: number): boolean {
  return amountPaise >= EXPENSE_MANAGER_THRESHOLD_PAISE;
}

export function expenseApprovalRole(amountPaise: number) {
  if (amountPaise >= EXPENSE_OWNER_THRESHOLD_PAISE) return "owner";
  if (amountPaise >= EXPENSE_MANAGER_THRESHOLD_PAISE) return "procurement_manager";
  return "store_manager";
}

export function buildExpenseRecord(
  input: Omit<
    OperatingExpense,
    "id" | "createdAt" | "status" | "approvedBy" | "approvedAt" | "month" | "auditLog"
  >,
  id: string,
  now: string
): OperatingExpense {
  const status: ExpenseStatus = needsExpenseApproval(input.amountPaise)
    ? "pending"
    : "approved";
  const auditLog: OperatingExpense["auditLog"] = [
    { action: "created", at: now, by: input.createdBy },
  ];
  if (status === "approved") {
    auditLog.push({ action: "auto_approved", at: now, by: input.createdBy });
  }
  return {
    ...input,
    id,
    month: input.date.slice(0, 7),
    status,
    approvedBy: status === "approved" ? input.createdBy : null,
    approvedAt: status === "approved" ? now : null,
    createdAt: now,
    auditLog,
  };
}

export function listRecurringExpenses(db: ProcurementDb, branchId = "all") {
  return listExpenses(db, branchId).filter((e) => e.isRecurring);
}

export function exportExpensesCsv(expenses: OperatingExpense[]): string {
  const header =
    "date,branch,category,vendor,description,amount_inr,status,recurring,created_by";
  const rows = expenses.map((e) =>
    [
      e.date,
      e.branchId,
      e.category,
      e.vendorName ?? "",
      `"${e.description.replace(/"/g, '""')}"`,
      expenseAmountRupees(e).toFixed(2),
      e.status,
      e.isRecurring ? e.recurrence ?? "monthly" : "",
      e.createdBy,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export { formatPaise, EXPENSE_CATEGORIES };
export type { ExpenseCategoryDb };
