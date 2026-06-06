import { getAttendanceForMonth } from "@/lib/os/hr/attendance";
import { coalesceBranchId } from "@/lib/os/branches";
import type {
  Employee,
  PayrollLine,
  PayrollRun,
  PayrollRunStatus,
  ProcurementDb,
} from "@/lib/os/procurement/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;
  return { start, end, daysInMonth: lastDay };
}

function prorateSalary(monthlySalary: number, daysPresent: number, daysInMonth: number) {
  const daily = monthlySalary / daysInMonth;
  return daily * daysPresent;
}

export function computePayrollLine(
  employee: Employee,
  month: string,
  attendance: ReturnType<typeof getAttendanceForMonth>
): PayrollLine {
  const { daysInMonth } = monthBounds(month);
  const empAttendance = attendance.filter((a) => a.employeeId === employee.id);
  const daysPresent = empAttendance.filter(
    (a) => a.status === "present" || a.status === "half_day"
  ).length;
  const daysAbsent = empAttendance.filter((a) => a.status === "absent").length;
  const overtimeHours = empAttendance.reduce((s, a) => s + a.overtimeHours, 0);
  const hourly = employee.hourlyRate ?? employee.monthlySalary / (daysInMonth * 8);
  const baseSalary = prorateSalary(employee.monthlySalary, daysPresent, daysInMonth);
  const overtimePay = overtimeHours * hourly * 1.5;
  const deductions = daysAbsent > 0 ? (employee.monthlySalary / daysInMonth) * daysAbsent * 0.5 : 0;
  const netPay = Math.max(0, baseSalary + overtimePay - deductions);

  return {
    id: uid("pln"),
    payrollRunId: "",
    employeeId: employee.id,
    employeeName: employee.name,
    baseSalary,
    overtimePay,
    deductions,
    netPay,
    daysPresent,
    daysAbsent,
  };
}

export function buildPayrollRun(
  db: ProcurementDb,
  month: string,
  outlet: string,
  actor: string
): { run: PayrollRun; lines: PayrollLine[] } {
  const { start, end } = monthBounds(month);
  const attendance = getAttendanceForMonth(db, month);
  const employees = db.employees.filter(
    (e) => e.status === "active" && (outlet === "all" || e.outlet === outlet)
  );

  const runId = uid("pay");
  const lines = employees.map((emp) => {
    const line = computePayrollLine(emp, month, attendance);
    return { ...line, payrollRunId: runId };
  });

  const totalGross = lines.reduce((s, l) => s + l.baseSalary + l.overtimePay, 0);
  const totalDeductions = lines.reduce((s, l) => s + l.deductions, 0);
  const totalNet = lines.reduce((s, l) => s + l.netPay, 0);

  const run: PayrollRun = {
    id: runId,
    branchId: coalesceBranchId(outlet),
    periodStart: start,
    periodEnd: end,
    month,
    outlet,
    status: "draft",
    totalGross,
    totalDeductions,
    totalNet,
    employeeCount: lines.length,
    createdAt: new Date().toISOString(),
    approvedAt: null,
    createdBy: actor,
  };

  return { run, lines };
}

export function getPayrollForMonth(db: ProcurementDb, month: string) {
  const runs = db.payrollRuns.filter((r) => r.month === month);
  const lines = db.payrollLines.filter((l) =>
    runs.some((r) => r.id === l.payrollRunId)
  );
  return { runs, lines };
}

export function getTotalPayrollCost(db: ProcurementDb, month: string): number {
  const { runs } = getPayrollForMonth(db, month);
  return runs
    .filter((r) => r.status === "approved" || r.status === "paid")
    .reduce((s, r) => s + r.totalNet, 0);
}

export function listPayrollRuns(db: ProcurementDb) {
  return [...db.payrollRuns].sort((a, b) => b.month.localeCompare(a.month));
}

export function summarizePayrollByOutlet(db: ProcurementDb, month: string) {
  const runs = db.payrollRuns.filter((r) => r.month === month);
  const map = new Map<string, number>();
  for (const run of runs) {
    map.set(run.outlet, (map.get(run.outlet) ?? 0) + run.totalNet);
  }
  return [...map.entries()].map(([outlet, total]) => ({ outlet, total }));
}

export function approvePayrollRunStatus(status: PayrollRunStatus): PayrollRunStatus {
  return status === "draft" ? "approved" : status;
}
