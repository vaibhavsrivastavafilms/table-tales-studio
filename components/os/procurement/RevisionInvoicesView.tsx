"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";

export default function RevisionInvoicesView() {
  const { db } = useProcurement();

  const rows = useMemo(() => {
    return db.billRevisions.map((rev) => {
      const parent = db.purchaseBills.find((b) => b.id === rev.parentBillId);
      const revision = db.purchaseBills.find((b) => b.id === rev.revisionBillId);
      return { rev, parent, revision };
    });
  }, [db]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Procurement"
        title="Revision Invoices"
        description="Original invoices are immutable. Revisions track revised quantities with audit trail."
      />

      <div className="os-card overflow-x-auto p-5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
              <th className="pb-2">Original invoice</th>
              <th className="pb-2">Revision</th>
              <th className="pb-2">Reason</th>
              <th className="pb-2">Created</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ rev, parent, revision }) => (
              <tr key={rev.id} className="border-t border-[var(--os-border)]">
                <td className="py-3">
                  {parent ? (
                    <Link
                      href={`/os/procurement/invoice-history/${parent.id}`}
                      className="text-[var(--os-accent)] hover:underline"
                    >
                      {parent.invoiceNumber}
                    </Link>
                  ) : (
                    rev.parentBillId
                  )}
                  {parent ? (
                    <p className="text-xs text-[var(--os-fg-muted-on-card)]">
                      {formatInr(parent.totalValue)} · locked
                    </p>
                  ) : null}
                </td>
                <td className="py-3">
                  {revision ? (
                    <>
                      <Link
                        href={`/os/procurement/purchase-bills/${revision.id}/review`}
                        className="text-[var(--os-accent)] hover:underline"
                      >
                        {revision.invoiceNumber}
                      </Link>
                      <p className="text-xs text-[var(--os-fg-muted-on-card)]">
                        {revision.items.length} lines
                      </p>
                    </>
                  ) : (
                    rev.revisionBillId
                  )}
                </td>
                <td className="py-3">{rev.reason}</td>
                <td className="py-3 text-xs">
                  {new Date(rev.createdAt).toLocaleString("en-IN")}
                </td>
                <td className="py-3">
                  {revision ? <StatusBadge status={revision.status} /> : "—"}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-[var(--os-fg-muted-on-card)]">
                  No revision invoices yet. Create from purchase bill review when quantities
                  change after posting.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
