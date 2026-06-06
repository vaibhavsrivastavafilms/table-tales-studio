"use client";

import Link from "next/link";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import { Button } from "@/components/ui/button";

export default function PurchaseBillsListView() {
  const { db } = useProcurement();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Purchase Bills"
          title="Review OCR"
          description="Draft bills awaiting verification before posting to inventory and ledger."
        />
        <Button asChild>
          <Link href="/os/procurement/purchase-bills/upload">Upload Bill</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--os-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {db.purchaseBills.map((bill) => (
              <tr
                key={bill.id}
                className="border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] text-[var(--os-fg-on-card)]"
              >
                <td className="px-4 py-3 font-medium">{bill.invoiceNumber}</td>
                <td className="px-4 py-3">{bill.vendorName}</td>
                <td className="px-4 py-3">{bill.invoiceDate}</td>
                <td className="px-4 py-3 tabular-nums">{formatInr(bill.totalValue)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={bill.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {bill.status === "draft" ? (
                    <Link
                      href={`/os/procurement/purchase-bills/${bill.id}/review`}
                      className="text-[var(--os-accent)] hover:underline"
                    >
                      Review
                    </Link>
                  ) : (
                    <span className="text-[var(--os-fg-muted-on-card)]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!db.purchaseBills.length ? (
          <p className="p-6 text-sm text-[var(--os-fg-muted-on-card)]">
            No bills yet. Upload a vendor invoice to start OCR review.
          </p>
        ) : null}
      </div>
    </div>
  );
}
