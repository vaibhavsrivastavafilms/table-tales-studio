import type { Branch, ProcurementDb } from "@/lib/os/procurement/types";
import { ALL_BRANCHES_ID, OUTLET_TO_BRANCH } from "@/lib/os/branches/constants";

export { ALL_BRANCHES_ID, ACTIVE_BRANCH_KEY, BRANCH_IDS, OUTLET_TO_BRANCH } from "@/lib/os/branches/constants";

export function resolveBranchId(
  outletOrBranch?: string | null,
  fallback = "br_prahladnagar"
): string {
  if (!outletOrBranch) return fallback;
  if (outletOrBranch.startsWith("br_")) return outletOrBranch;
  return OUTLET_TO_BRANCH[outletOrBranch] ?? fallback;
}

export function coalesceBranchId(
  outletOrBranch?: string | null,
  explicit?: string | null
): string {
  if (explicit) return explicit;
  return resolveBranchId(outletOrBranch);
}

export function getBranch(db: ProcurementDb, branchId: string): Branch | undefined {
  return db.branches.find((b) => b.id === branchId);
}

export function getBranchName(db: ProcurementDb, branchId: string): string {
  return getBranch(db, branchId)?.name ?? branchId;
}

export function filterByBranch<T extends { branchId?: string | null }>(
  items: T[],
  activeBranchId: string
): T[] {
  if (activeBranchId === ALL_BRANCHES_ID) return items;
  return items.filter(
    (item) => !item.branchId || item.branchId === activeBranchId
  );
}

export function getActiveBranchId(): string {
  if (typeof window === "undefined") return ALL_BRANCHES_ID;
  return localStorage.getItem("tts:os:active_branch") ?? ALL_BRANCHES_ID;
}

export function setActiveBranchId(branchId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("tts:os:active_branch", branchId);
}

export function computeBranchAnalytics(db: ProcurementDb, branchId: string) {
  const bills = filterByBranch(db.purchaseBills, branchId).filter(
    (b) => b.status === "posted"
  );
  const sales = filterByBranch(db.sales, branchId);
  const month = new Date().toISOString().slice(0, 7);
  const monthPurchases = bills
    .filter((b) => b.invoiceDate.startsWith(month))
    .reduce((s, b) => s + b.totalValue, 0);
  const monthRevenue = sales
    .filter((s) => s.consumedAt.startsWith(month))
    .reduce((s, r) => s + r.totalRevenue, 0);

  return {
    branchId,
    monthPurchases,
    monthRevenue,
    pendingOmissions: filterByBranch(db.omissionCases, branchId).filter(
      (o) => o.status === "pending"
    ).length,
    pendingGrns: filterByBranch(db.grns, branchId).filter(
      (g) => g.status === "pending" || g.receiptStatus === "pending"
    ).length,
    headcount: filterByBranch(db.employees, branchId).filter(
      (e) => e.status === "active"
    ).length,
  };
}

export function createDefaultBranches(now: string): Branch[] {
  return [
    {
      id: "br_prahladnagar",
      name: "Table Tales Prahladnagar",
      code: "TT-PRA",
      address: "Prahladnagar, Ahmedabad",
      managerName: "Rajesh Mehta",
      managerPhone: "+91 98765 11111",
      settings: {
        timezone: "Asia/Kolkata",
        currency: "INR",
        targetFoodCostPercent: 32,
        targetLaborCostPercent: 22,
      },
      status: "active",
      createdAt: now,
    },
    {
      id: "br_sbr",
      name: "Table Tales SBR",
      code: "TT-SBR",
      address: "Satellite Road, Ahmedabad",
      managerName: "Neha Shah",
      managerPhone: "+91 98765 22222",
      settings: {
        timezone: "Asia/Kolkata",
        currency: "INR",
        targetFoodCostPercent: 33,
        targetLaborCostPercent: 23,
      },
      status: "active",
      createdAt: now,
    },
    {
      id: "br_nikol",
      name: "Table Tales Nikol",
      code: "TT-NIK",
      address: "Nikol, Ahmedabad",
      managerName: "Vikram Patel",
      managerPhone: "+91 98765 33333",
      settings: {
        timezone: "Asia/Kolkata",
        currency: "INR",
        targetFoodCostPercent: 34,
        targetLaborCostPercent: 24,
      },
      status: "active",
      createdAt: now,
    },
    {
      id: "br_central_kitchen",
      name: "Pure Foods Central Kitchen",
      code: "PF-CK",
      address: "Central Kitchen, Ahmedabad",
      managerName: "Suresh Kulkarni",
      managerPhone: "+91 98765 44444",
      settings: {
        timezone: "Asia/Kolkata",
        currency: "INR",
        targetFoodCostPercent: 28,
        targetLaborCostPercent: 18,
      },
      status: "active",
      createdAt: now,
    },
  ];
}
