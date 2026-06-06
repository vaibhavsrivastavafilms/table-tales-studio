"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import ProcurementRoleBar from "@/components/os/procurement/ProcurementRoleBar";
import {
  formatInr,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import {
  buildVendorDisputeSummaries,
  computeDisputeCenterStats,
} from "@/lib/os/procurement/disputes";
import {
  disputesToCsv,
  downloadCsv,
  getVendorCreditProfile,
} from "@/lib/os/procurement/credit-register";
import type { DisputeReason } from "@/lib/os/procurement/types";

export default function VendorDisputesView() {
  const { db } = useProcurement();
  const summaries = useMemo(() => buildVendorDisputeSummaries(db), [db]);
  const stats = useMemo(() => computeDisputeCenterStats(db), [db]);
  const [vendorFilter, setVendorFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState<DisputeReason | "all">("all");
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const lineDisputes = useMemo(() => {
    return db.vendorDisputes.filter((d) => {
      if (vendorFilter && !d.vendorName.toLowerCase().includes(vendorFilter.toLowerCase())) {
        return false;
      }
      if (reasonFilter !== "all" && d.reason !== reasonFilter) return false;
      return true;
    });
  }, [db.vendorDisputes, vendorFilter, reasonFilter]);

  const profile = selectedVendorId
    ? getVendorCreditProfile(db, selectedVendorId)
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Vendor dispute center"
          title="Vendor Dispute Tracking"
          description="Auto-created when bill qty ≠ received qty. Expected credit = short qty × bill rate."
        />
        <ProcurementRoleBar />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="All disputes" value={stats.totalDisputes} />
        <StatCard label="Pending" value={stats.pendingDisputes} />
        <StatCard label="Resolved" value={stats.resolvedDisputes} />
        <StatCard label="Recovered" value={formatInr(stats.recoveredAmount)} />
        <StatCard label="Pending amount" value={formatInr(stats.pendingAmount)} />
        <StatCard label="Avg resolution (days)" value={String(stats.avgResolutionDays)} />
        <StatCard
          label="Top vendor"
          value={stats.topVendors[0]?.vendorName ?? "—"}
          hint={
            stats.topVendors[0]
              ? formatInr(stats.topVendors[0].amount)
              : undefined
          }
        />
        <StatCard
          label="Most disputed item"
          value={stats.mostDisputedItems[0]?.itemName ?? "—"}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Filter vendor…"
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className="max-w-xs bg-white/90"
        />
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-2 py-2 text-sm"
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value as DisputeReason | "all")}
        >
          <option value="all">All reasons</option>
          <option value="Short Supply">Short Supply</option>
          <option value="Missing Item">Missing Item</option>
          <option value="Damaged Goods">Damaged Goods</option>
          <option value="Wrong Billing">Wrong Billing</option>
          <option value="Other">Other</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadCsv(
              `vendor-disputes-${new Date().toISOString().slice(0, 10)}.csv`,
              disputesToCsv(lineDisputes)
            )
          }
        >
          <Download className="mr-1 h-4 w-4" />
          Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" />
          PDF
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/os/procurement/recovery-dashboard">Recovery dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-2xl border border-[var(--os-border)]">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
              <tr>
                <th className="px-3 py-3">Dispute #</th>
                <th className="px-3 py-3">Vendor</th>
                <th className="px-3 py-3">Invoice</th>
                <th className="px-3 py-3">Item</th>
                <th className="px-3 py-3">Diff</th>
                <th className="px-3 py-3">Expected</th>
                <th className="px-3 py-3">Pending</th>
                <th className="px-3 py-3">Reason</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {lineDisputes.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] hover:bg-white/40"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/os/procurement/disputes/${d.id}`}
                      className="font-medium text-[var(--os-accent)] hover:underline"
                    >
                      {d.disputeNumber}
                    </Link>
                  </td>
                  <td
                    className="cursor-pointer px-3 py-2"
                    onClick={() => setSelectedVendorId(d.vendorId)}
                  >
                    {d.vendorName}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/os/procurement/invoice-history/${d.billId}`}
                      className="hover:underline"
                    >
                      {d.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{d.itemName}</td>
                  <td className="px-3 py-2 tabular-nums">{d.differenceQty}</td>
                  <td className="px-3 py-2 tabular-nums">{formatInr(d.expectedCredit)}</td>
                  <td className="px-3 py-2 tabular-nums font-semibold text-[var(--os-accent)]">
                    {formatInr(d.pendingCredit)}
                  </td>
                  <td className="px-3 py-2 text-xs">{d.reason}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {profile ? (
          <div className="os-card space-y-3 p-5 text-sm">
            <p className="font-semibold">{profile.dispute.vendorName}</p>
            <p className="text-xs text-[var(--os-fg-muted-on-card)]">
              Open {profile.dispute.openDisputes} · Pending{" "}
              {formatInr(profile.dispute.pendingRecoverable)}
            </p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
              {profile.disputes.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/os/procurement/disputes/${d.id}`}
                    className="text-[var(--os-accent)] hover:underline"
                  >
                    {d.itemName}
                  </Link>{" "}
                  — {formatInr(d.pendingCredit)}
                </li>
              ))}
            </ul>
            <Link
              href={`/os/procurement/vendors?vendorId=${profile.dispute.vendorId}`}
              className="text-xs text-[var(--os-accent)] hover:underline"
            >
              Vendor profile
            </Link>
          </div>
        ) : (
          <p className="text-sm text-[var(--os-fg-muted)]">
            Click a vendor name for summary
          </p>
        )}
      </div>

      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Vendor rollup</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
            <tr>
              <th className="py-2">Vendor</th>
              <th className="py-2">Cases</th>
              <th className="py-2">Recoverable</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.id} className="border-t border-[var(--os-border)]">
                <td className="py-2">{s.vendorName}</td>
                <td className="py-2">{s.caseCount}</td>
                <td className="py-2">{formatInr(s.pendingRecoverable)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
