import type { DailyMisReport } from "@/lib/os/procurement/types";
import { getOsSupabase, upsertRows, type OsSupabase } from "@/lib/os/repositories/base";

function toRow(report: DailyMisReport) {
  return {
    id: report.id,
    branch_id: report.branchId,
    report_date: report.date,
    payload: report,
    created_at: report.createdAt,
  };
}

function fromRow(row: Record<string, unknown>): DailyMisReport {
  const payload = row.payload as DailyMisReport | undefined;
  if (payload?.id) return payload;
  return {
    id: String(row.id),
    branchId: String(row.branch_id ?? "br_prahladnagar"),
    date: String(row.report_date),
    sales: 0,
    ordersCount: 0,
    purchases: 0,
    attendanceRate: 0,
    attendancePresent: 0,
    attendanceAbsent: 0,
    attendanceLate: 0,
    lowStockCount: 0,
    pendingPayments: 0,
    pendingCredits: 0,
    foodCostPercent: 0,
    laborCostEst: 0,
    expensesTotal: 0,
    profitEstimate: 0,
    summaryText: "",
    exportPdfUrl: null,
    exportExcelUrl: null,
    generatedAt: String(row.created_at ?? new Date().toISOString()),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export class MisRepository {
  constructor(private readonly supabase: OsSupabase) {}

  static async create(): Promise<MisRepository> {
    return new MisRepository(await getOsSupabase());
  }

  async listDaily(): Promise<DailyMisReport[]> {
    const { data, error } = await this.supabase
      .from("daily_mis_reports")
      .select("*")
      .order("report_date", { ascending: false });
    if (error) throw new Error(`daily_mis_reports list failed: ${error.message}`);
    return (data ?? []).map((row) => fromRow(row as Record<string, unknown>));
  }

  async saveAll(reports: DailyMisReport[]): Promise<void> {
    await upsertRows(this.supabase, "daily_mis_reports", reports.map(toRow), "id");
  }
}
