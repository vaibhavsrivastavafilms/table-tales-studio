"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { formatInr, StatCard } from "@/components/os/procurement/ProcurementUi";
import { computeOutletFoodCost } from "@/lib/os/reports/food-cost";
import { buildLaborCostReport } from "@/lib/os/reports/labor-cost";
import { computeMonthlyMis, currentMonthKey } from "@/lib/os/reports/monthly-mis";
import { computeSalesSummary } from "@/lib/os/sales/sales-engine";

export default function OsDashboardView() {
  const { stats, db } = useProcurement();
  const today = new Date().toISOString().slice(0, 10);
  const month = currentMonthKey();
  const sales = computeSalesSummary(db, today);
  const foodCost = computeOutletFoodCost(db);
  const labor = useMemo(() => buildLaborCostReport(db, month), [db, month]);
  const mis = useMemo(() => computeMonthlyMis(db, month), [db, month]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--os-accent)]">
          Welcome back
        </p>
        <h2 className="os-brand mt-1 text-4xl leading-none text-[var(--os-fg)]">
          Table Tales OS
        </h2>
        <p className="mt-2 text-sm font-medium text-[var(--os-fg-muted)]">
          Pure Foods Central Kitchen · Operations · Finance · Workforce
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's sales" value={formatInr(sales.totalRevenue)} />
        <StatCard label="Food cost %" value={`${foodCost.avgFoodCostPercent.toFixed(1)}%`} />
        <StatCard label="Labor cost %" value={`${labor.laborCostPercent.toFixed(1)}%`} />
        <StatCard
          label="Est. profit margin"
          value={`${mis.estimatedProfitMargin.toFixed(1)}%`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Inventory value" value={formatInr(mis.inventoryValue)} />
        <StatCard label="Vendor outstanding" value={formatInr(mis.vendorOutstanding)} />
        <StatCard label="Attendance rate" value={`${labor.attendanceRate.toFixed(1)}%`} />
        <StatCard label="Headcount" value={mis.headcount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Month purchases" value={formatInr(stats.monthPurchases)} />
        <StatCard label="Month payroll" value={formatInr(mis.payrollCost)} />
        <StatCard label="Pending GRNs" value={stats.pendingGrns} />
        <StatCard label="Low stock SKUs" value={stats.lowStockItems} />
      </div>

      <section className="os-card p-5">
        <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">Owner intelligence</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["/os/owner", "Owner Command Center"],
            ["/os/business-readiness", "Business Readiness"],
            ["/os/setup", "Setup Wizard"],
            ["/os/ai-copilot", "AI Copilot"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full border border-[var(--os-border)] px-3 py-1 text-xs font-medium hover:bg-white/50"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="os-card p-5">
        <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">Quick links</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["/os/hr/attendance", "Attendance"],
            ["/os/hr/payroll", "Payroll"],
            ["/os/reports/profitability", "Management MIS"],
            ["/os/procurement/upload-bill", "Upload Bill"],
            ["/os/reports/ai-insights", "AI Insights"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full border border-[var(--os-border)] px-3 py-1 text-xs font-medium hover:bg-white/50"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
