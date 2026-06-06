import { filterByBranch } from "@/lib/os/branches";
import { computeAttendanceStats } from "@/lib/os/hr/attendance";
import { buildStockAudit } from "@/lib/os/procurement/analytics";
import { computeRecoveryDashboardStats } from "@/lib/os/procurement/recovery";
import { computeMonthlyMis } from "@/lib/os/reports/monthly-mis";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export type TimeRangeKey =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "quarter"
  | "year"
  | "lifetime";

export type TimeRange = {
  key: TimeRangeKey;
  label: string;
  start: string;
  end: string;
};

export const TIME_RANGE_OPTIONS: { key: TimeRangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "quarter", label: "Quarter" },
  { key: "year", label: "Year" },
  { key: "lifetime", label: "Lifetime" },
];

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function resolveTimeRange(key: TimeRangeKey, ref = new Date()): TimeRange {
  const end = iso(ref);
  const d = new Date(ref);

  switch (key) {
    case "today":
      return { key, label: "Today", start: end, end };
    case "yesterday": {
      d.setDate(d.getDate() - 1);
      const y = iso(d);
      return { key, label: "Yesterday", start: y, end: y };
    }
    case "this_week": {
      const day = d.getDay();
      const diff = day === 0 ? 6 : day - 1;
      d.setDate(d.getDate() - diff);
      return { key, label: "This Week", start: iso(d), end };
    }
    case "this_month":
      return {
        key,
        label: "This Month",
        start: `${end.slice(0, 7)}-01`,
        end,
      };
    case "last_month": {
      d.setMonth(d.getMonth() - 1, 1);
      const start = iso(d);
      d.setMonth(d.getMonth() + 1, 0);
      return { key, label: "Last Month", start, end: iso(d) };
    }
    case "quarter": {
      const qStart = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
      return { key, label: "Quarter", start: iso(qStart), end };
    }
    case "year":
      return { key, label: "Year", start: `${d.getFullYear()}-01-01`, end };
    case "lifetime":
    default: {
      return { key: "lifetime", label: "Lifetime", start: "2000-01-01", end };
    }
  }
}

function inRange(dateStr: string, range: TimeRange): boolean {
  const day = dateStr.slice(0, 10);
  return day >= range.start && day <= range.end;
}

export type BranchLifetimeMetrics = {
  branchId: string;
  name: string;
  revenue: number;
  profit: number;
  foodCostPercent: number;
  laborCostPercent: number;
  wastageValue: number;
  inventoryVariance: number;
  vendorRecovery: number;
  attendanceRate: number;
  payroll: number;
  lifetimeContributionPercent: number;
};

export function computeBranchMetricsForRange(
  db: ProcurementDb,
  branchId: string,
  range: TimeRange
): Omit<BranchLifetimeMetrics, "lifetimeContributionPercent"> {
  const branch = db.branches.find((b) => b.id === branchId);
  const sales = filterByBranch(db.sales, branchId).filter((s) => inRange(s.consumedAt, range));
  const revenue = sales.reduce((s, r) => s + r.totalRevenue, 0);

  const monthKeys = new Set(sales.map((s) => s.consumedAt.slice(0, 7)));
  let foodCost = 0;
  let laborCost = 0;
  let payroll = 0;
  let attendanceRate = 0;
  if (monthKeys.size === 0) {
    const m = range.end.slice(0, 7);
    const mis = computeMonthlyMis(db, m, branchId);
    foodCost = mis.foodCostPercent;
    laborCost = mis.laborCostPercent;
    payroll = mis.payrollCost;
    attendanceRate = mis.attendanceRate;
  } else {
    const misRows = [...monthKeys].map((m) => computeMonthlyMis(db, m, branchId));
    foodCost = misRows.reduce((s, r) => s + r.foodCostPercent, 0) / misRows.length;
    laborCost = misRows.reduce((s, r) => s + r.laborCostPercent, 0) / misRows.length;
    payroll = misRows.reduce((s, r) => s + r.payrollCost, 0);
    attendanceRate = misRows.reduce((s, r) => s + r.attendanceRate, 0) / misRows.length;
  }

  const expenses = filterByBranch(db.operatingExpenses, branchId)
    .filter((e) => inRange(e.date, range))
    .reduce((s, e) => s + e.amountPaise / 100, 0);

  const foodCostValue = revenue * (foodCost / 100);
  const profit = revenue - foodCostValue - payroll - expenses;

  const wastageValue = filterByBranch(db.inventoryMovements, branchId)
    .filter((m) => m.type === "wastage" && inRange(m.createdAt, range))
    .reduce((s, m) => s + Math.abs(m.quantity) * 50, 0);

  const audit = buildStockAudit(db, range.end);
  const inventoryVariance = audit.reduce(
    (s, r) => s + Math.abs(r.variance ?? 0),
    0
  );

  const recovery = computeRecoveryDashboardStats(db);

  return {
    branchId,
    name: branch?.name ?? branchId,
    revenue,
    profit,
    foodCostPercent: foodCost,
    laborCostPercent: laborCost,
    wastageValue,
    inventoryVariance,
    vendorRecovery: recovery.pendingRecovery,
    attendanceRate,
    payroll,
  };
}

export function buildBranchComparisonMatrix(
  db: ProcurementDb,
  range: TimeRange
): BranchLifetimeMetrics[] {
  const active = db.branches.filter((b) => b.status === "active");
  const rows = active.map((b) => computeBranchMetricsForRange(db, b.id, range));
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0) || 1;
  return rows.map((r) => ({
    ...r,
    lifetimeContributionPercent: (r.revenue / totalRevenue) * 100,
  }));
}

export function orgRevenueForRange(db: ProcurementDb, range: TimeRange): number {
  return db.sales.filter((s) => inRange(s.consumedAt, range)).reduce((s, r) => s + r.totalRevenue, 0);
}
