"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import ProcurementRoleBar from "@/components/os/procurement/ProcurementRoleBar";
import {
  formatInr,
  PageHeader,
  StatCard,
} from "@/components/os/procurement/ProcurementUi";
import { buildVendorDisputeSummaries } from "@/lib/os/procurement/disputes";
import {
  computeRecoveryDashboardStats,
  generateRecoveryInsights,
} from "@/lib/os/procurement/recovery";

export default function VendorRecoveryDashboardView() {
  const { db } = useProcurement();
  const stats = useMemo(() => computeRecoveryDashboardStats(db), [db]);
  const insights = useMemo(() => generateRecoveryInsights(db), [db]);
  const vendors = useMemo(() => buildVendorDisputeSummaries(db), [db]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Vendor recovery"
          title="Recovery Dashboard"
          description="Recoverable amounts, disputes, and branch-level exposure."
        />
        <ProcurementRoleBar />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total recoverable" value={formatInr(stats.totalRecoverable)} />
        <StatCard label="Recovered amount" value={formatInr(stats.recoveredAmount)} />
        <StatCard label="Pending recovery" value={formatInr(stats.pendingRecovery)} />
        <StatCard label="This month recovery" value={formatInr(stats.recoveredThisMonth)} />
        <StatCard label="Disputes open" value={String(stats.disputesOpen)} />
        <StatCard label="Disputes closed" value={String(stats.disputesClosed)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="os-card p-5">
          <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">
            Top vendor credits
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.topVendorCredits.map((v) => (
              <li key={v.vendorName} className="flex justify-between">
                <span>{v.vendorName}</span>
                <span className="font-medium">{formatInr(v.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="os-card p-5">
          <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">
            Top disputed items
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.topDisputedItems.map((i) => (
              <li key={i.itemName} className="flex justify-between">
                <span>{i.itemName}</span>
                <span>{i.count} disputes</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">AI insights</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className={`rounded-lg border p-3 text-sm ${
                ins.severity === "critical"
                  ? "border-red-400/40 bg-red-500/10"
                  : ins.severity === "warning"
                    ? "border-amber-400/40 bg-amber-500/10"
                    : "border-[var(--os-border)] bg-white/40"
              }`}
            >
              <p className="font-semibold text-[var(--os-fg-on-card)]">{ins.title}</p>
              <p className="mt-1 text-[var(--os-fg-muted-on-card)]">{ins.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="os-card overflow-x-auto p-5">
        <h3 className="mb-3 text-sm font-semibold">Vendor recovery summary</h3>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
            <tr>
              <th className="py-2">Vendor</th>
              <th className="py-2">Open</th>
              <th className="py-2">Pending</th>
              <th className="py-2">Recovered</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.vendorId} className="border-t border-[var(--os-border)]">
                <td className="py-2 font-medium">{v.vendorName}</td>
                <td className="py-2">{v.openDisputes}</td>
                <td className="py-2">{formatInr(v.pendingRecoverable)}</td>
                <td className="py-2">{formatInr(v.recoveredCredits)}</td>
                <td className="py-2 text-right">
                  <Link
                    href={`/os/procurement/vendors?vendorId=${v.vendorId}`}
                    className="text-[var(--os-accent)] hover:underline"
                  >
                    Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/os/procurement/credit-note-register"
          className="text-sm text-[var(--os-accent)] hover:underline"
        >
          Credit Note Register
        </Link>
        <Link
          href="/os/procurement/vendor-disputes"
          className="text-sm text-[var(--os-accent)] hover:underline"
        >
          Vendor Disputes
        </Link>
        <Link
          href="/os/procurement/credit-recovery"
          className="text-sm text-[var(--os-accent)] hover:underline"
        >
          Credit Recovery Tracker
        </Link>
      </div>
    </div>
  );
}
