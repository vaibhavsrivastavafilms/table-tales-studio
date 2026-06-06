"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import BranchFilterBar from "@/components/os/BranchFilterBar";
import { formatInr, PageHeader, StatCard } from "@/components/os/procurement/ProcurementUi";
import { buildOwnerCommandCenter } from "@/lib/os/automation/daily-mis";
import { listPendingApprovals } from "@/lib/os/approvals/engine";

export default function OwnerCommandCenterView() {
  const { db, activeBranchId, refreshAlerts } = useProcurement();
  const center = useMemo(() => buildOwnerCommandCenter(db, activeBranchId), [db, activeBranchId]);
  const pendingApprovals = listPendingApprovals(db, activeBranchId).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Owner" title="Command Center" description="Primary owner dashboard across sales, procurement, inventory, workforce, and finance." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BranchFilterBar />
        <button type="button" onClick={refreshAlerts} className="rounded-md bg-[var(--os-accent)] px-3 py-2 text-xs font-medium text-white">Refresh alerts</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's sales" value={formatInr(center.todaySales)} />
        <StatCard label="Today's purchases" value={formatInr(center.todayPurchases)} />
        <StatCard label="Food cost %" value={`${center.foodCostPercent.toFixed(1)}%`} />
        <StatCard label="Labor cost %" value={`${center.laborCostPercent.toFixed(1)}%`} />
        <StatCard label="Operating expenses" value={formatInr(center.operatingExpenses)} />
        <StatCard label="Inventory value" value={formatInr(center.inventoryValue)} />
        <StatCard label="Vendor outstanding" value={formatInr(center.vendorOutstanding)} />
        <StatCard label="Pending credit notes" value={center.pendingCreditNotes} />
        <StatCard label="Pending approvals" value={pendingApprovals} />
        <StatCard label="Attendance %" value={`${center.attendanceRate.toFixed(1)}%`} />
        <StatCard label="Est. profit" value={formatInr(center.estimatedProfit)} />
        <StatCard label="Net margin" value={`${center.netProfitMargin.toFixed(1)}%`} />
      </div>
      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Branch performance</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {center.branchPerformance.map((b) => (
            <div key={b.branchId} className="rounded-lg border border-[var(--os-border)] p-3 text-sm">
              <p className="font-medium">{b.name}</p>
              <p className="text-[var(--os-fg-muted-on-card)]">Revenue {formatInr(b.revenue)} · Margin {b.estimatedProfitMargin.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link href="/os/approvals" className="rounded-full border px-3 py-1 text-xs">Approvals</Link>
        <Link href="/os/reports/monthly-mis" className="rounded-full border px-3 py-1 text-xs">Monthly MIS</Link>
        <Link href="/os/notifications" className="rounded-full border px-3 py-1 text-xs">Notifications</Link>
      </div>
    </div>
  );
}
