import { filterByBranch } from "@/lib/os/branches";
import { countPendingApprovals, listPendingApprovals } from "@/lib/os/approvals/engine";
import { computeAttendanceStats, getAttendanceForDate } from "@/lib/os/hr/attendance";
import { buildStockAudit } from "@/lib/os/procurement/analytics";
import { getVendorOutstanding } from "@/lib/os/procurement/local-db";
import { computeRecoveryDashboardStats } from "@/lib/os/procurement/recovery";
import { generatePnLSnapshot } from "@/lib/os/reports/pnl-snapshot";
import { computeMonthlyMis } from "@/lib/os/reports/monthly-mis";
import { formatPaise, formatPercent, paiseToRupees, rupeesToPaise } from "@/lib/os/money";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export type OwnerDashboardData = {
  date: string;
  pulse: {
    todaySalesPaise: number;
    todayPurchasesPaise: number;
    attendanceRate: number;
    pendingApprovals: number;
    foodCostPct: number;
    estNetProfitPaise: number;
  };
  branchRows: {
    branchId: string;
    name: string;
    shortName: string;
    salesPaise: number;
    foodCostPct: number;
    laborCostPct: number;
    expensesPaise: number;
    estProfitPaise: number;
    status: "healthy" | "watch" | "critical";
  }[];
  totals: {
    salesPaise: number;
    foodCostPct: number;
    laborCostPct: number;
    expensesPaise: number;
    estProfitPaise: number;
  };
  alerts: { id: string; label: string; href?: string }[];
  leakage: {
    stockVariancePaise: number;
    vendorShortPaise: number;
    wastagePaise: number;
    overPortioningPaise: number;
    totalPaise: number;
  };
  topVendors: {
    vendorId: string;
    name: string;
    outstandingPaise: number;
    daysOutstanding: number;
    overdue: boolean;
  }[];
  aiBullets: string[];
};

function branchShort(name: string): string {
  if (name.includes("Prahladnagar")) return "Prahladnagar";
  if (name.includes("SBR")) return "SBR";
  if (name.includes("Nikol")) return "Nikol";
  if (name.includes("Central") || name.includes("Pure Foods")) return "Pure Foods";
  return name;
}

function branchStatus(margin: number): "healthy" | "watch" | "critical" {
  if (margin > 15) return "healthy";
  if (margin >= 8) return "watch";
  return "critical";
}

/** Single server-side aggregation for owner dashboard. */
export function generateOwnerDashboard(
  db: ProcurementDb,
  date: string = new Date().toISOString().slice(0, 10),
  branchId = "all"
): OwnerDashboardData {
  const month = date.slice(0, 7);
  const mis = computeMonthlyMis(db, month, branchId);
  const dailyPnl = generatePnLSnapshot(db, branchId, "daily", date);

  const todaySalesPaise = rupeesToPaise(
    filterByBranch(db.sales, branchId)
      .filter((s) => s.consumedAt.slice(0, 10) === date)
      .reduce((s, r) => s + r.totalRevenue, 0)
  );

  const todayPurchasesPaise = rupeesToPaise(
    filterByBranch(db.purchaseBills, branchId)
      .filter((b) => b.status === "posted" && b.invoiceDate === date)
      .reduce((s, b) => s + b.totalValue, 0)
  );

  const attendance = computeAttendanceStats(db, month);
  const pendingApprovals = countPendingApprovals(db, branchId);

  const branchRows = db.branches
    .filter((b) => b.status === "active")
    .map((b) => {
      const bm = computeMonthlyMis(db, month, b.id);
      return {
        branchId: b.id,
        name: b.name,
        shortName: branchShort(b.name),
        salesPaise: rupeesToPaise(bm.revenue),
        foodCostPct: bm.foodCostPercent,
        laborCostPct: bm.laborCostPercent,
        expensesPaise: rupeesToPaise(bm.operatingExpenses),
        estProfitPaise: rupeesToPaise(bm.estimatedProfit),
        status: branchStatus(bm.estimatedProfitMargin),
      };
    });

  const totals = branchRows.reduce(
    (acc, r) => ({
      salesPaise: acc.salesPaise + r.salesPaise,
      foodCostPct: 0,
      laborCostPct: 0,
      expensesPaise: acc.expensesPaise + r.expensesPaise,
      estProfitPaise: acc.estProfitPaise + r.estProfitPaise,
    }),
    { salesPaise: 0, foodCostPct: 0, laborCostPct: 0, expensesPaise: 0, estProfitPaise: 0 }
  );
  totals.foodCostPct = mis.foodCostPercent;
  totals.laborCostPct = mis.laborCostPercent;

  const lowStock = db.inventoryItems.filter((i) => i.currentStock < i.parLevel);
  const recovery = computeRecoveryDashboardStats(db);
  const alerts: OwnerDashboardData["alerts"] = [];

  if (mis.foodCostPercent > 34) {
    alerts.push({
      id: "food_cost",
      label: `Food cost at ${formatPercent(mis.foodCostPercent)}`,
      href: "/os/reports/food-cost",
    });
  }
  if (lowStock.length) {
    alerts.push({
      id: "low_stock",
      label: `${lowStock.length} SKUs below par`,
      href: "/os/inventory",
    });
  }
  if (pendingApprovals) {
    alerts.push({
      id: "approvals",
      label: `${pendingApprovals} pending approvals`,
      href: "/os/approvals",
    });
  }

  const audit = buildStockAudit(db, date);
  const stockVariancePaise = rupeesToPaise(
    audit.reduce((s, r) => s + Math.abs(r.variance ?? 0) * 100, 0)
  );
  const vendorShortPaise = rupeesToPaise(recovery.pendingRecovery);
  const wastagePaise = rupeesToPaise(
    db.inventoryMovements
      .filter((m) => m.type === "adjustment" && m.quantity < 0)
      .reduce((s, m) => s + Math.abs(m.quantity) * 50, 0)
  );
  const overPortioningPaise = rupeesToPaise(
    mis.foodCostPercent > 35 ? mis.revenue * 0.02 : 0
  );

  const topVendors = db.vendors
    .map((v) => {
      const outstanding = getVendorOutstanding(db, v.id);
      const lastDebit = db.vendorLedger
        .filter((e) => e.vendorId === v.id && e.debit > 0)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      const daysOutstanding = lastDebit
        ? Math.floor(
            (Date.now() - new Date(lastDebit.createdAt).getTime()) / 86400000
          )
        : 0;
      return {
        vendorId: v.id,
        name: v.name,
        outstandingPaise: rupeesToPaise(outstanding),
        daysOutstanding,
        overdue: daysOutstanding > 30,
      };
    })
    .filter((v) => v.outstandingPaise > 0)
    .sort((a, b) => b.outstandingPaise - a.outstandingPaise)
    .slice(0, 5);

  const bestBranch = [...branchRows].sort(
    (a, b) => b.estProfitPaise - a.estProfitPaise
  )[0];

  const aiBullets = [
    `Today's sales ${formatPaise(todaySalesPaise)} · est. net profit ${formatPaise(dailyPnl.netProfitPaise)}.`,
    bestBranch
      ? `${bestBranch.shortName} leads branch profit at ${formatPaise(bestBranch.estProfitPaise)}.`
      : "Branch performance data loading.",
    recovery.pendingRecovery > 0
      ? `₹${Math.round(recovery.pendingRecovery).toLocaleString("en-IN")} pending vendor recovery.`
      : "No outstanding vendor recovery cases.",
    pendingApprovals
      ? `${pendingApprovals} items awaiting your approval.`
      : "Approval queue is clear.",
    `Food cost ${formatPercent(mis.foodCostPercent)} · labor ${formatPercent(mis.laborCostPercent)}.`,
  ];

  return {
    date,
    pulse: {
      todaySalesPaise,
      todayPurchasesPaise,
      attendanceRate: attendance.attendanceRate,
      pendingApprovals,
      foodCostPct: mis.foodCostPercent,
      estNetProfitPaise: dailyPnl.netProfitPaise,
    },
    branchRows,
    totals,
    alerts,
    leakage: {
      stockVariancePaise,
      vendorShortPaise,
      wastagePaise,
      overPortioningPaise,
      totalPaise:
        stockVariancePaise + vendorShortPaise + wastagePaise + overPortioningPaise,
    },
    topVendors,
    aiBullets,
  };
}

export { formatPaise, formatPercent };
