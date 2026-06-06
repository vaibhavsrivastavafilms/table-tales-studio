import type { ExecutiveKpi } from "@/lib/os/owner/executive-dashboard";

export type KpiRoute = {
  href: string;
  summary: string;
};

export const KPI_ROUTES: Record<string, KpiRoute> = {
  today_sales: {
    href: "/os/operations/sales",
    summary: "Daily revenue and order mix across channels",
  },
  month_sales: {
    href: "/os/reports/profitability",
    summary: "Month-to-date sales performance and MIS",
  },
  net_profit: {
    href: "/os/reports/pnl",
    summary: "Estimated net profit and margin breakdown",
  },
  food_cost: {
    href: "/os/reports/food-cost",
    summary: "Food cost percentage and recipe-level analysis",
  },
  labor_cost: {
    href: "/os/reports/labor-cost",
    summary: "Payroll and labor cost as % of revenue",
  },
  inventory: {
    href: "/os/inventory",
    summary: "Stock value, par levels, and movement history",
  },
  vendor_outstanding: {
    href: "/os/procurement/vendor-ledger",
    summary: "Amount owed to vendors and payment aging",
  },
  cash: {
    href: "/os/reports/pnl",
    summary: "Cash position after payables and expenses",
  },
  attendance: {
    href: "/os/hr/attendance",
    summary: "Workforce attendance and late arrivals",
  },
  wastage: {
    href: "/os/inventory/stock-audit",
    summary: "Inventory leakage, variance, and wastage movements",
  },
  payroll: {
    href: "/os/hr/payroll",
    summary: "Payroll runs and labor cost totals",
  },
  purchases: {
    href: "/os/procurement/analytics",
    summary: "Purchase spend and vendor analytics",
  },
  readiness: {
    href: "/os/business-readiness",
    summary: "Data completeness across all modules",
  },
};

export function kpiRoute(kpi: ExecutiveKpi): KpiRoute | null {
  return KPI_ROUTES[kpi.id] ?? null;
}

export function ownerMetricRoute(label: string): KpiRoute | null {
  const key = label.toLowerCase();
  if (key.includes("sales")) return KPI_ROUTES.today_sales;
  if (key.includes("food cost")) return KPI_ROUTES.food_cost;
  if (key.includes("labor")) return KPI_ROUTES.labor_cost;
  if (key.includes("inventory")) return KPI_ROUTES.inventory;
  if (key.includes("vendor")) return KPI_ROUTES.vendor_outstanding;
  if (key.includes("attendance")) return KPI_ROUTES.attendance;
  if (key.includes("wastage") || key.includes("variance")) return KPI_ROUTES.wastage;
  if (key.includes("profit") || key.includes("margin")) return KPI_ROUTES.net_profit;
  if (key.includes("payroll")) return KPI_ROUTES.payroll;
  if (key.includes("purchase")) return KPI_ROUTES.purchases;
  return null;
}
