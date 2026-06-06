import { filterByBranch, getBranchName } from "@/lib/os/branches";
import { listPendingApprovals } from "@/lib/os/approvals/engine";
import { dailyExpenseTotalPaise } from "@/lib/os/finance/expenses";
import { getAttendanceForDate } from "@/lib/os/hr/attendance";
import { getTotalPayrollCost } from "@/lib/os/hr/payroll";
import { getVendorOutstanding } from "@/lib/os/procurement/local-db";
import { computePnl } from "@/lib/os/reports/pnl";
import { generatePnLSnapshot } from "@/lib/os/reports/pnl-snapshot";
import { computeMonthlyMis, yesterdayKey } from "@/lib/os/reports/monthly-mis";
import { paiseToRupees } from "@/lib/os/money";
import type { DailyMisReport, ProcurementDb } from "@/lib/os/procurement/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function isLateCheckIn(checkIn: string | null): boolean {
  if (!checkIn) return false;
  const [h, m] = checkIn.split(":").map(Number);
  if (Number.isNaN(h)) return false;
  return h > 10 || (h === 10 && (m ?? 0) > 30);
}

function countOverdueVendorPayments(db: ProcurementDb): number {
  return db.vendors.filter((v) => {
    const outstanding = getVendorOutstanding(db, v.id);
    if (outstanding <= 0) return false;
    const lastDebit = db.vendorLedger
      .filter((e) => e.vendorId === v.id && e.debit > 0)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (!lastDebit) return false;
    const days = Math.floor(
      (Date.now() - new Date(lastDebit.createdAt).getTime()) / 86400000
    );
    return days > 30;
  }).length;
}

function dailyAttendanceCounts(db: ProcurementDb, date: string, branchId = "all") {
  let records = getAttendanceForDate(db, date);
  if (branchId !== "all") {
    records = records.filter((r) => r.branchId === branchId);
  }
  const present = records.filter(
    (r) => r.status === "present" || r.status === "half_day"
  ).length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter(
    (r) => (r.status === "present" || r.status === "half_day") && isLateCheckIn(r.checkIn)
  ).length;
  const activeEmployees = filterByBranch(db.employees, branchId).filter(
    (e) => e.status === "active"
  ).length;
  const attendanceRate =
    activeEmployees > 0 ? (present / activeEmployees) * 100 : 0;
  return { present, absent, late, attendanceRate };
}

export function generateDailyMis(
  db: ProcurementDb,
  date: string,
  branchId = "all"
): DailyMisReport {
  const salesRows = filterByBranch(db.sales, branchId).filter(
    (s) => s.consumedAt.slice(0, 10) === date
  );
  const sales = salesRows.reduce((sum, s) => sum + s.totalRevenue, 0);
  const ordersCount = salesRows.length;
  const purchases = filterByBranch(db.purchaseBills, branchId)
    .filter((b) => b.status === "posted" && b.invoiceDate === date)
    .reduce((sum, b) => sum + b.totalValue, 0);
  const month = date.slice(0, 7);
  const attendance = dailyAttendanceCounts(db, date, branchId);
  const lowStock = db.inventoryItems.filter((i) => i.currentStock < i.parLevel).length;
  const pendingCredits = filterByBranch(db.creditNotes, branchId).filter(
    (c) => c.status === "pending"
  ).length;
  const pendingPayments = countOverdueVendorPayments(db);
  const pnl = computePnl(db, "daily", date, branchId);
  const dailyPnl = generatePnLSnapshot(db, branchId, "daily", date);
  const mis = computeMonthlyMis(db, month, branchId);
  const laborCostEst =
    branchId === "all"
      ? getTotalPayrollCost(db, month) / Math.max(new Date(date).getDate(), 1)
      : paiseToRupees(dailyPnl.laborCostPaise);
  const expensesTotal = paiseToRupees(dailyExpenseTotalPaise(db, date, branchId));
  const branchName = branchId === "all" ? "All branches" : getBranchName(db, branchId);
  const whatsappText = buildWhatsAppDailyMis(
    {
      date,
      sales,
      purchases,
      lowStockCount: lowStock,
      pendingPayments,
      pendingCredits,
      foodCostPercent: mis.foodCostPercent,
      profitEstimate: pnl.netProfit,
    },
    branchName,
    ordersCount,
    attendance.present,
    attendance.absent,
    attendance.late
  );

  const now = new Date().toISOString();

  return {
    id: uid("dmis"),
    branchId: branchId === "all" ? "all" : branchId,
    date,
    sales,
    ordersCount,
    purchases,
    attendanceRate: attendance.attendanceRate,
    attendancePresent: attendance.present,
    attendanceAbsent: attendance.absent,
    attendanceLate: attendance.late,
    lowStockCount: lowStock,
    pendingPayments,
    pendingCredits,
    foodCostPercent: mis.foodCostPercent,
    laborCostEst,
    expensesTotal,
    profitEstimate: pnl.netProfit,
    summaryText: whatsappText,
    exportPdfUrl: null,
    exportExcelUrl: null,
    generatedAt: now,
    createdAt: now,
  };
}

type WhatsAppInput = {
  date: string;
  sales: number;
  purchases: number;
  lowStockCount: number;
  pendingPayments: number;
  pendingCredits: number;
  foodCostPercent: number;
  profitEstimate: number;
};

export function buildWhatsAppDailyMis(
  report: WhatsAppInput,
  branchName: string,
  ordersCount = 0,
  present = 0,
  absent = 0,
  late = 0
): string {
  return [
    `*Table Tales Daily MIS — ${report.date}*`,
    `*Branch: ${branchName}*`,
    "",
    "📊 *Sales*",
    `Total: ₹${report.sales.toLocaleString("en-IN")}`,
    `Orders: ${ordersCount}`,
    "",
    "🛒 *Purchases*",
    `Total: ₹${report.purchases.toLocaleString("en-IN")}`,
    "",
    "👥 *Attendance*",
    `Present: ${present} | Absent: ${absent} | Late: ${late}`,
    "",
    "⚠️ *Alerts*",
    `Low Stock Items: ${report.lowStockCount}`,
    `Pending Vendor Payments: ${report.pendingPayments}`,
    `Pending Credit Notes: ${report.pendingCredits}`,
    "",
    `💰 *Food Cost: ${report.foodCostPercent.toFixed(1)}%*`,
    `📈 *Est. Profit: ₹${report.profitEstimate.toLocaleString("en-IN")}*`,
    "",
    "_Generated by Table Tales OS_",
  ].join("\n");
}

export function exportDailyMisFormats(report: DailyMisReport, branchName = "All branches") {
  const whatsappText = buildWhatsAppDailyMis(
    report,
    branchName,
    report.ordersCount,
    report.attendancePresent,
    report.attendanceAbsent,
    report.attendanceLate
  );

  const csv = [
    "section,metric,value",
    "sales,total," + report.sales,
    "sales,orders," + report.ordersCount,
    "purchases,total," + report.purchases,
    "attendance,present," + report.attendancePresent,
    "attendance,absent," + report.attendanceAbsent,
    "attendance,late," + report.attendanceLate,
    "alerts,low_stock," + report.lowStockCount,
    "alerts,pending_vendor_payments," + report.pendingPayments,
    "alerts,pending_credit_notes," + report.pendingCredits,
    "finance,food_cost_pct," + report.foodCostPercent.toFixed(2),
    "finance,labor_cost_est," + report.laborCostEst,
    "finance,expenses_total," + report.expensesTotal,
    "finance,est_profit," + report.profitEstimate,
  ].join("\n");

  const excel = [
    "Table Tales Daily MIS",
    `Date,${report.date}`,
    `Branch,${branchName}`,
    "",
    "Sales",
    "Total,Orders",
    `${report.sales},${report.ordersCount}`,
    "",
    "Purchases",
    "Total",
    `${report.purchases}`,
    "",
    "Attendance",
    "Present,Absent,Late",
    `${report.attendancePresent},${report.attendanceAbsent},${report.attendanceLate}`,
    "",
    "Alerts",
    "Low Stock,Pending Vendor Payments,Pending Credit Notes",
    `${report.lowStockCount},${report.pendingPayments},${report.pendingCredits}`,
    "",
    "Finance",
    "Food Cost %,Labor Est,Expenses,Est Profit",
    `${report.foodCostPercent.toFixed(1)},${report.laborCostEst},${report.expensesTotal},${report.profitEstimate}`,
  ].join("\n");

  const whatsapp = encodeURIComponent(whatsappText);
  const emailSubject = encodeURIComponent(`Table Tales Daily MIS · ${report.date}`);
  const emailBody = encodeURIComponent(whatsappText);

  return {
    csv,
    excel,
    whatsappText,
    whatsappUrl: `https://wa.me/?text=${whatsapp}`,
    emailUrl: `mailto:?subject=${emailSubject}&body=${emailBody}`,
    pdfText: whatsappText,
  };
}

export function generateDailyMisForAllBranches(
  db: ProcurementDb,
  date: string
): DailyMisReport[] {
  const all = generateDailyMis(db, date, "all");
  const branchReports = db.branches
    .filter((b) => b.status === "active")
    .map((b) => generateDailyMis(db, date, b.id));
  return [all, ...branchReports];
}

export function buildOwnerCommandCenter(
  db: ProcurementDb,
  branchId = "all"
) {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const mis = computeMonthlyMis(db, month, branchId);
  const todaySales = filterByBranch(db.sales, branchId)
    .filter((s) => s.consumedAt.slice(0, 10) === today)
    .reduce((s, r) => s + r.totalRevenue, 0);
  const todayPurchases = filterByBranch(db.purchaseBills, branchId)
    .filter((b) => b.status === "posted" && b.invoiceDate === today)
    .reduce((s, b) => s + b.totalValue, 0);
  const pendingApprovals = listPendingApprovals(db, branchId).length;
  const pendingCredits = filterByBranch(db.creditNotes, branchId).filter(
    (c) => c.status === "pending"
  ).length;
  const branchPerformance = db.branches
    .filter((b) => b.status === "active")
    .map((b) => {
      const mis = computeMonthlyMis(db, month, b.id);
      return {
        branchId: b.id,
        name: b.name,
        revenue: mis.revenue,
        procurementSpend: mis.procurementSpend,
        inventoryValue: mis.inventoryValue,
        vendorOutstanding: mis.vendorOutstanding,
        creditNotesApplied: mis.creditNotesApplied,
        payrollCost: mis.payrollCost,
        laborCostPercent: mis.laborCostPercent,
        foodCostPercent: mis.foodCostPercent,
        operatingExpenses: mis.operatingExpenses,
        estimatedProfit: mis.estimatedProfit,
        estimatedProfitMargin: mis.estimatedProfitMargin,
        attendanceRate: mis.attendanceRate,
        headcount: mis.headcount,
        salesCount: mis.salesCount,
      };
    })
    .sort((a, b) => b.estimatedProfitMargin - a.estimatedProfitMargin);

  return {
    todaySales,
    todayPurchases,
    foodCostPercent: mis.foodCostPercent,
    laborCostPercent: mis.laborCostPercent,
    operatingExpenses: mis.operatingExpenses,
    inventoryValue: mis.inventoryValue,
    vendorOutstanding: mis.vendorOutstanding,
    pendingCreditNotes: pendingCredits,
    pendingApprovals,
    attendanceRate: mis.attendanceRate,
    estimatedProfit: mis.estimatedProfit,
    netProfitMargin: mis.estimatedProfitMargin,
    branchPerformance,
  };
}

export { yesterdayKey };
