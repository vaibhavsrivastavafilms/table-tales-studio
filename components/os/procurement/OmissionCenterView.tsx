"use client";

import Link from "next/link";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";

export default function OmissionCenterView() {
  const { db } = useProcurement();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Omission Center"
        title="Shortages & Omissions"
        description="Bill qty vs received qty. Expected credit = short qty × bill rate. Original invoice totals stay locked."
      />

      <div className="overflow-x-auto rounded-2xl border border-[var(--os-border)]">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            <tr>
              <th className="px-4 py-3">Case</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Bill Qty</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Short</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Expected Credit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {db.omissionCases.map((c) => (
              <tr
                key={c.id}
                className="border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] text-[var(--os-fg-on-card)]"
              >
                <td className="px-4 py-3 font-medium">{c.caseNumber}</td>
                <td className="px-4 py-3">{c.vendorName}</td>
                <td className="px-4 py-3">{c.invoiceNumber}</td>
                <td className="px-4 py-3">{c.itemName}</td>
                <td className="px-4 py-3 tabular-nums">{c.expectedQty}</td>
                <td className="px-4 py-3 tabular-nums">{c.receivedQty}</td>
                <td className="px-4 py-3 tabular-nums font-semibold text-[var(--os-accent)]">
                  {c.shortQty}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatInr(c.rate)}</td>
                <td className="px-4 py-3 tabular-nums font-medium">
                  {formatInr(c.expectedCredit)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.kind === "full_omitted" ? "omitted" : c.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/os/procurement/omissions/${c.id}`}
                    className="text-[var(--os-accent)] hover:underline"
                  >
                    Credit note →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!db.omissionCases.length ? (
          <p className="p-6 text-sm text-[var(--os-fg-muted-on-card)]">
            No omissions. Adjust received qty on bill review or mark lines with ✕.
          </p>
        ) : null}
      </div>
    </div>
  );
}
