import { filterByBranch } from "@/lib/os/branches";
import { listMenuOverviewRows } from "@/lib/os/kitchen/menu-cost";
import type { ProcurementDb } from "@/lib/os/procurement/types";
import type { ReadinessPriority } from "@/lib/os/platform/business-readiness";

export type MissingDataGap = {
  id: string;
  title: string;
  detail: string;
  priority: ReadinessPriority;
  impact: string;
  affectedModule: string;
  recommendedAction: string;
  actionHref?: string;
  count?: number;
};

export type MissingDataReport = {
  generatedAt: string;
  totalGaps: number;
  criticalCount: number;
  highCount: number;
  gaps: MissingDataGap[];
  summary: string;
};

function gap(partial: MissingDataGap): MissingDataGap {
  return partial;
}

export function generateMissingDataReport(db: ProcurementDb): MissingDataReport {
  const gaps: MissingDataGap[] = [];
  const menuRows = listMenuOverviewRows(db);
  const recipesWithoutCosting = menuRows.filter((r) => !r.costed);
  const ingredientsNoRate = db.menuIngredients.filter((i) => i.costPerUnitPaise <= 0);
  const inventoryNoCategory = db.inventoryItems.filter((i) => !i.category);
  const recipeItemIds = new Set(db.recipeIngredients.map((l) => l.itemId));
  const inventoryUnmapped = db.inventoryItems.filter((i) => !recipeItemIds.has(i.id));
  const flipUnmapped = db.flipMenuMappings?.filter((m) => !m.recipeId) ?? [];
  const expensesPending = db.operatingExpenses.filter((e) => e.status === "pending");
  const employeesNoSalary = db.employees.filter((e) => e.monthlySalary <= 0);
  const vendorsNoGst = db.vendors.filter((v) => !v.gstNumber?.trim());
  const branchesNoOpening = db.branches.filter(() => db.openingStock.length === 0);

  if (ingredientsNoRate.length) {
    gaps.push(
      gap({
        id: "missing_ingredient_rates",
        title: "Missing ingredient purchase rates",
        detail: `${ingredientsNoRate.length} ingredients have no cost rate`,
        priority: "high",
        impact: "Food cost % and recipe margins will be inaccurate",
        affectedModule: "Food Cost / Recipes",
        recommendedAction: "Upload vendor bills or bulk-import ingredient rates",
        actionHref: "/os/recipes/ingredients",
        count: ingredientsNoRate.length,
      })
    );
  }

  if (recipesWithoutCosting.length) {
    gaps.push(
      gap({
        id: "recipes_without_costing",
        title: "Recipes without costing",
        detail: `${recipesWithoutCosting.length} menu items lack full cost sheets`,
        priority: "high",
        impact: "Cannot calculate true food cost or suggest repricing",
        affectedModule: "Recipes / Menu Engineering",
        recommendedAction: "Map recipe ingredients and run cost calculator",
        actionHref: "/os/recipes/menu",
        count: recipesWithoutCosting.length,
      })
    );
  }

  if (inventoryNoCategory.length) {
    gaps.push(
      gap({
        id: "inventory_no_category",
        title: "Inventory items without category",
        detail: `${inventoryNoCategory.length} SKUs missing category classification`,
        priority: "medium",
        impact: "Procurement analytics and stock reports incomplete",
        affectedModule: "Inventory",
        recommendedAction: "Update item master categories",
        actionHref: "/os/inventory/items",
        count: inventoryNoCategory.length,
      })
    );
  }

  if (inventoryUnmapped.length) {
    gaps.push(
      gap({
        id: "inventory_not_in_recipes",
        title: "Inventory not mapped to recipes",
        detail: `${inventoryUnmapped.length} items never used in any recipe`,
        priority: "medium",
        impact: "Sales consumption will not reduce these SKUs",
        affectedModule: "Inventory / Recipes",
        recommendedAction: "Link items to prep or menu recipes",
        actionHref: "/os/kitchen/recipes",
        count: inventoryUnmapped.length,
      })
    );
  }

  if (flipUnmapped.length) {
    gaps.push(
      gap({
        id: "flip_menu_unmapped",
        title: "Flip Office menu items not mapped",
        detail: `${flipUnmapped.length} POS items lack recipe mapping`,
        priority: "high",
        impact: "Auto-imported sales will not consume inventory",
        affectedModule: "Flip Office / Sales",
        recommendedAction: "Map POS items to recipes in Flip Office integration",
        actionHref: "/os/integrations/flip-office",
        count: flipUnmapped.length,
      })
    );
  }

  if (expensesPending.length) {
    gaps.push(
      gap({
        id: "expenses_pending",
        title: "Expenses missing approval",
        detail: `${expensesPending.length} operating expenses awaiting approval`,
        priority: "medium",
        impact: "P&L and net profit understated until approved",
        affectedModule: "Finance",
        recommendedAction: "Review and approve pending expenses",
        actionHref: "/os/approvals",
        count: expensesPending.length,
      })
    );
  }

  if (employeesNoSalary.length) {
    gaps.push(
      gap({
        id: "employees_no_salary",
        title: "Employees missing salary",
        detail: `${employeesNoSalary.length} employees have zero monthly salary`,
        priority: "high",
        impact: "Labor cost % and payroll MIS will be wrong",
        affectedModule: "HR / Payroll",
        recommendedAction: "Complete employee master with salary data",
        actionHref: "/os/hr/employees",
        count: employeesNoSalary.length,
      })
    );
  }

  if (branchesNoOpening.length) {
    gaps.push(
      gap({
        id: "opening_stock_missing",
        title: "Branches missing opening stock",
        detail: `${branchesNoOpening.length} branches lack opening stock baseline`,
        priority: "high",
        impact: "Inventory value and variance calculations unreliable",
        affectedModule: "Inventory",
        recommendedAction: "Capture opening stock per branch",
        actionHref: "/os/inventory/opening-stock",
        count: branchesNoOpening.length,
      })
    );
  }

  if (vendorsNoGst.length) {
    gaps.push(
      gap({
        id: "vendors_no_gst",
        title: "Vendors missing GSTIN",
        detail: `${vendorsNoGst.length} vendors without GST number`,
        priority: "medium",
        impact: "Tax compliance and vendor ledger reconciliation gaps",
        affectedModule: "Procurement",
        recommendedAction: "Update vendor GST details from invoices",
        actionHref: "/os/procurement/vendors",
        count: vendorsNoGst.length,
      })
    );
  }

  const branchSales = db.branches.filter(
    (b) => filterByBranch(db.sales, b.id).length === 0
  );
  if (branchSales.length) {
    gaps.push(
      gap({
        id: "branch_no_sales",
        title: "Branches with no sales data",
        detail: branchSales.map((b) => b.name.split(" ").slice(-1)[0]).join(", "),
        priority: "high",
        impact: "Branch profitability and owner KPIs incomplete",
        affectedModule: "Sales / Branch Intelligence",
        recommendedAction: "Connect Flip Office or import sales CSV",
        actionHref: "/os/integrations/flip-office",
        count: branchSales.length,
      })
    );
  }

  const wastageTracked = db.inventoryMovements.some((m) => m.type === "wastage");
  if (!wastageTracked) {
    gaps.push(
      gap({
        id: "no_wastage_tracking",
        title: "No wastage records captured",
        detail: "Wastage movements not logged in inventory",
        priority: "medium",
        impact: "Food cost leakage hidden in variance",
        affectedModule: "Inventory / Food Cost",
        recommendedAction: "Record wastage via stock audit or manual entry",
        actionHref: "/os/inventory/stock-audit",
      })
    );
  }

  gaps.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  });

  const criticalCount = gaps.filter((g) => g.priority === "high").length;
  const highCount = gaps.length;

  return {
    generatedAt: new Date().toISOString(),
    totalGaps: gaps.length,
    criticalCount,
    highCount,
    gaps,
    summary:
      gaps.length === 0
        ? "All core data paths are connected. Calculations can run with confidence."
        : `${gaps.length} data gaps detected — ${criticalCount} high priority. Resolve these to unlock accurate profitability intelligence.`,
  };
}
