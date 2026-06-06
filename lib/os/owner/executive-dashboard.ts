import { filterByBranch } from "@/lib/os/branches";
import { listPendingApprovals } from "@/lib/os/approvals/engine";
import { computeAttendanceStats, getAttendanceForDate } from "@/lib/os/hr/attendance";
import { getItemLastRate } from "@/lib/os/kitchen/recipes";
import { buildStockAudit } from "@/lib/os/procurement/analytics";
import { getVendorOutstanding } from "@/lib/os/procurement/local-db";
import { computeRecoveryDashboardStats } from "@/lib/os/procurement/recovery";
import { generateOrgInsights } from "@/lib/os/reports/ai-insights";
import { computePnl, currentPeriodKey } from "@/lib/os/reports/pnl";
import { computeMonthlyMis } from "@/lib/os/reports/monthly-mis";
import type {
  ApprovalRequest,
  ApprovalType,
  OrgInsight,
  ProcurementDb,
  PnlPeriod,
} from "@/lib/os/procurement/types";

export type ExecutiveKpi = {
  id: string;
  label: string;
  display: string;
  previousDisplay: string;
  changePercent: number;
  trend: "up" | "down" | "flat";
  goodWhenUp: boolean;
};

export type BranchExecutiveRow = {
  branchId: string;
  shortName: string;
  sales: number;
  profit: number;
  foodCostPercent: number;
  laborCostPercent: number;
  inventoryValue: number;
  vendorOutstanding: number;
  marginPercent: number;
  rank: number;
};

export type HealthMetric = {
  label: string;
  value: string;
  hint?: string;
  severity?: "neutral" | "warning" | "critical" | "positive";
  href?: string;
};

export type ActivityFeedItem = {
  id: string;
  time: string;
  label: string;
  detail: string;
  tone: "neutral" | "success" | "warning";
};

export type ExecutiveDashboardData = {
  snapshot: ExecutiveKpi[];
  branchPerformance: {
    rows: BranchExecutiveRow[];
    best: BranchExecutiveRow | null;
    worst: BranchExecutiveRow | null;
  };
  aiInsights: OrgInsight[];
  profitability: {
    period: PnlPeriod;
    revenue: number;
    foodCost: number;
    laborCost: number;
    expenses: number;
    netProfit: number;
    grossProfit: number;
    profitPercent: number;
  };
  pendingActions: {
    total: number;
    byType: Record<ApprovalType, ApprovalRequest[]>;
  };
  procurementHealth: HealthMetric[];
  inventoryHealth: HealthMetric[];
  workforceHealth: HealthMetric[];
  financeHealth: HealthMetric[];
  activityFeed: ActivityFeedItem[];
  mobilePriority: {
    sales: string;
    profit: string;
    foodCost: string;
    laborCost: string;
    pendingApprovals: number;
    topInsight: string | null;
  };
};

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function trendDir(change: number): "up" | "down" | "flat" {
  if (Math.abs(change) < 0.5) return "flat";
  return change > 0 ? "up" : "down";
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function yesterday(isoDate: string): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function branchShortName(name: string): string {
  if (name.includes("Prahladnagar")) return "Prahladnagar";
  if (name.includes("SBR")) return "SBR";
  if (name.includes("Nikol")) return "Nikol";
  if (name.includes("Central Kitchen") || name.includes("Pure Foods")) return "Pure Foods";
  return name.split(" ").slice(-1)[0] ?? name;
}

function formatCompactInr(n: number): string {
  if (Math.abs(n) >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function buildKpi(
  id: string,
  label: string,
  current: number,
  previous: number,
  format: (n: number) => string,
  goodWhenUp: boolean
): ExecutiveKpi {
  const changePercent = pctChange(current, previous);
  return {
    id,
    label,
    display: format(current),
    previousDisplay: format(previous),
    changePercent,
    trend: trendDir(changePercent),
    goodWhenUp,
  };
}

function salesForDate(db: ProcurementDb, date: string, branchId: string) {
  return filterByBranch(db.sales, branchId)
    .filter((s) => s.consumedAt.slice(0, 10) === date)
    .reduce((sum, s) => sum + s.totalRevenue, 0);
}

function buildActivityFeed(db: ProcurementDb, today: string): ActivityFeedItem[] {
  const actionMap: Record<string, { label: string; tone: ActivityFeedItem["tone"] }> = {
    bill_created: { label: "Bill uploaded", tone: "neutral" },
    bill_posted: { label: "Bill posted", tone: "success" },
    grn_confirmed: { label: "GRN approved", tone: "success" },
    credit_note_applied: { label: "Credit note received", tone: "success" },
    sale_recorded: { label: "Sales recorded", tone: "success" },
    attendance_imported: { label: "Attendance synced", tone: "neutral" },
    payroll_generated: { label: "Payroll generated", tone: "neutral" },
    payment_recorded: { label: "Vendor payment", tone: "neutral" },
    expense_recorded: { label: "Expense logged", tone: "warning" },
  };

  return db.auditLog
    .filter((e) => e.createdAt.slice(0, 10) === today)
    .slice(0, 12)
    .map((e) => {
      const mapped = actionMap[e.action];
      return {
        id: e.id,
        time: new Date(e.createdAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        label: mapped?.label ?? e.action.replace(/_/g, " "),
        detail: e.detail,
        tone: mapped?.tone ?? "neutral",
      };
    });
}

export function buildExecutiveDashboard(
  db: ProcurementDb,
  branchId = "all",
  pnlPeriod: PnlPeriod = "monthly"
): ExecutiveDashboardData {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const prevMonth = shiftMonth(month, -1);
  const yday = yesterday(today);

  const mis = computeMonthlyMis(db, month, branchId);
  const prevMis = computeMonthlyMis(db, prevMonth, branchId);
  const todaySales = salesForDate(db, today, branchId);
  const ydaySales = salesForDate(db, yday, branchId);

  const pnlKey =
    pnlPeriod === "daily"
      ? today
      : pnlPeriod === "weekly"
        ? currentPeriodKey("weekly")
        : month;
  const pnl = computePnl(db, pnlPeriod, pnlKey, branchId);

  const cashPosition = mis.revenue - mis.vendorOutstanding - mis.operatingExpenses;
  const prevCash =
    prevMis.revenue - prevMis.vendorOutstanding - prevMis.operatingExpenses;

  const snapshot: ExecutiveKpi[] = [
    buildKpi("today_sales", "Today's Sales", todaySales, ydaySales, formatCompactInr, true),
    buildKpi("month_sales", "Month Sales", mis.revenue, prevMis.revenue, formatCompactInr, true),
    buildKpi(
      "net_profit",
      "Net Profit",
      mis.estimatedProfit,
      prevMis.estimatedProfit,
      formatCompactInr,
      true
    ),
    buildKpi(
      "food_cost",
      "Food Cost %",
      mis.foodCostPercent,
      prevMis.foodCostPercent,
      (n) => `${n.toFixed(1)}%`,
      false
    ),
    buildKpi(
      "labor_cost",
      "Labor Cost %",
      mis.laborCostPercent,
      prevMis.laborCostPercent,
      (n) => `${n.toFixed(1)}%`,
      false
    ),
    buildKpi(
      "inventory",
      "Inventory Value",
      mis.inventoryValue,
      prevMis.inventoryValue,
      formatCompactInr,
      false
    ),
    buildKpi(
      "vendor_outstanding",
      "Vendor Outstanding",
      mis.vendorOutstanding,
      prevMis.vendorOutstanding,
      formatCompactInr,
      false
    ),
    buildKpi("cash", "Cash Position", cashPosition, prevCash, formatCompactInr, true),
  ];

  const branchRows: BranchExecutiveRow[] = db.branches
    .filter((b) => b.status === "active")
    .map((b) => {
      const bm = computeMonthlyMis(db, month, b.id);
      return {
        branchId: b.id,
        shortName: branchShortName(b.name),
        sales: bm.revenue,
        profit: bm.estimatedProfit,
        foodCostPercent: bm.foodCostPercent,
        laborCostPercent: bm.laborCostPercent,
        inventoryValue: bm.inventoryValue,
        vendorOutstanding: bm.vendorOutstanding,
        marginPercent: bm.estimatedProfitMargin,
        rank: 0,
      };
    })
    .sort((a, b) => b.profit - a.profit)
    .map((row, idx) => ({ ...row, rank: idx + 1 }));

  const best = branchRows[0] ?? null;
  const worst = branchRows.length > 1 ? branchRows[branchRows.length - 1] : null;

  const pending = listPendingApprovals(db, branchId);
  const byType: Record<ApprovalType, ApprovalRequest[]> = {
    purchase: [],
    expense: [],
    credit_note: [],
    inventory_adjustment: [],
    payroll: [],
  };
  for (const req of pending) {
    byType[req.type].push(req);
  }

  const recovery = computeRecoveryDashboardStats(db);
  const pendingCredits = filterByBranch(db.creditNotes, branchId).filter(
    (c) => c.status === "pending"
  ).length;
  const openOmissions = filterByBranch(db.omissionCases, branchId).filter(
    (o) => o.status === "pending"
  ).length;
  const topDisputeVendor = recovery.topVendorCredits[0];
  const topDisputedItem = recovery.topDisputedItems[0];

  const audit = buildStockAudit(db, today);
  const highVariance = audit.filter(
    (r) => r.variance !== null && Math.abs(r.variance) >= 0.5
  ).length;
  const lowStock = db.inventoryItems.filter((i) => i.currentStock < i.parLevel);
  const deadStock = db.inventoryItems.filter((item) => {
    const moves = db.inventoryMovements.filter((m) => m.itemId === item.id);
    if (!moves.length && item.currentStock > 0) return true;
    const last = moves.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (!last) return false;
    const days =
      (Date.now() - new Date(last.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return days > 30 && item.currentStock > 0;
  }).length;

  const consumption = new Map<string, number>();
  for (const m of db.inventoryMovements.filter((m) => m.type === "consumption")) {
    consumption.set(m.itemId, (consumption.get(m.itemId) ?? 0) + Math.abs(m.quantity));
  }
  const mostConsumed = [...consumption.entries()]
    .sort((a, b) => b[1] - a[1])[0];
  const mostConsumedItem = mostConsumed
    ? db.inventoryItems.find((i) => i.id === mostConsumed[0])
    : null;

  const highestValue = [...db.inventoryItems]
    .map((i) => ({
      item: i,
      value: i.currentStock * getItemLastRate(db, i.id),
    }))
    .sort((a, b) => b.value - a.value)[0];

  const attendance = computeAttendanceStats(db, month);
  const todayAttendance = getAttendanceForDate(db, today);
  const lateCount = todayAttendance.filter((r) => {
    if (!r.checkIn) return false;
    const [h] = r.checkIn.split(":").map(Number);
    return h >= 10;
  }).length;
  const absentToday = todayAttendance.filter((r) => r.status === "absent").length;

  const pendingExpenses = filterByBranch(db.operatingExpenses, branchId).filter(
    (e) => e.status === "pending"
  );
  const upcomingExpenseTotal = pendingExpenses.reduce((s, e) => s + e.amountPaise, 0);

  const aiInsights = generateOrgInsights(db, month).slice(0, 8);

  return {
    snapshot,
    branchPerformance: { rows: branchRows, best, worst },
    aiInsights,
    profitability: {
      period: pnlPeriod,
      revenue: pnl.revenue,
      foodCost: pnl.foodCost,
      laborCost: pnl.laborCost,
      expenses: pnl.operatingExpenses,
      netProfit: pnl.netProfit,
      grossProfit: pnl.grossProfit,
      profitPercent: pnl.profitPercent,
    },
    pendingActions: { total: pending.length, byType },
    procurementHealth: [
      {
        label: "Pending Credit Notes",
        value: String(pendingCredits),
        severity: pendingCredits > 0 ? "warning" : "positive",
        href: "/os/procurement/credit-notes",
      },
      {
        label: "Pending Recovery",
        value: formatCompactInr(recovery.pendingRecovery),
        severity: recovery.pendingRecovery > 0 ? "critical" : "positive",
        href: "/os/procurement/recovery",
      },
      {
        label: "Vendor Outstanding",
        value: formatCompactInr(mis.vendorOutstanding),
        href: "/os/procurement/vendor-ledger",
      },
      {
        label: "Open Omissions",
        value: String(openOmissions),
        severity: openOmissions > 0 ? "warning" : "neutral",
        href: "/os/procurement/omissions",
      },
      {
        label: "Top Disputed Vendor",
        value: topDisputeVendor?.vendorName ?? "—",
        hint: topDisputeVendor
          ? formatCompactInr(topDisputeVendor.amount)
          : undefined,
        href: "/os/procurement/vendor-disputes",
      },
      {
        label: "Top Disputed Item",
        value: topDisputedItem?.itemName ?? "—",
        hint: topDisputedItem ? `${topDisputedItem.count} cases` : undefined,
        href: "/os/procurement/vendor-disputes",
      },
    ],
    inventoryHealth: [
      {
        label: "Low Stock",
        value: String(lowStock.length),
        severity: lowStock.length > 0 ? "warning" : "positive",
        href: "/os/inventory",
      },
      {
        label: "High Variance",
        value: String(highVariance),
        severity: highVariance > 0 ? "critical" : "positive",
        href: "/os/inventory/stock-audit",
      },
      {
        label: "Dead Stock",
        value: String(deadStock),
        severity: deadStock > 0 ? "warning" : "neutral",
        href: "/os/inventory",
      },
      {
        label: "Most Consumed",
        value: mostConsumedItem?.name ?? "—",
        hint: mostConsumed ? `${mostConsumed[1].toFixed(1)} units` : undefined,
      },
      {
        label: "Highest Value",
        value: highestValue?.item.name ?? "—",
        hint: highestValue ? formatCompactInr(highestValue.value) : undefined,
      },
      {
        label: "Reorder",
        value: lowStock.slice(0, 2).map((i) => i.name).join(", ") || "All clear",
        severity: lowStock.length ? "warning" : "positive",
        href: "/os/inventory",
      },
    ],
    workforceHealth: [
      {
        label: "Attendance %",
        value: `${attendance.attendanceRate.toFixed(1)}%`,
        severity: attendance.attendanceRate < 85 ? "warning" : "positive",
        href: "/os/hr/attendance",
      },
      {
        label: "Late Today",
        value: String(lateCount),
        severity: lateCount > 0 ? "warning" : "neutral",
        href: "/os/hr/attendance",
      },
      {
        label: "Absent Today",
        value: String(absentToday),
        severity: absentToday > 0 ? "critical" : "positive",
        href: "/os/hr/attendance",
      },
      {
        label: "Payroll Cost",
        value: formatCompactInr(mis.payrollCost),
        href: "/os/hr/payroll",
      },
      {
        label: "Labor Cost %",
        value: `${mis.laborCostPercent.toFixed(1)}%`,
        severity: mis.laborCostPercent > 30 ? "warning" : "neutral",
        href: "/os/reports/labor-cost",
      },
      {
        label: "Overtime Hours",
        value: `${attendance.overtimeHours.toFixed(1)}h`,
        href: "/os/hr/attendance",
      },
    ],
    financeHealth: [
      {
        label: "Cash Flow",
        value: formatCompactInr(cashPosition),
        severity: cashPosition < 0 ? "critical" : "positive",
      },
      {
        label: "Receivables",
        value: formatCompactInr(0),
        hint: "No open receivables",
      },
      {
        label: "Payables",
        value: formatCompactInr(mis.vendorOutstanding),
        href: "/os/procurement/payments",
      },
      {
        label: "Vendor Outstanding",
        value: formatCompactInr(mis.vendorOutstanding),
        href: "/os/procurement/vendor-ledger",
      },
      {
        label: "Upcoming Expenses",
        value: formatCompactInr(upcomingExpenseTotal),
        hint: `${pendingExpenses.length} pending approval`,
        href: "/os/finance/expenses",
      },
      {
        label: "Projected Profit",
        value: formatCompactInr(mis.estimatedProfit),
        hint: `${mis.estimatedProfitMargin.toFixed(1)}% margin`,
        href: "/os/reports/pnl",
      },
    ],
    activityFeed: buildActivityFeed(db, today),
    mobilePriority: {
      sales: formatCompactInr(todaySales),
      profit: formatCompactInr(mis.estimatedProfit),
      foodCost: `${mis.foodCostPercent.toFixed(1)}%`,
      laborCost: `${mis.laborCostPercent.toFixed(1)}%`,
      pendingApprovals: pending.length,
      topInsight: aiInsights[0]?.detail ?? null,
    },
  };
}
