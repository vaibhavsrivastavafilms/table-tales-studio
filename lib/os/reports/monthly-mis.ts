import { filterByBranch, getBranchName } from "@/lib/os/branches";
import { monthlyExpenseTotal } from "@/lib/os/finance/expenses";
import { computeAttendanceStats } from "@/lib/os/hr/attendance";
import { getTotalPayrollCost } from "@/lib/os/hr/payroll";
import { getItemLastRate } from "@/lib/os/kitchen/recipes";
import { getVendorOutstanding } from "@/lib/os/procurement/local-db";
import {
  computeFoodCostFromSales,
  computeLaborCostFromSales,
} from "@/lib/os/reports/labor-cost";
import type {
  MonthlyMisExecutiveSummary,
  MonthlyMisSnapshot,
  ProcurementDb,
} from "@/lib/os/procurement/types";

export function computeInventoryValue(db: ProcurementDb, branchId = "all"): number {
  return db.inventoryItems.reduce((sum, item) => {
    const rate = getItemLastRate(db, item.id);
    return sum + item.currentStock * (rate > 0 ? rate : 0);
  }, 0);
}

export function computeMonthlyProcurementSpend(
  db: ProcurementDb,
  month: string,
  branchId = "all"
): number {
  return filterByBranch(db.purchaseBills, branchId)
    .filter((b) => b.status === "posted" && b.invoiceDate.startsWith(month))
    .reduce((s, b) => s + b.totalValue, 0);
}

export function computeCreditNotesApplied(
  db: ProcurementDb,
  month: string,
  branchId = "all"
): number {
  return filterByBranch(db.creditNotes, branchId)
    .filter(
      (c) =>
        c.status === "applied" &&
        (c.appliedAt?.startsWith(month) || c.createdAt.startsWith(month))
    )
    .reduce((s, c) => s + c.amount, 0);
}

export function computeVendorOutstandingTotal(db: ProcurementDb): number {
  return db.vendors.reduce((s, v) => s + getVendorOutstanding(db, v.id), 0);
}

export function computeMonthlyMis(
  db: ProcurementDb,
  month: string,
  branchId = "all"
): MonthlyMisSnapshot {
  const sales = filterByBranch(db.sales, branchId).filter((s) =>
    s.consumedAt.startsWith(month)
  );
  const revenue = sales.reduce((s, r) => s + r.totalRevenue, 0);
  const food = computeFoodCostFromSales(db, month);
  const foodCost =
    branchId === "all"
      ? food.foodCost
      : sales.reduce((sum, sale) => {
          const allFood = computeFoodCostFromSales(db, month);
          return sum + (allFood.foodCost / Math.max(allFood.orderCount, 1)) * sale.quantity;
        }, 0);
  const labor = computeLaborCostFromSales(db, month);
  const attendance = computeAttendanceStats(db, month);
  const expenses = monthlyExpenseTotal(db, month, branchId);
  const payrollCost =
    branchId === "all"
      ? getTotalPayrollCost(db, month) || labor.payrollCost
      : filterByBranch(db.payrollRuns, branchId)
          .filter((r) => r.month === month && r.status !== "draft")
          .reduce((s, r) => s + r.totalNet, 0);
  const estimatedProfit = revenue - foodCost - payrollCost - expenses;
  const estimatedProfitMargin = revenue > 0 ? (estimatedProfit / revenue) * 100 : 0;

  return {
    month,
    branchId: branchId === "all" ? "all" : branchId,
    revenue,
    procurementSpend: computeMonthlyProcurementSpend(db, month, branchId),
    inventoryValue: computeInventoryValue(db, branchId),
    vendorOutstanding: computeVendorOutstandingTotal(db),
    creditNotesApplied: computeCreditNotesApplied(db, month, branchId),
    payrollCost,
    laborCostPercent: revenue > 0 ? (payrollCost / revenue) * 100 : 0,
    foodCostPercent: revenue > 0 ? (foodCost / revenue) * 100 : food.foodCostPercent,
    operatingExpenses: expenses,
    estimatedProfit,
    estimatedProfitMargin,
    attendanceRate: attendance.attendanceRate,
    headcount: filterByBranch(db.employees, branchId).filter((e) => e.status === "active")
      .length,
    salesCount: sales.length,
  };
}

export function buildMonthlyMisBreakdown(
  db: ProcurementDb,
  month: string,
  branchId = "all"
) {
  const mis = computeMonthlyMis(db, month, branchId);
  return {
    mis,
    sections: {
      sales: {
        revenue: mis.revenue,
        orders: mis.salesCount,
      },
      procurement: {
        spend: mis.procurementSpend,
        vendorOutstanding: mis.vendorOutstanding,
        creditNotesApplied: mis.creditNotesApplied,
      },
      inventory: {
        value: mis.inventoryValue,
        skuCount: db.inventoryItems.length,
        lowStock: db.inventoryItems.filter((i) => i.currentStock < i.parLevel).length,
      },
      workforce: {
        headcount: mis.headcount,
        payrollCost: mis.payrollCost,
        laborCostPercent: mis.laborCostPercent,
        attendanceRate: mis.attendanceRate,
      },
      finance: {
        foodCostPercent: mis.foodCostPercent,
        operatingExpenses: mis.operatingExpenses,
        estimatedProfit: mis.estimatedProfit,
        estimatedProfitMargin: mis.estimatedProfitMargin,
      },
    },
  };
}

export function buildExecutiveSummary(
  db: ProcurementDb,
  month: string,
  branchId = "all"
): MonthlyMisExecutiveSummary {
  const { mis, sections } = buildMonthlyMisBreakdown(db, month, branchId);
  const branchLabel =
    branchId === "all" ? "All branches" : getBranchName(db, branchId);

  return {
    month,
    branchId,
    executiveSummary: `${branchLabel} · ${month}: Revenue ₹${mis.revenue.toLocaleString("en-IN")}, estimated margin ${mis.estimatedProfitMargin.toFixed(1)}%.`,
    salesSummary: `${sections.sales.orders} orders · ₹${sections.sales.revenue.toLocaleString("en-IN")} revenue.`,
    procurementSummary: `Spend ₹${sections.procurement.spend.toLocaleString("en-IN")} · Outstanding ₹${sections.procurement.vendorOutstanding.toLocaleString("en-IN")}.`,
    inventorySummary: `Stock value ₹${sections.inventory.value.toLocaleString("en-IN")} · ${sections.inventory.lowStock} SKUs low.`,
    vendorSummary: `Credit notes applied ₹${sections.procurement.creditNotesApplied.toLocaleString("en-IN")}.`,
    foodCostSummary: `Food cost ${sections.finance.foodCostPercent.toFixed(1)}% of revenue.`,
    laborCostSummary: `Labor ${sections.workforce.laborCostPercent.toFixed(1)}% · Payroll ₹${sections.workforce.payrollCost.toLocaleString("en-IN")}.`,
    expenseSummary: `Operating expenses ₹${sections.finance.operatingExpenses.toLocaleString("en-IN")}.`,
    profitabilitySummary: `Est. profit ₹${sections.finance.estimatedProfit.toLocaleString("en-IN")} (${sections.finance.estimatedProfitMargin.toFixed(1)}%).`,
  };
}

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function previousMonthKey(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return d.toISOString().slice(0, 7);
}

export type ExpenseSummaryRow = {
  category: string;
  budget: number;
  actual: number;
  variance: number;
  pctOfRevenue: number;
};

export function buildExpenseSummaryTable(
  db: ProcurementDb,
  month: string,
  branchId = "all"
): ExpenseSummaryRow[] {
  const mis = computeMonthlyMis(db, month, branchId);
  const prevMonth = previousMonthKey(month);
  const prevByCategory = new Map<string, number>();
  for (const e of filterByBranch(db.operatingExpenses, branchId).filter(
    (x) => x.month === prevMonth && x.status === "approved"
  )) {
    prevByCategory.set(
      e.category,
      (prevByCategory.get(e.category) ?? 0) + e.amountPaise / 100
    );
  }
  const actualByCategory = new Map<string, number>();
  for (const e of filterByBranch(db.operatingExpenses, branchId).filter(
    (x) => x.month === month && x.status === "approved"
  )) {
    actualByCategory.set(
      e.category,
      (actualByCategory.get(e.category) ?? 0) + e.amountPaise / 100
    );
  }
  const categories = new Set([...prevByCategory.keys(), ...actualByCategory.keys()]);
  const rows: ExpenseSummaryRow[] = [...categories].map((category) => {
    const budget = prevByCategory.get(category) ?? 0;
    const actual = actualByCategory.get(category) ?? 0;
    return {
      category,
      budget,
      actual,
      variance: actual - budget,
      pctOfRevenue: mis.revenue > 0 ? (actual / mis.revenue) * 100 : 0,
    };
  });
  return rows.sort((a, b) => b.actual - a.actual);
}

export type ProfitabilitySummaryRow = {
  label: string;
  amount: number;
  pctOfRevenue: number;
  priorAmount: number;
  priorPct: number;
};

export function buildProfitabilitySummary(
  db: ProcurementDb,
  month: string,
  branchId = "all"
): ProfitabilitySummaryRow[] {
  const mis = computeMonthlyMis(db, month, branchId);
  const prior = computeMonthlyMis(db, previousMonthKey(month), branchId);
  const mk = (label: string, amount: number, priorAmount: number): ProfitabilitySummaryRow => ({
    label,
    amount,
    pctOfRevenue: mis.revenue > 0 ? (amount / mis.revenue) * 100 : 0,
    priorAmount,
    priorPct: prior.revenue > 0 ? (priorAmount / prior.revenue) * 100 : 0,
  });
  return [
    mk("Revenue", mis.revenue, prior.revenue),
    mk("Food Cost", mis.revenue * (mis.foodCostPercent / 100), prior.revenue * (prior.foodCostPercent / 100)),
    mk("Labor Cost", mis.payrollCost, prior.payrollCost),
    mk("Operating Expenses", mis.operatingExpenses, prior.operatingExpenses),
    mk("Net Profit", mis.estimatedProfit, prior.estimatedProfit),
  ];
}

export function buildBranchComparisonPnL(db: ProcurementDb, month: string) {
  const branches = db.branches.filter((b) => b.status === "active");
  return branches.map((b) => {
    const mis = computeMonthlyMis(db, month, b.id);
    return {
      branchId: b.id,
      name: b.name,
      revenue: mis.revenue,
      foodCost: mis.revenue * (mis.foodCostPercent / 100),
      foodCostPct: mis.foodCostPercent,
      laborCost: mis.payrollCost,
      laborCostPct: mis.laborCostPercent,
      expenses: mis.operatingExpenses,
      netProfit: mis.estimatedProfit,
      netMargin: mis.estimatedProfitMargin,
    };
  });
}
