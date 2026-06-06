import { computeAttendanceStats } from "@/lib/os/hr/attendance";
import { getTotalPayrollCost, summarizePayrollByOutlet } from "@/lib/os/hr/payroll";
import { computeRecipeCost } from "@/lib/os/kitchen/recipes";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export function computeLaborCostFromSales(
  db: ProcurementDb,
  month: string
): { payrollCost: number; revenue: number; laborCostPercent: number } {
  const revenue = db.sales
    .filter((s) => s.consumedAt.startsWith(month))
    .reduce((sum, s) => sum + s.totalRevenue, 0);
  const payrollCost = getTotalPayrollCost(db, month);
  const laborCostPercent = revenue > 0 ? (payrollCost / revenue) * 100 : 0;
  return { payrollCost, revenue, laborCostPercent };
}

export function computeFoodCostFromSales(db: ProcurementDb, month: string) {
  const sales = db.sales.filter((s) => s.consumedAt.startsWith(month));
  const revenue = sales.reduce((s, r) => s + r.totalRevenue, 0);
  const foodCost = sales.reduce((sum, sale) => {
    const cost = computeRecipeCost(db, sale.recipeId);
    return sum + cost * sale.quantity;
  }, 0);
  const foodCostPercent = revenue > 0 ? (foodCost / revenue) * 100 : 0;
  return { foodCost, revenue, foodCostPercent, orderCount: sales.length };
}

export function buildLaborCostReport(db: ProcurementDb, month: string) {
  const attendance = computeAttendanceStats(db, month);
  const labor = computeLaborCostFromSales(db, month);
  const byOutlet = summarizePayrollByOutlet(db, month);
  const headcount = db.employees.filter((e) => e.status === "active").length;

  return {
    month,
    ...labor,
    ...attendance,
    headcount,
    byOutlet,
    costPerEmployee: headcount > 0 ? labor.payrollCost / headcount : 0,
  };
}

export function compareLaborByOutlet(db: ProcurementDb, month: string) {
  return summarizePayrollByOutlet(db, month).map((row) => {
    const revenue = db.sales
      .filter(
        (s) => s.consumedAt.startsWith(month) && s.outlet === row.outlet
      )
      .reduce((sum, s) => sum + s.totalRevenue, 0);
    return {
      ...row,
      revenue,
      laborCostPercent: revenue > 0 ? (row.total / revenue) * 100 : 0,
    };
  });
}
