import { filterByBranch } from "@/lib/os/branches";
import { monthlyExpenseTotalPaise } from "@/lib/os/finance/expenses";
import { computeFoodCostFromSales } from "@/lib/os/reports/labor-cost";
import { getTotalPayrollCost } from "@/lib/os/hr/payroll";
import { rupeesToPaise, paiseToRupees } from "@/lib/os/money";
import type { PnlPeriod, ProcurementDb } from "@/lib/os/procurement/types";

export type PnlSnapshot = {
  id: string;
  branchId: string;
  periodType: PnlPeriod;
  periodStart: string;
  periodEnd: string;
  revenuePaise: number;
  foodCostPaise: number;
  laborCostPaise: number;
  expensesPaise: number;
  grossProfitPaise: number;
  netProfitPaise: number;
  foodCostPct: number;
  laborCostPct: number;
  expensePct: number;
  netMargin: number;
  createdAt: string;
};

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function periodBounds(
  periodType: PnlPeriod,
  periodStart: string
): { start: string; end: string; monthKey: string } {
  if (periodType === "daily") {
    return { start: periodStart, end: periodStart, monthKey: periodStart.slice(0, 7) };
  }
  if (periodType === "monthly") {
    return {
      start: `${periodStart.slice(0, 7)}-01`,
      end: `${periodStart.slice(0, 7)}-31`,
      monthKey: periodStart.slice(0, 7),
    };
  }
  return { start: periodStart, end: periodStart, monthKey: periodStart.slice(0, 7) };
}

/** Regenerate P&L from source tables — never cache-only reads. */
export function generatePnLSnapshot(
  db: ProcurementDb,
  branchId: string,
  periodType: PnlPeriod,
  periodStart: string,
  periodEnd?: string
): PnlSnapshot {
  const bounds = periodBounds(periodType, periodStart);
  const end = periodEnd ?? bounds.end;
  const sales = filterByBranch(db.sales, branchId);

  let revenuePaise = 0;
  let foodCostPaise = 0;

  if (periodType === "daily") {
    revenuePaise = rupeesToPaise(
      sales
        .filter((s) => s.consumedAt.slice(0, 10) === periodStart)
        .reduce((sum, s) => sum + s.totalRevenue, 0)
    );
    const food = computeFoodCostFromSales(db, bounds.monthKey);
    const dayRevenue = sales
      .filter((s) => s.consumedAt.slice(0, 10) === periodStart)
      .reduce((sum, s) => sum + s.totalRevenue, 0);
    const foodRupees =
      food.revenue > 0 ? (food.foodCost / food.revenue) * dayRevenue : 0;
    foodCostPaise = rupeesToPaise(foodRupees);
  } else {
    const food = computeFoodCostFromSales(db, bounds.monthKey);
    revenuePaise = rupeesToPaise(food.revenue);
    foodCostPaise = rupeesToPaise(food.foodCost);
  }

  const laborCostPaise = rupeesToPaise(getTotalPayrollCost(db, bounds.monthKey));
  const expensesPaise = monthlyExpenseTotalPaise(db, bounds.monthKey, branchId);
  const grossProfitPaise = revenuePaise - foodCostPaise;
  const netProfitPaise = grossProfitPaise - laborCostPaise - expensesPaise;

  const foodCostPct = revenuePaise > 0 ? (foodCostPaise / revenuePaise) * 100 : 0;
  const laborCostPct = revenuePaise > 0 ? (laborCostPaise / revenuePaise) * 100 : 0;
  const expensePct = revenuePaise > 0 ? (expensesPaise / revenuePaise) * 100 : 0;
  const netMargin = revenuePaise > 0 ? (netProfitPaise / revenuePaise) * 100 : 0;

  return {
    id: uid("pnl"),
    branchId,
    periodType,
    periodStart: bounds.start,
    periodEnd: end,
    revenuePaise,
    foodCostPaise,
    laborCostPaise,
    expensesPaise,
    grossProfitPaise,
    netProfitPaise,
    foodCostPct,
    laborCostPct,
    expensePct,
    netMargin,
    createdAt: new Date().toISOString(),
  };
}

export function compareBranchPnLSnapshots(
  db: ProcurementDb,
  periodType: PnlPeriod,
  periodStart: string
) {
  return db.branches
    .filter((b) => b.status === "active")
    .map((b) => ({
      branchId: b.id,
      branchName: b.name,
      snapshot: generatePnLSnapshot(db, b.id, periodType, periodStart),
    }))
    .sort((a, b) => b.snapshot.netProfitPaise - a.snapshot.netProfitPaise);
}

export { paiseToRupees };
