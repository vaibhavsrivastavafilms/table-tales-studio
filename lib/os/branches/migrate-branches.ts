import { createDefaultBranches, resolveBranchId } from "@/lib/os/branches";
import type {
  NotificationPreferences,
  ProcurementDb,
} from "@/lib/os/procurement/types";

const DEFAULT_PREFS: NotificationPreferences = {
  lowStock: true,
  pendingCredit: true,
  vendorPaymentDue: true,
  highVariance: true,
  attendanceIssue: true,
  payrollDue: true,
  expensePending: true,
  purchasePending: true,
  foodCostAlert: true,
  laborCostAlert: true,
  pendingApproval: true,
  dailyMis: true,
};

export function defaultNotificationPreferences(): NotificationPreferences {
  return { ...DEFAULT_PREFS };
}

export function applyBranchMigration(db: ProcurementDb): ProcurementDb {
  const now = new Date().toISOString();
  const branches = db.branches?.length ? db.branches : createDefaultBranches(now);
  const defaultBranch = branches[0]?.id ?? "br_prahladnagar";

  const withBranch = <T extends { branchId?: string; outlet?: string; branch?: string }>(
    item: T,
    outletField?: string
  ): T & { branchId: string } => ({
    ...item,
    branchId:
      item.branchId ??
      resolveBranchId(
        outletField ?? item.outlet ?? item.branch ?? defaultBranch,
        defaultBranch
      ),
  });

  return {
    ...db,
    branches,
    purchaseBills: db.purchaseBills.map((b) => withBranch(b)),
    inventoryMovements: db.inventoryMovements.map((m) => {
      const bill = db.purchaseBills.find((b) => b.id === m.billId);
      return withBranch(m, bill?.branchId);
    }),
    omissionCases: db.omissionCases.map((o) => {
      const bill = db.purchaseBills.find((b) => b.id === o.billId);
      return withBranch(o, bill?.branchId);
    }),
    creditNotes: db.creditNotes.map((c) => withBranch(c)),
    vendorLedger: db.vendorLedger.map((l) => withBranch(l)),
    grns: db.grns.map((g) => {
      const bill = db.purchaseBills.find((b) => b.id === g.billId);
      return withBranch(g, bill?.branchId);
    }),
    vendorDisputes: db.vendorDisputes.map((d) => {
      const bill = db.purchaseBills.find((b) => b.id === d.billId);
      return withBranch(d, bill?.branchId);
    }),
    recipes: db.recipes.map((r) => {
      if (r.branchId === null) return r;
      return withBranch({ ...r, branchId: r.branchId ?? undefined }, r.outlet);
    }),
    productionBatches: db.productionBatches.map((b) => withBranch(b)),
    sales: db.sales.map((s) => withBranch(s, s.outlet)),
    employees: db.employees.map((e) => withBranch(e, e.outlet)),
    attendanceRecords: db.attendanceRecords.map((a) => {
      const emp = db.employees.find((e) => e.id === a.employeeId);
      return withBranch(a, emp?.branchId);
    }),
    payrollRuns: db.payrollRuns.map((p) => withBranch(p, p.outlet)),
    operatingExpenses: db.operatingExpenses.map((e) => withBranch(e, e.outlet)),
    approvalRequests: db.approvalRequests ?? [],
    notifications: db.notifications ?? [],
    notificationPreferences:
      db.notificationPreferences ?? defaultNotificationPreferences(),
    vaultDocuments: db.vaultDocuments ?? [],
    dailyMisReports: db.dailyMisReports ?? [],
  };
}
