import { appendAuditEntry } from "@/lib/os/procurement/audit";
import { coalesceBranchId } from "@/lib/os/branches";
import { buildExpenseRecord } from "@/lib/os/finance/expenses";
import { formatPaise, rupeesToPaise } from "@/lib/os/money";
import {
  buildAttendanceRecord,
  csvRowsToFlipOffice,
  mergeAttendanceRecords,
  parseAttendanceCsv,
  resolveEmployeeForAttendance,
  type FlipOfficeAttendanceRow,
} from "@/lib/os/hr/attendance";
import {
  buildEmployeePayload,
  type EmployeeMasterInput,
} from "@/lib/os/hr/employee-master";
import {
  approvePayrollRunStatus,
  buildPayrollRun,
} from "@/lib/os/hr/payroll";
import {
  mapFlipOfficeDepartment,
  normalizeFlipOfficeEmployees,
  type FlipOfficeEmployeeRow,
} from "@/lib/os/hr/flip-office";
import type {
  AttendanceRecord,
  AttendanceSource,
  ExpenseCategory,
  FlipOfficeSyncLog,
  OperatingExpense,
  PayrollRun,
  ProcurementDb,
} from "@/lib/os/procurement/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmployee(
  db: ProcurementDb,
  input: EmployeeMasterInput,
  actor: string
): ProcurementDb {
  const now = new Date().toISOString();
  const employee = buildEmployeePayload(input, uid("emp"), now);
  let next: ProcurementDb = {
    ...db,
    employees: [...db.employees, employee],
  };
  next = appendAuditEntry(next, {
    entityType: "employee",
    entityId: employee.id,
    action: "employee_created",
    actionType: "create",
    detail: `Employee ${employee.name} (${employee.employeeCode}) created`,
    userId: actor,
    userName: actor,
    oldValue: null,
    newValue: JSON.stringify(employee),
    reason: null,
    ip: null,
    field: "employee",
  });
  return next;
}

export function updateEmployeeRecord(
  db: ProcurementDb,
  employeeId: string,
  patch: Partial<ProcurementDb["employees"][0]>
): ProcurementDb {
  return {
    ...db,
    employees: db.employees.map((e) =>
      e.id === employeeId ? { ...e, ...patch } : e
    ),
  };
}

export function importAttendanceRows(
  db: ProcurementDb,
  rows: FlipOfficeAttendanceRow[],
  source: AttendanceSource,
  actor: string
): { db: ProcurementDb; imported: number; skipped: number } {
  const syncedAt = new Date().toISOString();
  const incoming: AttendanceRecord[] = [];
  let skipped = 0;

  for (const row of rows) {
    const employee = resolveEmployeeForAttendance(db, row);
    if (!employee) {
      skipped += 1;
      continue;
    }
    incoming.push(buildAttendanceRecord(employee, row, source, syncedAt));
  }

  const dates = [...new Set(incoming.map((r) => r.date))];
  let next: ProcurementDb = {
    ...db,
    attendanceRecords: mergeAttendanceRecords(db.attendanceRecords, incoming),
    flipOfficeSyncLogs: [
      {
        id: uid("fos"),
        syncType: "attendance",
        recordsImported: incoming.length,
        date: dates[0] ?? syncedAt.slice(0, 10),
        status: skipped > 0 && incoming.length > 0 ? "partial" : incoming.length ? "success" : "failed",
        message: `Imported ${incoming.length} records, skipped ${skipped}`,
        createdAt: syncedAt,
      },
      ...db.flipOfficeSyncLogs,
    ],
  };

  next = appendAuditEntry(next, {
    entityType: "attendance",
    entityId: dates[0] ?? "bulk",
    action: "attendance_imported",
    actionType: "create",
    detail: `${incoming.length} attendance records from ${source}`,
    userId: actor,
    userName: actor,
    oldValue: null,
    newValue: JSON.stringify({ imported: incoming.length, skipped, source }),
    reason: null,
    ip: null,
    field: "attendance",
  });

  return { db: next, imported: incoming.length, skipped };
}

export function importAttendanceCsv(
  db: ProcurementDb,
  csvText: string,
  actor: string
) {
  const rows = csvRowsToFlipOffice(parseAttendanceCsv(csvText));
  return importAttendanceRows(db, rows, "csv", actor);
}

export function syncFlipOfficeEmployees(
  db: ProcurementDb,
  rows: FlipOfficeEmployeeRow[],
  actor: string
): ProcurementDb {
  const normalized = normalizeFlipOfficeEmployees(rows);
  let next = { ...db };
  const now = new Date().toISOString();

  for (const row of normalized) {
    const existing = next.employees.find(
      (e) =>
        e.flipOfficeId === row.id ||
        e.employeeCode.toUpperCase() === (row.employeeCode ?? row.id).toUpperCase()
    );
    if (existing) {
      next = updateEmployeeRecord(next, existing.id, {
        flipOfficeId: row.id,
        name: row.name,
        phone: row.phone ?? existing.phone,
        email: row.email ?? existing.email,
        monthlySalary: row.monthlySalary ?? existing.monthlySalary,
      });
      continue;
    }
    next = createEmployee(next, {
      flipOfficeId: row.id,
      employeeCode: row.employeeCode ?? row.id,
      name: row.name,
      department: mapFlipOfficeDepartment(row.department),
      designation: row.designation ?? "Staff",
      outlet: row.outlet ?? "Table Tales",
      phone: row.phone ?? null,
      email: row.email ?? null,
      dateOfJoining: row.dateOfJoining ?? now.slice(0, 10),
      monthlySalary: row.monthlySalary ?? 25000,
    }, actor);
  }

  return {
    ...next,
    flipOfficeSyncLogs: [
      {
        id: uid("fos"),
        syncType: "employees",
        recordsImported: normalized.length,
        date: now.slice(0, 10),
        status: "success",
        message: `Synced ${normalized.length} employees from Flip Office`,
        createdAt: now,
      },
      ...next.flipOfficeSyncLogs,
    ],
  };
}

export function generatePayrollRun(
  db: ProcurementDb,
  month: string,
  outlet: string,
  actor: string
): ProcurementDb {
  const existing = db.payrollRuns.find(
    (r) => r.month === month && r.outlet === outlet && r.status === "draft"
  );

  let base = db;
  if (existing) {
    base = {
      ...db,
      payrollRuns: db.payrollRuns.filter((r) => r.id !== existing.id),
      payrollLines: db.payrollLines.filter((l) => l.payrollRunId !== existing.id),
    };
  }

  const { run, lines } = buildPayrollRun(base, month, outlet, actor);
  let next: ProcurementDb = {
    ...base,
    payrollRuns: [run, ...base.payrollRuns],
    payrollLines: [...lines, ...base.payrollLines],
  };

  next = appendAuditEntry(next, {
    entityType: "payroll",
    entityId: run.id,
    action: "payroll_generated",
    actionType: "create",
    detail: `Payroll ${month} · ${outlet} · ${formatInr(run.totalNet)}`,
    userId: actor,
    userName: actor,
    oldValue: null,
    newValue: JSON.stringify(run),
    reason: null,
    ip: null,
    field: "payroll",
  });

  return next;
}

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function approvePayrollRun(db: ProcurementDb, runId: string, actor: string): ProcurementDb {
  const run = db.payrollRuns.find((r) => r.id === runId);
  if (!run) return db;

  let next: ProcurementDb = {
    ...db,
    payrollRuns: db.payrollRuns.map((r) =>
      r.id === runId
        ? {
            ...r,
            status: approvePayrollRunStatus(r.status),
            approvedAt: new Date().toISOString(),
          }
        : r
    ),
  };

  next = appendAuditEntry(next, {
    entityType: "payroll",
    entityId: runId,
    action: "payroll_approved",
    actionType: "approve",
    detail: `Payroll approved for ${run.month}`,
    userId: actor,
    userName: actor,
    oldValue: JSON.stringify({ status: run.status }),
    newValue: JSON.stringify({ status: "approved" }),
    reason: null,
    ip: null,
    field: "status",
  });

  return next;
}

export function addOperatingExpense(
  db: ProcurementDb,
  input: {
    date: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    outlet?: string;
  },
  actor: string
): ProcurementDb {
  const now = new Date().toISOString();
  const outlet = input.outlet ?? "Table Tales";
  const expense = buildExpenseRecord(
    {
      branchId: coalesceBranchId(outlet),
      date: input.date,
      category: input.category as OperatingExpense["category"],
      vendorName: null,
      description: input.description,
      amountPaise: rupeesToPaise(input.amount),
      outlet,
      attachmentUrl: null,
      isRecurring: false,
      recurrence: null,
      createdBy: actor,
    },
    uid("exp"),
    now
  );

  let next: ProcurementDb = {
    ...db,
    operatingExpenses: [expense, ...db.operatingExpenses],
  };

  next = appendAuditEntry(next, {
    entityType: "expense",
    entityId: expense.id,
    action: "expense_recorded",
    actionType: "create",
    detail: `${expense.description} · ${formatPaise(expense.amountPaise)}`,
    userId: actor,
    userName: actor,
    oldValue: null,
    newValue: JSON.stringify(expense),
    reason: null,
    ip: null,
    field: "expense",
  });

  return next;
}

export type { EmployeeMasterInput, FlipOfficeAttendanceRow };
