"use client";

import Link from "next/link";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { defaultNotificationPreferences } from "@/lib/os/notifications/engine";

export default function NotificationsPreferencesView() {
  const { db, updateAlertPreferences } = useProcurement();
  const prefs = db.notificationPreferences ?? defaultNotificationPreferences();

  const fields: { key: keyof typeof prefs; label: string }[] = [
    { key: "lowStock", label: "Low stock alerts" },
    { key: "foodCostAlert", label: "Food cost alerts" },
    { key: "pendingApproval", label: "Pending approvals" },
    { key: "vendorPaymentDue", label: "Vendor payment due" },
    { key: "attendanceIssue", label: "Attendance issues" },
    { key: "payrollDue", label: "Payroll due" },
    { key: "dailyMis", label: "Daily MIS" },
    { key: "expensePending", label: "Expense pending approval" },
    { key: "purchasePending", label: "Purchase pending approval" },
    { key: "pendingCredit", label: "Pending credit notes" },
    { key: "highVariance", label: "High variance" },
    { key: "laborCostAlert", label: "Labor cost alerts" },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Preferences"
        description="Choose which alerts you receive."
      />
      <div className="os-card space-y-3 p-5">
        {fields.map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between gap-3 text-sm">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={(e) => updateAlertPreferences({ [key]: e.target.checked })}
            />
          </label>
        ))}
      </div>
      <Link href="/os/notifications" className="text-sm text-[var(--os-accent)]">
        ← Back to notifications
      </Link>
    </div>
  );
}
