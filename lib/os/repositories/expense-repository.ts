import type { OperatingExpense, AttendanceRecord } from "@/lib/os/procurement/types";
import { getOsSupabase, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function expenseToRow(expense: OperatingExpense) {
  return {
    id: expense.id.length === 36 ? expense.id : undefined,
    branch_id: expense.branchId,
    expense_date: expense.date,
    category: expense.category,
    vendor_name: expense.vendorName,
    description: expense.description,
    amount: expense.amountPaise / 100,
    attachment_url: expense.attachmentUrl,
    status: expense.status,
    is_recurring: expense.isRecurring,
    recurring_day: expense.recurrence === "monthly" ? 1 : expense.recurrence === "weekly" ? 7 : null,
    created_by: expense.createdBy,
    approved_by: expense.approvedBy,
    approved_at: expense.approvedAt,
    created_at: expense.createdAt,
  };
}

function expenseFromRow(row: Record<string, unknown>): OperatingExpense {
  const date = String(row.expense_date);
  return {
    id: String(row.id),
    branchId: String(row.branch_id ?? "br_prahladnagar"),
    date,
    month: date.slice(0, 7),
    category: row.category as OperatingExpense["category"],
    vendorName: (row.vendor_name as string | null) ?? null,
    description: String(row.description),
    amountPaise: Math.round(Number(row.amount ?? 0) * 100),
    outlet: String(row.branch_id ?? ""),
    attachmentUrl: (row.attachment_url as string | null) ?? null,
    status: row.status as OperatingExpense["status"],
    isRecurring: Boolean(row.is_recurring),
    recurrence: row.recurring_day ? "monthly" : null,
    createdBy: String(row.created_by ?? "system"),
    approvedBy: (row.approved_by as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    auditLog: [],
  };
}

export class ExpenseRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<ExpenseRepository> {
    return new ExpenseRepository(await getOsSupabase());
  }

  async list(): Promise<OperatingExpense[]> {
    const { data, error } = await this.supabase.from("operating_expenses").select("*");
    if (error) throw new Error(`operating_expenses list failed: ${error.message}`);
    return (data ?? []).map((row) => expenseFromRow(row as Record<string, unknown>));
  }

  async saveAll(expenses: OperatingExpense[]): Promise<void> {
    if (!expenses.length) return;
    const { error } = await this.supabase.from("operating_expenses").upsert(expenses.map(expenseToRow));
    if (error) throw new Error(`operating_expenses upsert failed: ${error.message}`);
  }
}

function attendanceToRow(record: AttendanceRecord) {
  return {
    id: record.id.length === 36 ? record.id : undefined,
    branch_id: record.branchId,
    employee_id: record.employeeId,
    employee_name: record.employeeName,
    employee_code: record.employeeCode,
    date: record.date,
    check_in: record.checkIn,
    check_out: record.checkOut,
    hours_worked: record.hoursWorked,
    overtime_hours: record.overtimeHours,
    status: record.status,
    source: record.source,
    synced_at: record.syncedAt,
  };
}

function attendanceFromRow(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: String(row.id),
    branchId: String(row.branch_id ?? "br_prahladnagar"),
    employeeId: String(row.employee_id),
    employeeName: String(row.employee_name),
    employeeCode: String(row.employee_code),
    date: String(row.date),
    checkIn: (row.check_in as string | null) ?? null,
    checkOut: (row.check_out as string | null) ?? null,
    hoursWorked: Number(row.hours_worked ?? 0),
    overtimeHours: Number(row.overtime_hours ?? 0),
    status: row.status as AttendanceRecord["status"],
    source: row.source as AttendanceRecord["source"],
    syncedAt: String(row.synced_at ?? row.created_at ?? new Date().toISOString()),
  };
}

export class AttendanceRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<AttendanceRepository> {
    return new AttendanceRepository(await getOsSupabase());
  }

  async list(): Promise<AttendanceRecord[]> {
    const { data, error } = await this.supabase.from("attendance_records").select("*");
    if (error) throw new Error(`attendance_records list failed: ${error.message}`);
    return (data ?? []).map((row) => attendanceFromRow(row as Record<string, unknown>));
  }

  async saveAll(records: AttendanceRecord[]): Promise<void> {
    if (!records.length) return;
    const { error } = await this.supabase.from("attendance_records").upsert(records.map(attendanceToRow));
    if (error) throw new Error(`attendance_records upsert failed: ${error.message}`);
  }
}
