import type { PayrollRun, PayrollLine } from "@/lib/os/procurement/types";
import { appId, getOsSupabase, replaceChildRows, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function runToRow(run: PayrollRun) {
  return {
    legacy_id: run.id,
    branch_id: run.branchId,
    period_start: run.periodStart,
    period_end: run.periodEnd,
    month: run.month,
    outlet: run.outlet,
    status: run.status,
    total_gross: run.totalGross,
    total_deductions: run.totalDeductions,
    total_net: run.totalNet,
    employee_count: run.employeeCount,
    approved_at: run.approvedAt,
    created_by: run.createdBy,
    created_at: run.createdAt,
  };
}

function runFromRow(row: Record<string, unknown>): PayrollRun {
  return {
    id: appId(row as { legacy_id?: string | null; id: string }),
    branchId: String(row.branch_id ?? "br_prahladnagar"),
    periodStart: String(row.period_start),
    periodEnd: String(row.period_end),
    month: String(row.month),
    outlet: String(row.outlet ?? ""),
    status: row.status as PayrollRun["status"],
    totalGross: Number(row.total_gross ?? 0),
    totalDeductions: Number(row.total_deductions ?? 0),
    totalNet: Number(row.total_net ?? 0),
    employeeCount: Number(row.employee_count ?? 0),
    approvedAt: (row.approved_at as string | null) ?? null,
    createdBy: String(row.created_by ?? "system"),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export class PayrollRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<PayrollRepository> {
    return new PayrollRepository(await getOsSupabase());
  }

  async listRuns(): Promise<PayrollRun[]> {
    const { data, error } = await this.supabase.from("payroll_runs").select("*");
    if (error) throw new Error(`payroll_runs list failed: ${error.message}`);
    return (data ?? []).map((row) => runFromRow(row as Record<string, unknown>));
  }

  async listLines(): Promise<PayrollLine[]> {
    const { data, error } = await this.supabase.from("payroll_lines").select("*");
    if (error) throw new Error(`payroll_lines list failed: ${error.message}`);
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        payrollRunId: String(r.run_id),
        employeeId: String(r.employee_id),
        employeeName: String(r.employee_name),
        baseSalary: Number(r.gross_pay ?? r.base_salary ?? 0),
        overtimePay: Number(r.overtime_pay ?? 0),
        deductions: Number(r.deductions ?? 0),
        netPay: Number(r.net_pay ?? 0),
        daysPresent: Number(r.days_present ?? 0),
        daysAbsent: Number(r.days_absent ?? 0),
      };
    });
  }

  async saveAll(runs: PayrollRun[], lines: PayrollLine[]): Promise<void> {
    await upsertRows(this.supabase, "payroll_runs", runs.map(runToRow), "legacy_id");

    const { data: runRows } = await this.supabase.from("payroll_runs").select("id, legacy_id");
    const runUuidByLegacy = new Map<string, string>();
    for (const row of runRows ?? []) {
      const legacy = (row as { legacy_id?: string | null }).legacy_id;
      if (legacy) runUuidByLegacy.set(legacy, String((row as { id: string }).id));
    }

    const parentIds = [...runUuidByLegacy.values()];
    const lineRows = lines.map((line) => ({
      id: line.id.length === 36 ? line.id : undefined,
      run_id: runUuidByLegacy.get(line.payrollRunId) ?? line.payrollRunId,
      employee_id: line.employeeId,
      employee_name: line.employeeName,
      employee_code: line.employeeId,
      gross_pay: line.baseSalary + line.overtimePay,
      overtime_pay: line.overtimePay,
      deductions: line.deductions,
      net_pay: line.netPay,
      days_present: line.daysPresent,
      days_absent: line.daysAbsent,
    }));

    await replaceChildRows(this.supabase, "payroll_lines", "run_id", parentIds, lineRows);
  }
}
