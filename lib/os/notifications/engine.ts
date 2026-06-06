import { filterByBranch } from "@/lib/os/branches";
import { listPendingApprovals } from "@/lib/os/approvals/engine";
import { computeAttendanceStats } from "@/lib/os/hr/attendance";
import { generatePnLSnapshot } from "@/lib/os/reports/pnl-snapshot";
import { computeMonthlyMis } from "@/lib/os/reports/monthly-mis";
import type {
  NotificationPreferences,
  NotificationType,
  OsNotification,
  ProcurementDb,
} from "@/lib/os/procurement/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateNotifications(
  db: ProcurementDb,
  prefs: NotificationPreferences,
  branchId = "all"
): OsNotification[] {
  const now = new Date().toISOString();
  const month = now.slice(0, 7);
  const items = db.inventoryItems;
  const lowStock = items.filter((i) => i.currentStock < i.parLevel);
  const notifications: OsNotification[] = [];

  if (prefs.lowStock && lowStock.length) {
    notifications.push({
      id: uid("ntf"),
      branchId: branchId === "all" ? null : branchId,
      type: "low_stock",
      title: "Low stock alert",
      detail: `${lowStock.length} SKUs below par level.`,
      severity: "warning",
      read: false,
      href: "/os/inventory",
      createdAt: now,
    });
  }

  const pendingCredits = filterByBranch(db.creditNotes, branchId).filter(
    (c) => c.status === "pending"
  );
  if (prefs.pendingCredit && pendingCredits.length) {
    notifications.push({
      id: uid("ntf"),
      branchId: branchId === "all" ? null : branchId,
      type: "pending_credit",
      title: "Pending credit notes",
      detail: `${pendingCredits.length} credit notes awaiting application.`,
      severity: "info",
      read: false,
      href: "/os/procurement/credit-notes",
      createdAt: now,
    });
  }

  const pendingApprovals = listPendingApprovals(db, branchId);
  if (prefs.pendingApproval && pendingApprovals.length) {
    notifications.push({
      id: uid("ntf"),
      branchId: branchId === "all" ? null : branchId,
      type: "approval_required",
      title: "Approvals required",
      detail: `${pendingApprovals.length} items awaiting review.`,
      severity: "warning",
      read: false,
      href: "/os/approvals",
      createdAt: now,
    });
  }

  if (prefs.purchasePending) {
    const purchases = pendingApprovals.filter((a) => a.type === "purchase");
    if (purchases.length) {
      notifications.push({
        id: uid("ntf"),
        branchId: branchId === "all" ? null : branchId,
        type: "purchase_pending",
        title: "Purchases pending approval",
        detail: `${purchases.length} purchase approvals waiting.`,
        severity: "warning",
        read: false,
        href: "/os/approvals",
        createdAt: now,
      });
    }
  }

  if (prefs.expensePending) {
    const expenses = pendingApprovals.filter((a) => a.type === "expense");
    if (expenses.length) {
      notifications.push({
        id: uid("ntf"),
        branchId: branchId === "all" ? null : branchId,
        type: "expense_pending",
        title: "Expenses pending approval",
        detail: `${expenses.length} expense approvals waiting.`,
        severity: "warning",
        read: false,
        href: "/os/approvals",
        createdAt: now,
      });
    }
  }

  const mis = computeMonthlyMis(db, month, branchId);
  if (prefs.foodCostAlert && mis.foodCostPercent > 35) {
    notifications.push({
      id: uid("ntf"),
      branchId: branchId === "all" ? null : branchId,
      type: "food_cost_alert",
      title: "Food cost alert",
      detail: `Food cost at ${mis.foodCostPercent.toFixed(1)}% for ${month}.`,
      severity: "critical",
      read: false,
      href: "/os/reports/food-cost",
      createdAt: now,
    });
  }

  if (prefs.laborCostAlert && mis.laborCostPercent > 30) {
    notifications.push({
      id: uid("ntf"),
      branchId: branchId === "all" ? null : branchId,
      type: "labor_cost_alert",
      title: "Labor cost alert",
      detail: `Labor cost at ${mis.laborCostPercent.toFixed(1)}% for ${month}.`,
      severity: "warning",
      read: false,
      href: "/os/reports/labor-cost",
      createdAt: now,
    });
  }

  const dailyPnl = generatePnLSnapshot(db, branchId, "daily", now.slice(0, 10));
  if (dailyPnl.netMargin < 8 && dailyPnl.revenuePaise > 0) {
    notifications.push({
      id: uid("ntf"),
      branchId: branchId === "all" ? null : branchId,
      type: "pnl_alert",
      title: "Net margin alert",
      detail: `Today's net margin ${dailyPnl.netMargin.toFixed(1)}% is below 8%.`,
      severity: "critical",
      read: false,
      href: "/os/reports/pnl",
      createdAt: now,
    });
  }

  const attendance = computeAttendanceStats(db, month);
  if (prefs.attendanceIssue && attendance.attendanceRate < 85 && attendance.workingDays > 0) {
    notifications.push({
      id: uid("ntf"),
      branchId: branchId === "all" ? null : branchId,
      type: "attendance_issue",
      title: "Attendance below target",
      detail: `Attendance rate ${attendance.attendanceRate.toFixed(1)}% this month.`,
      severity: "warning",
      read: false,
      href: "/os/hr/attendance",
      createdAt: now,
    });
  }

  return notifications;
}

export function mergeNotifications(
  existing: OsNotification[],
  generated: OsNotification[]
): OsNotification[] {
  const unread = existing.filter((n) => !n.read);
  return [...generated, ...unread].slice(0, 50);
}

export function unreadCount(notifications: OsNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export function defaultNotificationPreferences(): NotificationPreferences {
  return {
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
}

export type { NotificationType };
