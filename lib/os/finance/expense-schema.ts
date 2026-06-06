import { z } from "zod";
import { EXPENSE_MANAGER_THRESHOLD_PAISE, rupeesToPaise } from "@/lib/os/money";

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Gas",
  "Water",
  "Internet",
  "Marketing",
  "Maintenance",
  "Repairs",
  "Licenses",
  "Software",
  "PettyCash",
  "Housekeeping",
  "Uniforms",
  "Transport",
  "Miscellaneous",
] as const;

export type ExpenseCategoryDb = (typeof EXPENSE_CATEGORIES)[number];

export const expenseCategorySchema = z.enum(EXPENSE_CATEGORIES);

export const expenseRecurrenceSchema = z.enum(["monthly", "weekly"]).nullable();

export const createExpenseSchema = z.object({
  branchId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: expenseCategorySchema,
  vendorName: z.string().max(200).nullable().optional(),
  description: z.string().min(1).max(500),
  /** Amount in rupees from UI — converted to paise before persist */
  amountRupees: z.number().positive().max(10_000_000),
  attachmentUrl: z.string().nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurrence: expenseRecurrenceSchema.optional(),
  createdBy: z.string().min(1),
});

export const expenseFilterSchema = z.object({
  branchId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  category: expenseCategorySchema.optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const reviewExpenseSchema = z.object({
  expenseId: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
  reviewedBy: z.string().min(1),
  note: z.string().optional(),
});

export function expenseRequiresApproval(amountPaise: number): boolean {
  return amountPaise >= EXPENSE_MANAGER_THRESHOLD_PAISE;
}

export function toExpensePaise(amountRupees: number): number {
  return rupeesToPaise(amountRupees);
}

/** Map legacy snake_case categories to DB enum strings */
export function normalizeExpenseCategory(raw: string): ExpenseCategoryDb {
  const map: Record<string, ExpenseCategoryDb> = {
    rent: "Rent",
    electricity: "Electricity",
    gas: "Gas",
    water: "Water",
    internet: "Internet",
    marketing: "Marketing",
    maintenance: "Maintenance",
    repairs: "Repairs",
    licenses: "Licenses",
    software: "Software",
    petty_cash: "PettyCash",
    housekeeping: "Housekeeping",
    uniforms: "Uniforms",
    transport: "Transport",
    miscellaneous: "Miscellaneous",
    misc: "Miscellaneous",
    utilities: "Electricity",
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
    PettyCash: "PettyCash",
    Housekeeping: "Housekeeping",
    Uniforms: "Uniforms",
    Transport: "Transport",
    Miscellaneous: "Miscellaneous",
  };
  return map[raw] ?? "Miscellaneous";
}
