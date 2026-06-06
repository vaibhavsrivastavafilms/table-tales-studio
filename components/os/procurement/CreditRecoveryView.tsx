"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatCard,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import {
  buildCreditRegister,
  computeCreditRegisterStats,
} from "@/lib/os/procurement/credit-register";

export default function CreditRecoveryView() {
  const { db } = useProcurement();
  const rows = useMemo(() => buildCreditRegister(db), [db]);
  const stats = useMemo(() => computeCreditRegisterStats(db, rows), [db, rows]);

  const trackerRows = rows.filter((r) => r.expectedCredit > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Credit recovery"
        title="Credit Recovery Tracker"
        description="Expected vs actual credit per line. Balance shows amount still recoverable from vendors."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Pending recoverable" value={formatInr(stats.totalRecoverable)} />
        <StatCard label="Recovered this month" value={formatInr(stats.recoveredThisMonth)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--os-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            <tr>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Expected</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {trackerRows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] text-[var(--os-fg-on-card)]"
              >
                <td className="px-4 py-3">{r.vendorName}</td>
                <td className="px-4 py-3">{r.itemName}</td>
                <td className="px-4 py-3 tabular-nums">{formatInr(r.expectedCredit)}</td>
                <td className="px-4 py-3 tabular-nums">{formatInr(r.actualCredit)}</td>
                <td className="px-4 py-3 tabular-nums font-semibold text-[var(--os-accent)]">
                  {formatInr(r.balance)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={r.balance > 0 && r.actualCredit > 0 ? "partial" : r.status}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/os/procurement/disputes/${r.disputeId}`}
                    className="text-[var(--os-accent)] hover:underline"
                  >
                    Dispute
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
