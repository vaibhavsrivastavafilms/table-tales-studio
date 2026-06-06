import type {
  CreditRegisterInsight,
  ProcurementDb,
  RecoveryDashboardStats,
} from "@/lib/os/procurement/types";

export function computeRecoveryDashboardStats(
  db: ProcurementDb
): RecoveryDashboardStats {
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthKey = monthStart.toISOString().slice(0, 7);

  const recoveries = db.creditRecoveries;
  const totalRecoverable = recoveries.reduce((s, r) => s + r.expectedCredit, 0);
  const recoveredAmount = recoveries.reduce((s, r) => s + r.receivedCredit, 0);
  const pendingRecovery = recoveries.reduce((s, r) => s + r.balance, 0);

  const recoveredThisMonth = db.recoveryActivities
    .filter((a) => a.createdAt.slice(0, 7) === monthKey)
    .reduce((s, a) => s + a.amount, 0);

  const disputesOpen = db.vendorDisputes.filter(
    (d) =>
      d.status === "open" ||
      d.status === "partial" ||
      d.status === "credit_requested"
  ).length;
  const disputesClosed = db.vendorDisputes.filter(
    (d) => d.status === "closed" || d.status === "resolved"
  ).length;

  const byVendor = new Map<string, number>();
  for (const r of recoveries) {
    byVendor.set(
      r.vendorName,
      (byVendor.get(r.vendorName) ?? 0) + r.receivedCredit
    );
  }
  const topVendorCredits = [...byVendor.entries()]
    .map(([vendorName, amount]) => ({ vendorName, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const byItem = new Map<string, number>();
  for (const d of db.vendorDisputes) {
    byItem.set(d.itemName, (byItem.get(d.itemName) ?? 0) + 1);
  }
  const topDisputedItems = [...byItem.entries()]
    .map(([itemName, count]) => ({ itemName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalRecoverable,
    recoveredAmount,
    pendingRecovery,
    recoveredThisMonth,
    disputesOpen,
    disputesClosed,
    topVendorCredits,
    topDisputedItems,
  };
}

export function generateRecoveryInsights(
  db: ProcurementDb
): CreditRegisterInsight[] {
  const insights: CreditRegisterInsight[] = [];
  const stats = computeRecoveryDashboardStats(db);

  const topVendor = stats.topVendorCredits[0];
  if (topVendor) {
    insights.push({
      id: "top-vendor-credit",
      title: "Vendor with highest dispute value recovered",
      detail: `${topVendor.vendorName} — ₹${Math.round(topVendor.amount).toLocaleString("en-IN")}`,
      severity: "info",
    });
  }

  const pendingByVendor = new Map<string, number>();
  for (const d of db.vendorDisputes.filter((x) => x.pendingCredit > 0)) {
    pendingByVendor.set(
      d.vendorName,
      (pendingByVendor.get(d.vendorName) ?? 0) + d.pendingCredit
    );
  }
  const longestPending = [...pendingByVendor.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0];
  if (longestPending) {
    insights.push({
      id: "longest-pending",
      title: "Vendor with longest pending credits",
      detail: `${longestPending[0]} — ₹${Math.round(longestPending[1]).toLocaleString("en-IN")} outstanding`,
      severity: "warning",
    });
  }

  const topItem = stats.topDisputedItems[0];
  if (topItem) {
    insights.push({
      id: "most-disputed",
      title: "Most disputed item",
      detail: `${topItem.itemName} — ${topItem.count} dispute(s)`,
      severity: "warning",
    });
  }

  const resolved = db.vendorDisputes.filter((d) => d.closedAt);
  if (resolved.length) {
    const avgDays =
      resolved.reduce((s, d) => {
        const days =
          (new Date(d.closedAt!).getTime() - new Date(d.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return s + days;
      }, 0) / resolved.length;
    insights.push({
      id: "avg-recovery",
      title: "Average credit recovery days",
      detail: `${Math.round(avgDays * 10) / 10} days across closed disputes`,
      severity: "info",
    });
  }

  insights.push({
    id: "recoverable",
    title: "Expected recoverable amount",
    detail: `₹${Math.round(stats.pendingRecovery).toLocaleString("en-IN")} pending recovery`,
    severity: stats.pendingRecovery > 10000 ? "critical" : "info",
  });

  insights.push({
    id: "month-recovered",
    title: "Recovered this month",
    detail: `₹${Math.round(stats.recoveredThisMonth).toLocaleString("en-IN")}`,
    severity: "info",
  });

  if (stats.pendingRecovery > stats.recoveredAmount * 0.5) {
    insights.push({
      id: "risk",
      title: "Outstanding recovery risk",
      detail: "Pending recovery exceeds 50% of amount recovered to date",
      severity: "critical",
    });
  }

  const byBranch = new Map<string, number>();
  for (const d of db.vendorDisputes) {
    byBranch.set(d.branch, (byBranch.get(d.branch) ?? 0) + d.pendingCredit);
  }
  const topBranch = [...byBranch.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topBranch && topBranch[1] > 0) {
    insights.push({
      id: "branch",
      title: "Branch-wise dispute analysis",
      detail: `${topBranch[0]} — ₹${Math.round(topBranch[1]).toLocaleString("en-IN")} pending`,
      severity: "info",
    });
  }

  return insights;
}
