import { listPendingApprovals } from "@/lib/os/approvals/engine";
import { monthlyExpenseTotal } from "@/lib/os/finance/expenses";
import { buildStockAudit } from "@/lib/os/procurement/analytics";
import { getVendorOutstanding } from "@/lib/os/procurement/local-db";
import { computeRecoveryDashboardStats } from "@/lib/os/procurement/recovery";
import {
  buildFoodCostReport,
  computeOutletFoodCost,
} from "@/lib/os/reports/food-cost";
import { generateHrInsights } from "@/lib/os/reports/hr-mis";
import {
  computeMonthlyMis,
  currentMonthKey,
} from "@/lib/os/reports/monthly-mis";
import type { OrgInsight, ProcurementDb } from "@/lib/os/procurement/types";

export function generateOrgInsights(
  db: ProcurementDb,
  month: string = currentMonthKey()
): OrgInsight[] {
  const insights: OrgInsight[] = [];
  const recovery = computeRecoveryDashboardStats(db);
  const foodCost = computeOutletFoodCost(db);
  const audit = buildStockAudit(db, new Date().toISOString().slice(0, 10));

  const topDisputeVendor = [...recovery.topVendorCredits].sort(
    (a, b) => b.amount - a.amount
  )[0];
  if (topDisputeVendor) {
    insights.push({
      id: "vendor_disputes",
      severity: "warning",
      title: "Highest dispute vendor",
      detail: `${topDisputeVendor.vendorName} has ₹${topDisputeVendor.amount.toLocaleString("en-IN")} in recoverable credits.`,
      module: "procurement",
    });
  }

  if (recovery.pendingRecovery > 0) {
    insights.push({
      id: "pending_recovery",
      severity: "critical",
      title: "Pending vendor recovery",
      detail: `₹${recovery.pendingRecovery.toLocaleString("en-IN")} still pending across open disputes and credit notes.`,
      module: "recovery",
    });
  }

  const topDisputedItem = recovery.topDisputedItems[0];
  if (topDisputedItem) {
    insights.push({
      id: "disputed_item",
      severity: "warning",
      title: "Most disputed item",
      detail: `${topDisputedItem.itemName} appears in ${topDisputedItem.count} dispute cases.`,
      module: "procurement",
    });
  }

  const varianceRows = audit.filter(
    (r) => r.variance !== null && Math.abs(r.variance) >= 0.5
  );
  if (varianceRows.length) {
    const worst = varianceRows.sort(
      (a, b) => Math.abs(b.variance ?? 0) - Math.abs(a.variance ?? 0)
    )[0];
    insights.push({
      id: "stock_variance",
      severity: "critical",
      title: "Highest stock variance",
      detail: `${worst.itemName} variance ${worst.variance?.toFixed(2)} ${worst.unit} (expected ${worst.expected}, actual ${worst.closing}).`,
      module: "inventory",
    });
  }

  const lowStock = db.inventoryItems.filter((i) => i.currentStock < i.parLevel);
  if (lowStock.length) {
    insights.push({
      id: "low_stock",
      severity: "warning",
      title: "Low stock alerts",
      detail: `${lowStock.length} SKUs below par — ${lowStock
        .slice(0, 3)
        .map((i) => i.name)
        .join(", ")}${lowStock.length > 3 ? "…" : ""}.`,
      module: "inventory",
    });
  }

  const suggested = lowStock.slice(0, 5).map((i) => i.name);
  if (suggested.length) {
    insights.push({
      id: "suggested_purchases",
      severity: "info",
      title: "Suggested purchases",
      detail: `Reorder: ${suggested.join(", ")}.`,
      module: "procurement",
    });
  }

  if (foodCost.avgFoodCostPercent > 35) {
    insights.push({
      id: "food_cost_increase",
      severity: "warning",
      title: "Food cost increase alert",
      detail: `Average theoretical food cost is ${foodCost.avgFoodCostPercent.toFixed(1)}% across ${foodCost.recipeCount} recipes.`,
      module: "food_cost",
    });
  }

  const lowMargin = buildFoodCostReport(db)
    .filter((r) => r.marginPercent < 55)
    .slice(0, 3);
  if (lowMargin.length) {
    insights.push({
      id: "margin_reduction",
      severity: "warning",
      title: "Margin reduction alert",
      detail: `Review pricing for ${lowMargin.map((r) => r.recipeName).join(", ")}.`,
      module: "food_cost",
    });
  }

  const vendorOutstanding = db.vendors
    .map((v) => ({
      name: v.name,
      outstanding: getVendorOutstanding(db, v.id),
    }))
    .sort((a, b) => b.outstanding - a.outstanding)[0];
  if (vendorOutstanding && vendorOutstanding.outstanding > 0) {
    insights.push({
      id: "vendor_outstanding",
      severity: "info",
      title: "Highest vendor outstanding",
      detail: `${vendorOutstanding.name} owes ₹${vendorOutstanding.outstanding.toLocaleString("en-IN")}.`,
      module: "ledger",
    });
  }

  const mis = computeMonthlyMis(db, month);
  if (mis.revenue > 0 && mis.estimatedProfitMargin < 15) {
    insights.push({
      id: "profitability_alert",
      severity: "critical",
      title: "Estimated profitability under pressure",
      detail: `${month}: margin ${mis.estimatedProfitMargin.toFixed(1)}% after food (${mis.foodCostPercent.toFixed(1)}%), labor (${mis.laborCostPercent.toFixed(1)}%), and expenses.`,
      module: "finance",
    });
  }

  if (mis.laborCostPercent > 30) {
    insights.push({
      id: "labor_cost_high",
      severity: "warning",
      title: "Labor cost above target",
      detail: `Labor cost is ${mis.laborCostPercent.toFixed(1)}% of revenue for ${month}.`,
      module: "labor_cost",
    });
  }

  insights.push(...generateHrInsights(db, month));
  insights.push(...generateOwnerInsights(db, month));

  return insights;
}

/** Owner-level proactive Q&A style insights across branches. */
export function generateOwnerInsights(
  db: ProcurementDb,
  month: string = currentMonthKey()
): OrgInsight[] {
  const insights: OrgInsight[] = [];
  const recovery = computeRecoveryDashboardStats(db);
  const pendingApprovals = listPendingApprovals(db);

  if (recovery.pendingRecovery > 0) {
    const top = recovery.topVendorCredits[0];
    insights.push({
      id: "owner_pending_recovery",
      severity: "warning",
      title: "Which vendor has pending recovery?",
      detail: top
        ? `${top.vendorName} — ₹${top.amount.toLocaleString("en-IN")} recoverable. Total pending ₹${recovery.pendingRecovery.toLocaleString("en-IN")}.`
        : `Total pending recovery ₹${recovery.pendingRecovery.toLocaleString("en-IN")}.`,
      module: "recovery",
    });
  }

  const branchMargins = db.branches
    .filter((b) => b.status === "active")
    .map((b) => ({
      name: b.name,
      mis: computeMonthlyMis(db, month, b.id),
    }))
    .sort((a, b) => b.mis.estimatedProfitMargin - a.mis.estimatedProfitMargin);

  if (branchMargins.length >= 2) {
    const best = branchMargins[0];
    const worstLabor = [...branchMargins].sort(
      (a, b) => b.mis.laborCostPercent - a.mis.laborCostPercent
    )[0];
    insights.push({
      id: "owner_most_profitable_branch",
      severity: "info",
      title: "Which branch is most profitable?",
      detail: `${best.name} leads with ${best.mis.estimatedProfitMargin.toFixed(1)}% est. margin in ${month}.`,
      module: "finance",
    });
    if (worstLabor.mis.laborCostPercent > 28) {
      insights.push({
        id: "owner_highest_labor",
        severity: "warning",
        title: "Which outlet has highest labor cost?",
        detail: `${worstLabor.name} at ${worstLabor.mis.laborCostPercent.toFixed(1)}% of revenue.`,
        module: "labor_cost",
      });
    }
  }

  const lowStock = db.inventoryItems
    .filter((i) => i.currentStock < i.parLevel)
    .slice(0, 5);
  if (lowStock.length) {
    insights.push({
      id: "owner_stock_runout",
      severity: "critical",
      title: "Which inventory items will run out soon?",
      detail: lowStock.map((i) => `${i.name} (${i.currentStock}/${i.parLevel})`).join(", "),
      module: "inventory",
    });
  }

  const prevMonth = month.slice(0, 5) + String(Number(month.slice(5)) - 1).padStart(2, "0");
  const expenseNow = monthlyExpenseTotal(db, month, "all");
  const expensePrev = monthlyExpenseTotal(db, prevMonth, "all");
  if (expenseNow > expensePrev * 1.1 && expensePrev > 0) {
    insights.push({
      id: "owner_expense_increase",
      severity: "warning",
      title: "Which expenses increased this month?",
      detail: `Operating expenses up ${(((expenseNow - expensePrev) / expensePrev) * 100).toFixed(0)}% vs prior month (₹${expenseNow.toLocaleString("en-IN")}).`,
      module: "finance",
    });
  }

  const orgMis = computeMonthlyMis(db, month, "all");
  insights.push({
    id: "owner_month_end_profit",
    severity: orgMis.estimatedProfitMargin < 12 ? "critical" : "info",
    title: "What is estimated month-end profit?",
    detail: `₹${orgMis.estimatedProfit.toLocaleString("en-IN")} (${orgMis.estimatedProfitMargin.toFixed(1)}% margin) after food, labor, and expenses.`,
    module: "finance",
  });

  if (pendingApprovals.length) {
    insights.push({
      id: "owner_pending_approvals",
      severity: "warning",
      title: "Which approvals are pending?",
      detail: `${pendingApprovals.length} pending — ${pendingApprovals
        .slice(0, 3)
        .map((a) => a.type.replace(/_/g, " "))
        .join(", ")}${pendingApprovals.length > 3 ? "…" : ""}.`,
      module: "approvals",
    });
  }

  const mis = computeMonthlyMis(db, month, "all");
  if (mis.foodCostPercent > 34) {
    insights.push({
      id: "owner_food_cost_why",
      severity: "warning",
      title: "Why did food cost increase?",
      detail: `Food cost is ${mis.foodCostPercent.toFixed(1)}% of revenue in ${month}. Review recipe margins and vendor rate changes.`,
      module: "food_cost",
    });
  }

  return insights;
}
