"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader, StatusBadge } from "@/components/os/procurement/ProcurementUi";
import {
  generateOwnerDashboard,
  formatPaise,
  formatPercent,
} from "@/lib/os/owner/dashboard";
import { cn } from "@/lib/utils";

const STATUS_LABEL = {
  healthy: "On track",
  watch: "Watch",
  critical: "Critical",
} as const;

export default function OwnerDashboardView() {
  const { db } = useProcurement();
  const [aiBullets, setAiBullets] = useState<string[]>([]);

  const data = useMemo(() => generateOwnerDashboard(db), [db]);

  useEffect(() => {
    fetch("/api/os/reports/ai-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ db, enhance: false }),
    })
      .then((r) => r.json())
      .then((payload: { insights?: { detail: string }[] }) => {
        setAiBullets(
          payload.insights?.slice(0, 5).map((i) => i.detail) ?? data.aiBullets
        );
      })
      .catch(() => setAiBullets(data.aiBullets));
  }, [db, data.aiBullets]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-12">
      <PageHeader
        eyebrow="Owner"
        title="Command Center"
        description={`${data.date} · Full business pulse across all branches`}
      />

      {/* Row 1 — Today's pulse */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--os-fg-muted)]">
          Today&apos;s pulse
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Today's Sales", formatPaise(data.pulse.todaySalesPaise)],
            ["Today's Purchases", formatPaise(data.pulse.todayPurchasesPaise)],
            ["Attendance %", formatPercent(data.pulse.attendanceRate)],
            ["Pending Approvals", String(data.pulse.pendingApprovals)],
            ["Food Cost %", formatPercent(data.pulse.foodCostPct)],
            ["Est. Net Profit", formatPaise(data.pulse.estNetProfitPaise)],
          ].map(([label, value]) => (
            <article key={label} className="os-exec-kpi">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--os-fg-muted-on-card)]">
                {label}
              </p>
              <p className="os-exec-kpi-value mt-2">{value}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Row 2 — Branch performance */}
      <section className="os-exec-panel overflow-x-auto">
        <h2 className="os-exec-section-title">Branch performance</h2>
        <table className="mt-4 w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[var(--os-border)] text-left text-[var(--os-fg-muted-on-card)]">
              <th className="py-2 pr-4">Branch</th>
              <th className="py-2 pr-4 text-right">Sales</th>
              <th className="py-2 pr-4 text-right">Food Cost %</th>
              <th className="py-2 pr-4 text-right">Labor Cost %</th>
              <th className="py-2 pr-4 text-right">Expenses</th>
              <th className="py-2 pr-4 text-right">Est. Profit</th>
              <th className="py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.branchRows.map((row) => (
              <tr key={row.branchId} className="border-b border-[var(--os-border)]/50">
                <td className="py-2 pr-4 font-medium">{row.shortName}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatPaise(row.salesPaise)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatPercent(row.foodCostPct)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatPercent(row.laborCostPct)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatPaise(row.expensesPaise)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatPaise(row.estProfitPaise)}</td>
                <td className="py-2 text-right">
                  <StatusBadge status={row.status === "healthy" ? "posted" : row.status === "watch" ? "pending" : "rejected"} />
                </td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2 pr-4">Total</td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatPaise(data.totals.salesPaise)}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatPercent(data.totals.foodCostPct)}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatPercent(data.totals.laborCostPct)}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatPaise(data.totals.expensesPaise)}</td>
              <td className="py-2 pr-4 text-right tabular-nums">{formatPaise(data.totals.estProfitPaise)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </section>

      {/* Row 3 — Alert strip */}
      <section className="flex gap-3 overflow-x-auto pb-1">
        {data.alerts.map((a) => (
          <Link
            key={a.id}
            href={a.href ?? "#"}
            className="shrink-0 rounded-full border border-[var(--os-border)] bg-white/60 px-4 py-2 text-sm font-medium"
          >
            {a.label}
          </Link>
        ))}
        {!data.alerts.length ? (
          <span className="text-sm text-[var(--os-fg-muted)]">No active alerts</span>
        ) : null}
      </section>

      {/* Row 4 — Leakage summary */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Stock variance", data.leakage.stockVariancePaise],
          ["Vendor short", data.leakage.vendorShortPaise],
          ["Wastage", data.leakage.wastagePaise],
          ["Over-portioning", data.leakage.overPortioningPaise],
          ["Total leakage", data.leakage.totalPaise],
        ].map(([label, paise]) => (
          <article key={label as string} className="os-exec-health-card os-exec-health-warning">
            <p className="text-[11px] uppercase tracking-wide text-[var(--os-fg-muted-on-card)]">
              {label}
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums">
              {formatPaise(paise as number)}
            </p>
          </article>
        ))}
      </section>

      {/* Row 5 — Vendor outstanding */}
      <section className="os-exec-panel">
        <h2 className="os-exec-section-title">Vendor outstanding</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {data.topVendors.map((v) => (
            <li key={v.vendorId} className="flex flex-wrap justify-between gap-2">
              <span className="font-medium">{v.name}</span>
              <span className="tabular-nums">
                {formatPaise(v.outstandingPaise)}
                {v.overdue ? (
                  <span className="ml-2 text-rose-600">· {v.daysOutstanding}d overdue</span>
                ) : (
                  <span className="ml-2 text-[var(--os-fg-muted-on-card)]">
                    · {v.daysOutstanding}d
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Row 6 — AI summary */}
      <section className="os-exec-panel os-exec-ai-panel">
        <h2 className="os-exec-section-title">AI summary</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          {aiBullets.map((bullet, idx) => (
            <li key={idx}>{bullet}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
