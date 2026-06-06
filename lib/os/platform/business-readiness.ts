import { filterByBranch } from "@/lib/os/branches";
import { listMenuOverviewRows } from "@/lib/os/kitchen/menu-cost";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export type BusinessReadinessScores = {
  procurement: number;
  inventory: number;
  recipes: number;
  sales: number;
  hr: number;
  finance: number;
  foodCost: number;
  profitability: number;
  overall: number;
};

export type ReadinessPriority = "high" | "medium" | "low";

export type ReadinessCheckItem = {
  id: string;
  checklistId: string;
  title: string;
  complete: boolean;
  message: string;
  askPrompt?: string;
  actionHref?: string;
  actionLabel?: string;
  affectedMetrics: string[];
  priority: ReadinessPriority;
};

export type ReadinessChecklist = {
  id: string;
  title: string;
  description: string;
  score: number;
  items: ReadinessCheckItem[];
};

export type BranchReadinessCategories = {
  salesData: number;
  recipeData: number;
  ingredientCosts: number;
  inventoryAccuracy: number;
  vendorData: number;
  attendanceData: number;
  payrollData: number;
  wastageData: number;
  expenseData: number;
};

export type BranchReadinessDetail = {
  branchId: string;
  name: string;
  shortName: string;
  overall: number;
  categories: BranchReadinessCategories;
  missing: ReadinessCheckItem[];
};

export type BranchReadinessRow = {
  branchId: string;
  name: string;
  overall: number;
  gaps: string[];
  categories: BranchReadinessCategories;
};

export type SmartQuestion = {
  id: string;
  question: string;
  options: { value: string; label: string }[];
  checklistId: string;
  shownWhenIncomplete: string;
};

export type BusinessReadinessReport = {
  scores: BusinessReadinessScores;
  checklists: ReadinessChecklist[];
  missingHigh: ReadinessCheckItem[];
  missingMedium: ReadinessCheckItem[];
  missingLow: ReadinessCheckItem[];
  branchRows: BranchReadinessRow[];
  branchDetails: BranchReadinessDetail[];
  smartQuestions: SmartQuestion[];
  overallLabel: string;
};

function pct(complete: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((complete / total) * 100);
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function branchShortName(name: string): string {
  if (name.includes("Prahladnagar")) return "Prahladnagar";
  if (name.includes("SBR")) return "SBR";
  if (name.includes("Nikol")) return "Nikol";
  if (name.includes("Central") || name.includes("Pure Foods")) return "Pure Foods";
  return name;
}

function scoreBranchCategories(
  db: ProcurementDb,
  branchId: string
): BranchReadinessCategories {
  const month = new Date().toISOString().slice(0, 7);
  const sales = filterByBranch(db.sales, branchId);
  const employees = filterByBranch(db.employees, branchId);
  const attendance = filterByBranch(db.attendanceRecords, branchId);
  const expenses = filterByBranch(db.operatingExpenses, branchId);
  const opening = db.openingStock;
  const wastage = filterByBranch(db.inventoryMovements, branchId).filter(
    (m) => m.type === "wastage"
  );
  const menuRows = listMenuOverviewRows(db);
  const costed = menuRows.filter((r) => r.costed).length;
  const ingredientsRated = db.menuIngredients.filter((i) => i.costPerUnitPaise > 0).length;
  const ingredientsTotal = db.menuIngredients.length || 1;
  const vendorsGst = db.vendors.filter((v) => v.gstNumber?.trim()).length;
  const vendorsTotal = db.vendors.length || 1;
  const payrollOk = db.payrollRuns.some((p) => p.month === month);

  return {
    salesData: sales.length > 0 ? 100 : 0,
    recipeData: pct(costed, Math.max(menuRows.length, 1)),
    ingredientCosts: pct(ingredientsRated, ingredientsTotal),
    inventoryAccuracy: pct(opening.length > 0 ? 1 : 0, 1),
    vendorData: pct(vendorsGst, vendorsTotal),
    attendanceData: employees.length
      ? pct(attendance.filter((a) => a.date.startsWith(month)).length, employees.length * 4)
      : 0,
    payrollData: payrollOk ? 100 : employees.length ? 40 : 0,
    wastageData: wastage.length > 0 ? 100 : 50,
    expenseData: expenses.length >= 2 ? 100 : pct(expenses.length, 2),
  };
}

function item(
  partial: Omit<ReadinessCheckItem, "complete"> & { complete: boolean }
): ReadinessCheckItem {
  return partial;
}

export function calculateBranchReadinessDetail(
  db: ProcurementDb,
  branchId: string
): BranchReadinessDetail {
  const branch = db.branches.find((b) => b.id === branchId);
  const categories = scoreBranchCategories(db, branchId);
  const catScores = Object.values(categories);
  const overall = Math.round(catScores.reduce((s, n) => s + n, 0) / catScores.length);

  const missing: ReadinessCheckItem[] = [];
  if (categories.salesData < 100) {
    missing.push(
      item({
        id: `${branchId}_sales`,
        checklistId: "sales",
        title: "Sales data missing",
        complete: false,
        message: "No sales recorded for this branch",
        actionHref: "/os/integrations/flip-office",
        actionLabel: "Connect POS",
        affectedMetrics: ["Revenue", "Profitability"],
        priority: "high",
      })
    );
  }
  if (categories.ingredientCosts < 60) {
    missing.push(
      item({
        id: `${branchId}_rates`,
        checklistId: "ingredient_costing",
        title: "Ingredient rates incomplete",
        complete: false,
        message: "Purchase rates needed for food cost accuracy",
        actionHref: "/os/recipes/ingredients",
        actionLabel: "Update Rates",
        affectedMetrics: ["Food Cost %"],
        priority: "high",
      })
    );
  }
  if (categories.inventoryAccuracy < 100) {
    missing.push(
      item({
        id: `${branchId}_opening`,
        checklistId: "opening_stock",
        title: "Opening stock missing",
        complete: false,
        message: "Baseline inventory not captured",
        actionHref: "/os/inventory/opening-stock",
        actionLabel: "Opening Stock",
        affectedMetrics: ["Inventory Value", "Variance"],
        priority: "high",
      })
    );
  }

  return {
    branchId,
    name: branch?.name ?? branchId,
    shortName: branchShortName(branch?.name ?? branchId),
    overall,
    categories,
    missing,
  };
}

export function calculateBusinessReadiness(
  db: ProcurementDb,
  branchId = "all"
): BusinessReadinessReport {
  const scopedSales = filterByBranch(db.sales, branchId);
  const month = new Date().toISOString().slice(0, 7);

  const vendorsWithGst = db.vendors.filter((v) => v.gstNumber?.trim()).length;
  const postedBills = db.purchaseBills.filter((b) => b.status === "posted").length;
  const draftBills = db.purchaseBills.filter((b) => b.status === "draft").length;
  const ledgerEntries = db.vendorLedger.length;
  const creditNotes = db.creditNotes.length;
  const pendingOmissions = db.omissionCases.filter((o) => o.status === "pending").length;

  const procurementItems: ReadinessCheckItem[] = [
    item({
      id: "proc_vendors",
      checklistId: "procurement",
      title: "Vendors added",
      complete: db.vendors.length > 0,
      message: db.vendors.length > 0 ? `${db.vendors.length} vendors on file` : "No vendors in system",
      askPrompt: "Please add your regular food suppliers.",
      actionHref: "/os/procurement/vendors",
      actionLabel: "Add Vendors",
      affectedMetrics: ["Vendor Outstanding", "Purchase Analytics"],
      priority: "high",
    }),
    item({
      id: "proc_gst",
      checklistId: "procurement",
      title: "Vendor GST captured",
      complete: vendorsWithGst > 0,
      message:
        vendorsWithGst > 0
          ? `${vendorsWithGst} vendors with GSTIN`
          : "Vendor GST numbers missing",
      askPrompt: "Add GSTIN for tax-compliant vendor ledger.",
      actionHref: "/os/procurement/vendors",
      actionLabel: "Update Vendors",
      affectedMetrics: ["Vendor Ledger", "Compliance"],
      priority: "medium",
    }),
    item({
      id: "proc_bills",
      checklistId: "procurement",
      title: "Purchase bills uploaded",
      complete: db.purchaseBills.length > 0,
      message:
        db.purchaseBills.length > 0
          ? `${db.purchaseBills.length} bills (${postedBills} posted)`
          : "No purchase bills uploaded",
      askPrompt: "Please upload your recent purchase bills.",
      actionHref: "/os/procurement/upload-bill",
      actionLabel: "Upload Bills",
      affectedMetrics: ["Purchases", "Inventory Rate", "Food Cost"],
      priority: "high",
    }),
    item({
      id: "proc_ledger",
      checklistId: "procurement",
      title: "Vendor ledger active",
      complete: ledgerEntries > 0,
      message: ledgerEntries > 0 ? `${ledgerEntries} ledger entries` : "Ledger empty — post bills first",
      actionHref: "/os/procurement/vendor-ledger",
      actionLabel: "View Ledger",
      affectedMetrics: ["Vendor Outstanding", "Payments"],
      priority: "medium",
    }),
    item({
      id: "proc_credit",
      checklistId: "procurement",
      title: "Credit note workflow",
      complete: creditNotes > 0 || pendingOmissions === 0,
      message:
        creditNotes > 0
          ? `${creditNotes} credit notes recorded`
          : pendingOmissions > 0
            ? `${pendingOmissions} omissions pending credit`
            : "Credit workflow ready",
      actionHref: "/os/procurement/credit-note-register",
      actionLabel: "Credit Register",
      affectedMetrics: ["Vendor Recovery", "Outstanding"],
      priority: "low",
    }),
  ];

  const ingredientsWithRate = db.menuIngredients.filter((i) => i.costPerUnitPaise > 0);
  const ingredientsTotal = db.menuIngredients.length;
  const menuRows = listMenuOverviewRows(db);
  const costedRecipes = menuRows.filter((r) => r.costed).length;
  const recipeLines = db.menuRecipeIngredients.length;

  const ingredientItems: ReadinessCheckItem[] = [
    item({
      id: "ing_rates",
      checklistId: "ingredient_costing",
      title: "Ingredient purchase rates",
      complete: ingredientsTotal > 0 && ingredientsWithRate.length >= ingredientsTotal * 0.5,
      message:
        ingredientsTotal === 0
          ? "Ingredient master empty"
          : `${ingredientsWithRate.length}/${ingredientsTotal} ingredients have rates`,
      askPrompt: "Ingredient rates are missing. Upload vendor bills or an ingredient rate sheet.",
      actionHref: "/os/recipes/ingredients",
      actionLabel: "Ingredient Rates",
      affectedMetrics: ["Food Cost %", "Recipe Cost", "Profitability"],
      priority: "high",
    }),
  ];

  const openingStockItems: ReadinessCheckItem[] = [
    item({
      id: "inv_opening",
      checklistId: "opening_stock",
      title: "Opening stock entered",
      complete: db.openingStock.length > 0,
      message:
        db.openingStock.length > 0
          ? `${db.openingStock.length} opening stock records`
          : "Opening stock has not been entered",
      askPrompt: "Upload opening stock sheet or capture via OCR photos.",
      actionHref: "/os/inventory/opening-stock",
      actionLabel: "Opening Stock",
      affectedMetrics: ["Inventory Value", "Variance", "Consumption"],
      priority: "high",
    }),
  ];

  const recipeItems: ReadinessCheckItem[] = [
    item({
      id: "recipes_mapped",
      checklistId: "recipes",
      title: "Recipe ingredient mapping",
      complete: recipeLines > 0,
      message:
        recipeLines > 0
          ? `${recipeLines} recipe ingredient lines · ${costedRecipes} recipes costed`
          : "Recipes are not mapped to ingredients",
      askPrompt: "Upload recipe costing sheet or map ingredients per recipe.",
      actionHref: "/os/recipes/menu",
      actionLabel: "Menu Overview",
      affectedMetrics: ["Food Cost", "Consumption", "Menu Engineering"],
      priority: "high",
    }),
  ];

  const prepItems: ReadinessCheckItem[] = [
    item({
      id: "prep_recipes",
      checklistId: "prep_recipes",
      title: "Prep / semi-finished recipes",
      complete: db.prepRecipes.length >= 2,
      message:
        db.prepRecipes.length >= 2
          ? `${db.prepRecipes.length} prep recipes defined`
          : "Prep recipes missing (sauces, gravies, marinades)",
      askPrompt: "Do you prepare semi-finished items in-house? Upload prep recipes if yes.",
      actionHref: "/os/kitchen/prep-production",
      actionLabel: "Prep Production",
      affectedMetrics: ["Food Cost Accuracy"],
      priority: "medium",
    }),
  ];

  const recipesWithSalesLink = db.recipes.filter((r) =>
    db.sales.some((s) => s.recipeId === r.id)
  ).length;
  const salesItems: ReadinessCheckItem[] = [
    item({
      id: "sales_recorded",
      checklistId: "sales",
      title: "Sales transactions recorded",
      complete: scopedSales.length > 0,
      message:
        scopedSales.length > 0
          ? `${scopedSales.length} sales records`
          : "No sales data — metrics will show Waiting for Data",
      actionHref: "/os/operations/sales",
      actionLabel: "Record Sales",
      affectedMetrics: ["Revenue", "Consumption", "Profitability"],
      priority: "high",
    }),
    item({
      id: "sales_recipe_link",
      checklistId: "sales_mapping",
      title: "Menu items linked to recipes",
      complete: db.recipes.length > 0 && recipesWithSalesLink > 0,
      message:
        recipesWithSalesLink > 0
          ? `${recipesWithSalesLink} recipes linked via sales`
          : "Sales cannot reduce inventory without recipe links",
      askPrompt: "Map each menu item to its recipe for consumption tracking.",
      actionHref: "/os/recipes/menu",
      actionLabel: "Map Recipes",
      affectedMetrics: ["Consumption", "Inventory", "Food Cost"],
      priority: "medium",
    }),
  ];

  const hrItems: ReadinessCheckItem[] = [
    item({
      id: "hr_employees",
      checklistId: "employees",
      title: "Employee master",
      complete: db.employees.length > 0,
      message:
        db.employees.length > 0
          ? `${db.employees.length} employees`
          : "Upload employee master (name, department, salary, branch)",
      actionHref: "/os/hr/employees",
      actionLabel: "Employee Master",
      affectedMetrics: ["Labor Cost", "HR MIS"],
      priority: "high",
    }),
    item({
      id: "hr_attendance",
      checklistId: "attendance",
      title: "Attendance records",
      complete: db.attendanceRecords.length > 0,
      message:
        db.attendanceRecords.length > 0
          ? `${db.attendanceRecords.length} attendance records`
          : "Connect Flip Office or upload attendance CSV",
      actionHref: "/os/hr/attendance",
      actionLabel: "Attendance",
      affectedMetrics: ["Labor Cost %", "HR MIS"],
      priority: "medium",
    }),
    item({
      id: "hr_payroll",
      checklistId: "payroll",
      title: "Payroll runs generated",
      complete: db.payrollRuns.some((p) => p.month === month),
      message: db.payrollRuns.length
        ? `${db.payrollRuns.length} payroll runs (current month: ${db.payrollRuns.some((p) => p.month === month) ? "yes" : "no"})`
        : "Generate payroll for accurate labor cost",
      actionHref: "/os/hr/payroll",
      actionLabel: "Payroll",
      affectedMetrics: ["Profitability", "Labor Cost %"],
      priority: "high",
    }),
  ];

  const expenseCategories = new Set(db.operatingExpenses.map((e) => e.category));
  const financeItems: ReadinessCheckItem[] = [
    item({
      id: "fin_expenses",
      checklistId: "expenses",
      title: "Operating expenses captured",
      complete: db.operatingExpenses.length >= 3,
      message:
        db.operatingExpenses.length >= 3
          ? `${db.operatingExpenses.length} expenses · ${expenseCategories.size} categories`
          : "Upload monthly expenses (rent, utilities, marketing…)",
      actionHref: "/os/finance/expenses",
      actionLabel: "Expenses",
      affectedMetrics: ["Net Profit", "P&L"],
      priority: "medium",
    }),
  ];

  const recoveryItems: ReadinessCheckItem[] = [
    item({
      id: "vendor_recovery",
      checklistId: "vendor_recovery",
      title: "Vendor recovery reviewed",
      complete: pendingOmissions === 0 || db.vendorDisputes.length > 0,
      message:
        pendingOmissions > 0
          ? `${pendingOmissions} unresolved omissions`
          : "Vendor recovery queue clear",
      actionHref: "/os/procurement/omissions",
      actionLabel: "Omission Center",
      affectedMetrics: ["Vendor Outstanding", "Recovery"],
      priority: pendingOmissions > 0 ? "high" : "low",
    }),
  ];

  const checklists: ReadinessChecklist[] = [
    {
      id: "procurement",
      title: "Procurement",
      description: "Vendors, bills, ledger, and credit workflow",
      score: pct(
        procurementItems.filter((i) => i.complete).length,
        procurementItems.length
      ),
      items: procurementItems,
    },
    {
      id: "ingredient_costing",
      title: "Ingredient Costing",
      description: "Purchase rates for menu ingredients",
      score: pct(
        ingredientItems.filter((i) => i.complete).length,
        ingredientItems.length
      ),
      items: ingredientItems,
    },
    {
      id: "opening_stock",
      title: "Opening Stock",
      description: "Baseline inventory for valuation",
      score: pct(
        openingStockItems.filter((i) => i.complete).length,
        openingStockItems.length
      ),
      items: openingStockItems,
    },
    {
      id: "recipes",
      title: "Recipes",
      description: "Menu recipes mapped to ingredients",
      score: pct(recipeItems.filter((i) => i.complete).length, recipeItems.length),
      items: recipeItems,
    },
    {
      id: "prep_recipes",
      title: "Prep Recipes",
      description: "Semi-finished kitchen production",
      score: pct(prepItems.filter((i) => i.complete).length, prepItems.length),
      items: prepItems,
    },
    {
      id: "sales",
      title: "Sales",
      description: "Revenue and recipe consumption",
      score: pct(salesItems.filter((i) => i.complete).length, salesItems.length),
      items: salesItems,
    },
    {
      id: "hr",
      title: "HR & Payroll",
      description: "Workforce master, attendance, payroll",
      score: pct(hrItems.filter((i) => i.complete).length, hrItems.length),
      items: hrItems,
    },
    {
      id: "finance",
      title: "Finance",
      description: "Operating expenses for P&L",
      score: pct(financeItems.filter((i) => i.complete).length, financeItems.length),
      items: financeItems,
    },
    {
      id: "vendor_recovery",
      title: "Vendor Recovery",
      description: "Omissions, disputes, credit notes",
      score: pct(recoveryItems.filter((i) => i.complete).length, recoveryItems.length),
      items: recoveryItems,
    },
  ];

  const allItems = checklists.flatMap((c) => c.items);
  const missing = allItems.filter((i) => !i.complete);

  const scores: BusinessReadinessScores = {
    procurement: checklists.find((c) => c.id === "procurement")!.score,
    inventory: checklists.find((c) => c.id === "opening_stock")!.score,
    recipes: avg([
      checklists.find((c) => c.id === "recipes")!.score,
      checklists.find((c) => c.id === "prep_recipes")!.score,
    ]),
    sales: checklists.find((c) => c.id === "sales")!.score,
    hr: checklists.find((c) => c.id === "hr")!.score,
    finance: checklists.find((c) => c.id === "finance")!.score,
    foodCost: avg([
      checklists.find((c) => c.id === "ingredient_costing")!.score,
      checklists.find((c) => c.id === "recipes")!.score,
    ]),
    profitability: avg([
      checklists.find((c) => c.id === "sales")!.score,
      checklists.find((c) => c.id === "ingredient_costing")!.score,
      checklists.find((c) => c.id === "hr")!.score,
      checklists.find((c) => c.id === "finance")!.score,
    ]),
    overall: 0,
  };
  scores.overall = avg([
    scores.procurement,
    scores.inventory,
    scores.recipes,
    scores.sales,
    scores.hr,
    scores.finance,
    scores.foodCost,
    scores.profitability,
  ]);

  const branchDetails =
    branchId === "all"
      ? db.branches
          .filter((b) => b.status === "active")
          .map((branch) => calculateBranchReadinessDetail(db, branch.id))
      : [calculateBranchReadinessDetail(db, branchId)];

  const branchRows: BranchReadinessRow[] = branchDetails.map((detail) => ({
    branchId: detail.branchId,
    name: detail.name,
    overall: detail.overall,
    gaps: detail.missing.slice(0, 3).map((g) => g.title),
    categories: detail.categories,
  }));

  const smartQuestions: SmartQuestion[] = [
    {
      id: "prep_in_house",
      question: "Do you manufacture sauces and gravies in-house?",
      options: [
        { value: "yes", label: "Yes — we prep sauces/gravies" },
        { value: "no", label: "No — we buy ready-made" },
      ],
      checklistId: "prep_recipes",
      shownWhenIncomplete: "prep_recipes",
    },
    {
      id: "branch_transfers",
      question: "Do branches transfer stock between each other?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      checklistId: "inventory",
      shownWhenIncomplete: "inv_opening",
    },
    {
      id: "vendor_credit_notes",
      question: "Do vendors issue credit notes for shortages?",
      options: [
        { value: "yes", label: "Yes, regularly" },
        { value: "sometimes", label: "Sometimes" },
        { value: "no", label: "Rarely" },
      ],
      checklistId: "vendor_recovery",
      shownWhenIncomplete: "vendor_recovery",
    },
    {
      id: "track_wastage",
      question: "Do you track wastage separately from consumption?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
      checklistId: "inventory",
      shownWhenIncomplete: "inv_opening",
    },
  ].filter((q) => {
    const checklist = checklists.find((c) => c.id === q.shownWhenIncomplete);
    return checklist ? checklist.score < 100 : true;
  });

  const overallLabel =
    scores.overall >= 90
      ? "Operations-ready"
      : scores.overall >= 70
        ? "Mostly ready — fill gaps below"
        : scores.overall >= 40
          ? "Setup in progress"
          : "Critical data missing";

  return {
    scores,
    checklists,
    missingHigh: missing.filter((m) => m.priority === "high"),
    missingMedium: missing.filter((m) => m.priority === "medium"),
    missingLow: missing.filter((m) => m.priority === "low"),
    branchRows,
    branchDetails,
    smartQuestions,
    overallLabel,
  };
}

/** Returns true when a metric can be shown with confidence. */
export function isMetricReady(
  report: BusinessReadinessReport,
  metric: keyof BusinessReadinessScores
): boolean {
  return report.scores[metric] >= 60;
}

export type WaitingForDataProps = {
  metric: string;
  requiredSteps: string[];
  href?: string;
  hrefLabel?: string;
};

export function getWaitingForData(
  report: BusinessReadinessReport,
  area: keyof BusinessReadinessScores
): WaitingForDataProps | null {
  if (isMetricReady(report, area)) return null;
  const related = report.checklists.filter((c) => {
    if (area === "foodCost") return ["ingredient_costing", "recipes"].includes(c.id);
    if (area === "profitability") return ["sales", "hr", "finance", "ingredient_costing"].includes(c.id);
    if (area === "inventory") return c.id === "opening_stock";
    if (area === "procurement") return c.id === "procurement";
    if (area === "hr") return c.id === "hr";
    if (area === "finance") return c.id === "finance";
    if (area === "sales") return c.id === "sales";
    if (area === "recipes") return ["recipes", "prep_recipes"].includes(c.id);
    return false;
  });
  const gaps = related.flatMap((c) => c.items.filter((i) => !i.complete));
  if (!gaps.length) return null;
  return {
    metric: area,
    requiredSteps: gaps.map((g) => g.askPrompt ?? g.message),
    href: gaps[0]?.actionHref,
    hrefLabel: gaps[0]?.actionLabel,
  };
}
