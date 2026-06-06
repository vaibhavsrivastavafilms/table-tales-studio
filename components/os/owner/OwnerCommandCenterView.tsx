"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import BranchFilterBar from "@/components/os/BranchFilterBar";
import { ClickableStatCard } from "@/components/os/shared/ClickableKpiCard";
import { formatInr, PageHeader } from "@/components/os/procurement/ProcurementUi";
import { buildOwnerCommandCenter } from "@/lib/os/automation/daily-mis";
import { listPendingApprovals } from "@/lib/os/approvals/engine";
import { ownerMetricRoute } from "@/lib/os/owner/kpi-routes";

export default function OwnerCommandCenterView() {
  const { db, activeBranchId, refreshAlerts } = useProcurement();
  const center = useMemo(() => buildOwnerCommandCenter(db, activeBranchId), [db, activeBranchId]);
  const pendingApprovals = listPendingApprovals(db, activeBranchId).length;

  const kpis = [
    ["Today's sales", formatInr(center.todaySales), ownerMetricRoute("Today's sales")],
    ["Today's purchases", formatInr(center.todayPurchases), ownerMetricRoute("Month purchases")],
    ["Food cost %", `${center.foodCostPercent.toFixed(1)}%`, ownerMetricRoute("Food cost %")],
    ["Labor cost %", `${center.laborCostPercent.toFixed(1)}%`, ownerMetricRoute("Labor cost %")],
    ["Inventory value", formatInr(center.inventoryValue), ownerMetricRoute("Inventory value")],
    ["Vendor outstanding", formatInr(center.vendorOutstanding), ownerMetricRoute("Vendor outstanding")],
    ["Attendance %", `${center.attendanceRate.toFixed(1)}%`, ownerMetricRoute("Attendance rate")],
    ["Est. profit", formatInr(center.estimatedProfit), ownerMetricRoute("Est. profit margin")],
    ["Net margin", `${center.netProfitMargin.toFixed(1)}%`, ownerMetricRoute("Est. profit margin")],
    ["Pending approvals", pendingApprovals, { href: "/os/approvals", summary: "Review pending approvals" }],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Owner"
        title="Command Center"
        description="Primary owner dashboard — every KPI drills into its report."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BranchFilterBar />
        <button
          type="button"
          onClick={refreshAlerts}
          className="rounded-md bg-[var(--os-accent)] px-3 py-2 text-xs font-medium text-white"
        >
          Refresh alerts
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, route]) =>
          route ? (
            <ClickableStatCard
              key={label}
              label={label}
              value={value}
              href={route.href}
              summary={route.summary}
            />
          ) : null
        )}
      </div>
      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Branch performance</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {center.branchPerformance.map((b) => (
            <Link
              key={b.branchId}
              href="/os/owner"
              className="rounded-lg border border-[var(--os-border)] p-3 text-sm transition hover:border-[#C9A84C]"
            >
              <p className="font-medium">{b.name}</p>
              <p className="text-[var(--os-fg-muted-on-card)]">
                Revenue {formatInr(b.revenue)} · Margin {b.estimatedProfitMargin.toFixed(1)}%
              </p>
            </Link>
          ))}
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link href="/os/business-readiness" className="rounded-full border px-3 py-1 text-xs">
          Business Readiness
        </Link>
        <Link href="/os/ai-copilot" className="rounded-full border px-3 py-1 text-xs">
          AI Copilot
        </Link>
        <Link href="/os/setup" className="rounded-full border px-3 py-1 text-xs">
          Setup Wizard
        </Link>
      </div>
    </div>
  );
}
