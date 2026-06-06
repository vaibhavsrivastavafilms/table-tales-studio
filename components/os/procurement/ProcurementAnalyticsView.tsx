"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatCard,
} from "@/components/os/procurement/ProcurementUi";
import {
  computeProcurementAnalytics,
  computeVendorAgeing,
  generateProcurementInsights,
} from "@/lib/os/procurement/analytics";
import type { ProcurementInsight } from "@/lib/os/procurement/types";

export default function ProcurementAnalyticsView() {
  const { db } = useProcurement();
  const analytics = computeProcurementAnalytics(db);
  const ageing = computeVendorAgeing(db);
  const [insights, setInsights] = useState<ProcurementInsight[]>(() =>
    generateProcurementInsights(db)
  );
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingInsights(true);
    fetch("/api/os/procurement/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ db }),
    })
      .then((r) => r.json())
      .then((data: { insights?: ProcurementInsight[] }) => {
        if (!cancelled && data.insights?.length) {
          setInsights(data.insights);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingInsights(false);
      });
    return () => {
      cancelled = true;
    };
  }, [db]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Procurement Engine V1.5"
        title="Procurement Analytics"
        description="Spend trends, omission rate, GRN variance, and vendor ageing."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="7d Purchases" value={formatInr(analytics.purchaseVolume7d)} />
        <StatCard label="30d Purchases" value={formatInr(analytics.purchaseVolume30d)} />
        <StatCard label="Avg Bill Value" value={formatInr(analytics.avgBillValue)} />
        <StatCard
          label="Omission Rate"
          value={`${(analytics.omissionRate * 100).toFixed(1)}%`}
        />
        <StatCard
          label="GRN Variance (units)"
          value={analytics.grnVarianceTotal.toFixed(1)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="os-card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            Category spend
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--os-fg-on-card)]">
            {analytics.categorySpend.map((row) => (
              <li key={row.category} className="flex justify-between">
                <span>{row.category}</span>
                <span className="font-semibold tabular-nums">
                  {formatInr(row.amount)}
                </span>
              </li>
            ))}
            {!analytics.categorySpend.length ? (
              <li className="text-[var(--os-fg-muted-on-card)]">No posted bills yet.</li>
            ) : null}
          </ul>
        </div>

        <div className="os-card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            Daily purchases (30d)
          </h3>
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm text-[var(--os-fg-on-card)]">
            {analytics.dailyPurchases.map((row) => (
              <li key={row.date} className="flex justify-between tabular-nums">
                <span>{row.date}</span>
                <span>{formatInr(row.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="os-card overflow-hidden p-0">
        <div className="border-b border-[var(--os-border)] px-5 py-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            Vendor ageing report
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            <tr>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Current</th>
              <th className="px-4 py-3">1–15d</th>
              <th className="px-4 py-3">16–30d</th>
              <th className="px-4 py-3">31–60d</th>
              <th className="px-4 py-3">60+d</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {ageing.map((row) => (
              <tr
                key={row.vendorId}
                className="border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] text-[var(--os-fg-on-card)]"
              >
                <td className="px-4 py-3 font-medium">{row.vendorName}</td>
                <td className="px-4 py-3 tabular-nums">{formatInr(row.current)}</td>
                <td className="px-4 py-3 tabular-nums">{formatInr(row.days1to15)}</td>
                <td className="px-4 py-3 tabular-nums">{formatInr(row.days16to30)}</td>
                <td className="px-4 py-3 tabular-nums">{formatInr(row.days31to60)}</td>
                <td className="px-4 py-3 tabular-nums">{formatInr(row.days60plus)}</td>
                <td className="px-4 py-3 tabular-nums font-semibold">
                  {formatInr(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="os-card p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--os-accent)]" />
          <h3 className="text-sm font-bold text-[var(--os-fg-on-card)]">
            AI procurement insights
          </h3>
          {loadingInsights ? (
            <span className="text-xs text-[var(--os-fg-muted-on-card)]">Updating…</span>
          ) : null}
        </div>
        <ul className="mt-4 space-y-3">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className="rounded-lg border border-[var(--os-border)] bg-white/5 p-3"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--os-accent)]">
                {insight.severity}
              </p>
              <p className="mt-1 font-semibold text-[var(--os-fg-on-card)]">
                {insight.title}
              </p>
              <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">
                {insight.detail}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
