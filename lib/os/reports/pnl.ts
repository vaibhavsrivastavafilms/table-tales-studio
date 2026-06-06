import { filterByBranch, getBranchName } from "@/lib/os/branches";
import { computeFoodCostFromSales } from "@/lib/os/reports/labor-cost";
import { getTotalPayrollCost } from "@/lib/os/hr/payroll";
import { monthlyExpenseTotal } from "@/lib/os/finance/expenses";
import type { PnlPeriod, PnlReport, ProcurementDb } from "@/lib/os/procurement/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function periodRange(period: PnlPeriod, key: string) {
  if (period === "daily") {
    return { start: key, end: key };
  }
  if (period === "weekly") {
    const [y, w] = key.split("-W");
    return { start: `${y}-W${w}`, end: `${y}-W${w}` };
  }
  return { start: `${key}-01`, end: `${key}-31` };
}

export function computePnl(
  db: ProcurementDb,
  period: PnlPeriod,
  periodKey: string,
  branchId = "all"
): Omit<PnlReport, "id" | "createdAt"> {
  const sales = filterByBranch(db.sales, branchId);
  const bills = filterByBranch(db.purchaseBills, branchId).filter(
    (b) => b.status === "posted"
  );

  let revenue = 0;
  let foodCost = 0;
  let monthKey = periodKey;

  if (period === "daily") {
    revenue = sales
      .filter((s) => s.consumedAt.slice(0, 10) === periodKey)
      .reduce((sum, s) => sum + s.totalRevenue, 0);
    const dayFood = computeFoodCostFromSales(db, periodKey.slice(0, 7));
    foodCost = dayFood.foodCost * (revenue / Math.max(dayFood.revenue, 1));
    monthKey = periodKey.slice(0, 7);
  } else if (period === "monthly") {
    monthKey = periodKey;
    const food = computeFoodCostFromSales(db, monthKey);
    revenue = food.revenue;
    foodCost = food.foodCost;
  } else {
    monthKey = periodKey.slice(0, 7);
    const food = computeFoodCostFromSales(db, monthKey);
    revenue = food.revenue;
    foodCost = food.foodCost;
  }

  const laborCost = getTotalPayrollCost(db, monthKey);
  const operatingExpenses = monthlyExpenseTotal(db, monthKey, branchId);
  const grossProfit = revenue - foodCost;
  const netProfit = revenue - foodCost - laborCost - operatingExpenses;
  const profitPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    branchId: branchId === "all" ? "all" : branchId,
    period,
    periodKey,
    revenue,
    foodCost,
    laborCost,
    operatingExpenses,
    grossProfit,
    netProfit,
    profitPercent,
  };
}

export function buildPnlReport(
  db: ProcurementDb,
  period: PnlPeriod,
  periodKey: string,
  branchId = "all"
): PnlReport {
  const now = new Date().toISOString();
  return { id: uid("pnl"), createdAt: now, ...computePnl(db, period, periodKey, branchId) };
}

export function compareBranchPnl(
  db: ProcurementDb,
  period: PnlPeriod,
  periodKey: string
) {
  return db.branches
    .filter((b) => b.status === "active")
    .map((branch) => {
      const pnl = computePnl(db, period, periodKey, branch.id);
      return {
        branchId: branch.id,
        branchName: branch.name,
        revenue: pnl.revenue,
        foodCost: pnl.foodCost,
        laborCost: pnl.laborCost,
        operatingExpenses: pnl.operatingExpenses,
        grossProfit: pnl.grossProfit,
        netProfit: pnl.netProfit,
        profitPercent: pnl.profitPercent,
      };
    })
    .sort((a, b) => b.netProfit - a.netProfit);
}

export function formatPnlPeriodLabel(period: PnlPeriod, key: string): string {
  if (period === "daily") return key;
  if (period === "monthly") return key;
  return key;
}

export function currentPeriodKey(period: PnlPeriod): string {
  const now = new Date();
  if (period === "daily") return now.toISOString().slice(0, 10);
  if (period === "monthly") return now.toISOString().slice(0, 7);
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${week}`;
}

export { getBranchName };
