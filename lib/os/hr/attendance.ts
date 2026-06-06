import type {
  AttendanceRecord,
  AttendanceSource,
  AttendanceStatus,
  Employee,
  ProcurementDb,
} from "@/lib/os/procurement/types";
import { findEmployeeByCode } from "@/lib/os/hr/employee-master";

export type FlipOfficeAttendanceRow = {
  employeeId?: string;
  employeeCode?: string;
  name?: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string;
  hoursWorked?: number;
  overtimeHours?: number;
};

export type CsvAttendanceRow = {
  employeeCode: string;
  employeeName?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
  hoursWorked?: string;
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function parseStatus(raw?: string): AttendanceStatus {
  const s = (raw ?? "present").toLowerCase().replace(/\s+/g, "_");
  if (s.includes("half")) return "half_day";
  if (s.includes("absent")) return "absent";
  if (s.includes("leave")) return "leave";
  if (s.includes("holiday")) return "holiday";
  if (s.includes("week")) return "week_off";
  return "present";
}

function computeHours(
  checkIn: string | null,
  checkOut: string | null,
  fallback?: number
): number {
  if (fallback !== undefined && fallback > 0) return fallback;
  if (!checkIn || !checkOut) return 0;
  const [inH, inM] = checkIn.split(":").map(Number);
  const [outH, outM] = checkOut.split(":").map(Number);
  if (Number.isNaN(inH) || Number.isNaN(outH)) return 8;
  const mins = outH * 60 + outM - (inH * 60 + inM);
  return Math.max(0, mins / 60);
}

export function resolveEmployeeForAttendance(
  db: ProcurementDb,
  row: FlipOfficeAttendanceRow
): Employee | undefined {
  if (row.employeeCode) {
    return findEmployeeByCode(db.employees, row.employeeCode);
  }
  if (row.employeeId) {
    return (
      db.employees.find(
        (e) =>
          e.flipOfficeId === row.employeeId ||
          e.id === row.employeeId ||
          e.employeeCode === row.employeeId
      ) ??
      db.employees.find((e) => e.name.toLowerCase() === (row.name ?? "").toLowerCase())
    );
  }
  if (row.name) {
    return db.employees.find(
      (e) => e.name.toLowerCase() === row.name!.toLowerCase()
    );
  }
  return undefined;
}

export function buildAttendanceRecord(
  employee: Employee,
  row: FlipOfficeAttendanceRow,
  source: AttendanceSource,
  syncedAt: string
): AttendanceRecord {
  const status = parseStatus(row.status);
  const hoursWorked = computeHours(
    row.checkIn ?? null,
    row.checkOut ?? null,
    row.hoursWorked
  );
  return {
    id: uid("att"),
    branchId: employee.branchId,
    employeeId: employee.id,
    employeeName: employee.name,
    employeeCode: employee.employeeCode,
    date: row.date.slice(0, 10),
    checkIn: row.checkIn ?? null,
    checkOut: row.checkOut ?? null,
    hoursWorked: status === "present" || status === "half_day" ? hoursWorked : 0,
    overtimeHours: row.overtimeHours ?? Math.max(0, hoursWorked - 8),
    status,
    source,
    syncedAt,
  };
}

export function parseAttendanceCsv(text: string): CsvAttendanceRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.findIndex((h) => h.includes(name));

  const codeIdx = idx("employee_code") >= 0 ? idx("employee_code") : idx("code");
  const nameIdx = idx("employee_name") >= 0 ? idx("employee_name") : idx("name");
  const dateIdx = idx("date");
  const inIdx = idx("check_in") >= 0 ? idx("check_in") : idx("in");
  const outIdx = idx("check_out") >= 0 ? idx("check_out") : idx("out");
  const statusIdx = idx("status");
  const hoursIdx = idx("hours");

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      employeeCode: cols[codeIdx] ?? "",
      employeeName: nameIdx >= 0 ? cols[nameIdx] : undefined,
      date: cols[dateIdx] ?? "",
      checkIn: inIdx >= 0 ? cols[inIdx] : undefined,
      checkOut: outIdx >= 0 ? cols[outIdx] : undefined,
      status: statusIdx >= 0 ? cols[statusIdx] : undefined,
      hoursWorked: hoursIdx >= 0 ? cols[hoursIdx] : undefined,
    };
  });
}

export function csvRowsToFlipOffice(rows: CsvAttendanceRow[]): FlipOfficeAttendanceRow[] {
  return rows.map((r) => ({
    employeeCode: r.employeeCode,
    name: r.employeeName,
    date: r.date,
    checkIn: r.checkIn ?? null,
    checkOut: r.checkOut ?? null,
    status: r.status,
    hoursWorked: r.hoursWorked ? Number(r.hoursWorked) : undefined,
  }));
}

export function getAttendanceForDate(db: ProcurementDb, date: string) {
  return db.attendanceRecords.filter((r) => r.date === date);
}

export function getAttendanceForMonth(db: ProcurementDb, month: string) {
  return db.attendanceRecords.filter((r) => r.date.startsWith(month));
}

export function computeAttendanceStats(db: ProcurementDb, month: string) {
  const records = getAttendanceForMonth(db, month);
  const activeEmployees = db.employees.filter((e) => e.status === "active").length;
  const present = records.filter(
    (r) => r.status === "present" || r.status === "half_day"
  ).length;
  const absent = records.filter((r) => r.status === "absent").length;
  const totalHours = records.reduce((s, r) => s + r.hoursWorked, 0);
  const overtimeHours = records.reduce((s, r) => s + r.overtimeHours, 0);
  const workingDays = new Set(records.map((r) => r.date)).size;
  const expectedSlots = activeEmployees * Math.max(workingDays, 1);
  const attendanceRate = expectedSlots > 0 ? (present / expectedSlots) * 100 : 0;

  return {
    present,
    absent,
    totalHours,
    overtimeHours,
    attendanceRate,
    workingDays,
    activeEmployees,
  };
}

export function mergeAttendanceRecords(
  existing: AttendanceRecord[],
  incoming: AttendanceRecord[]
): AttendanceRecord[] {
  const map = new Map<string, AttendanceRecord>();
  for (const r of existing) {
    map.set(`${r.employeeId}:${r.date}`, r);
  }
  for (const r of incoming) {
    map.set(`${r.employeeId}:${r.date}`, r);
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}
