"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import AuditTrailPanel from "@/components/os/procurement/AuditTrailPanel";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import { sumExtraCharges, sumLineAmounts } from "@/lib/os/procurement/bill-totals";
import { getBillHistoryBundle } from "@/lib/os/procurement/credit-register";

type InvoiceHistoryViewProps = {
  billId: string;
};

export default function InvoiceHistoryView({ billId }: InvoiceHistoryViewProps) {
  const { db } = useProcurement();
  const bundle = useMemo(() => getBillHistoryBundle(db, billId), [db, billId]);

  if (!bundle) {
    return <p className="text-sm text-[var(--os-fg-muted)]">Invoice not found.</p>;
  }

  const { bill, grn, revisions, omissions, disputes, creditNotes, editHistory, auditTrail, documents } =
    bundle;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Invoice revision history"
        title={bill.invoiceNumber}
        description={`${bill.vendorName} · ${bill.invoiceDate} — original OCR values are never overwritten`}
      />

      <div className="os-card grid gap-3 p-5 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase text-[var(--os-fg-muted-on-card)]">Status</p>
          <StatusBadge status={bill.status} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-[var(--os-fg-muted-on-card)]">Total (locked)</p>
          <p className="font-semibold">{formatInr(bill.totalValue)}</p>
          <p className="text-xs text-[var(--os-fg-muted-on-card)]">
            Items {formatInr(sumLineAmounts(bill.items))}
            {(bill.extraCharges?.length ?? 0) > 0
              ? ` + extras ${formatInr(sumExtraCharges(bill.extraCharges))}`
              : ""}
          </p>
        </div>
        <ButtonLink href={`/os/procurement/purchase-bills/${bill.id}/review`}>
          Open bill review
        </ButtonLink>
      </div>

      {bill.imageDataUrl || bill.pdfDataUrl ? (
        <section className="os-card p-5">
          <h3 className="mb-3 text-sm font-semibold">Original OCR bill</h3>
          {bill.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bill.imageDataUrl}
              alt="Invoice"
              className="max-h-[420px] rounded-lg border object-contain"
            />
          ) : (
            <p className="text-sm text-[var(--os-fg-muted-on-card)]">PDF on file</p>
          )}
        </section>
      ) : null}

      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold">Line quantities (immutable bill qty)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
              <th className="py-2">Item</th>
              <th className="py-2">Bill qty</th>
              <th className="py-2">Received</th>
              <th className="py-2">Short</th>
              <th className="py-2">Rate</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((line) => (
              <tr key={line.id} className="border-t border-[var(--os-border)]">
                <td className="py-2">{line.itemName}</td>
                <td className="py-2">{line.quantity}</td>
                <td className="py-2">{line.receivedQty}</td>
                <td className="py-2">{line.shortQty}</td>
                <td className="py-2">{formatInr(line.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold">All quantity changes</h3>
        {editHistory.length ? (
          <ul className="space-y-2 text-sm">
            {editHistory.map((h) => (
              <li key={h.id} className="rounded-lg bg-black/5 p-3">
                <strong>{h.itemName}</strong> — original {h.originalQty} → {h.newQty}
                <br />
                <span className="text-xs text-[var(--os-fg-muted-on-card)]">
                  {h.userName} · {h.reason} · {new Date(h.createdAt).toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--os-fg-muted-on-card)]">No received-qty edits.</p>
        )}
      </section>

      {revisions.length ? (
        <section className="os-card p-5">
          <h3 className="mb-2 text-sm font-semibold">Revision invoices</h3>
          <ul className="space-y-2 text-sm">
            {revisions.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/os/procurement/purchase-bills/${r.revisionBillId}/review`}
                  className="text-[var(--os-accent)] hover:underline"
                >
                  Revision — {r.reason}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {grn ? (
        <section className="os-card p-5">
          <h3 className="mb-2 text-sm font-semibold">GRN history</h3>
          <p className="text-sm">
            {grn.receiptStatus} · confirmed{" "}
            {grn.confirmedAt ? new Date(grn.confirmedAt).toLocaleString("en-IN") : "pending"}
          </p>
        </section>
      ) : null}

      <section className="os-card p-5">
        <h3 className="mb-2 text-sm font-semibold">Disputes & omissions</h3>
        <ul className="space-y-2 text-sm">
          {disputes.map((d) => (
            <li key={d.id}>
              <Link
                href={`/os/procurement/disputes/${d.id}`}
                className="text-[var(--os-accent)] hover:underline"
              >
                {d.disputeNumber} — {d.itemName} ({formatInr(d.pendingCredit)} pending)
              </Link>
            </li>
          ))}
          {omissions
            .filter((o) => !disputes.some((d) => d.omissionId === o.id))
            .map((o) => (
              <li key={o.id}>
                <Link
                  href={`/os/procurement/omissions/${o.id}`}
                  className="text-[var(--os-accent)] hover:underline"
                >
                  {o.caseNumber} — {o.itemName}
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <section className="os-card p-5">
        <h3 className="mb-2 text-sm font-semibold">Credit note history</h3>
        {creditNotes.length ? (
          <ul className="space-y-2 text-sm">
            {creditNotes.map((cn) => (
              <li key={cn.id}>
                <Link
                  href={`/os/procurement/credit-notes/${cn.id}`}
                  className="text-[var(--os-accent)] hover:underline"
                >
                  {cn.creditNoteNumber} — {formatInr(cn.amount)}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--os-fg-muted-on-card)]">None</p>
        )}
      </section>

      {documents.length ? (
        <section className="os-card p-5">
          <h3 className="mb-2 text-sm font-semibold">Documents</h3>
          <ul className="text-sm">
            {documents.map((d) => (
              <li key={d.id}>
                {d.label} ({d.docType})
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="os-card p-5">
        <AuditTrailPanel entries={auditTrail} title="Full audit trail" />
      </section>
    </div>
  );
}

function ButtonLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-md border border-[var(--os-border)] px-3 py-2 text-sm font-medium hover:bg-white/60"
    >
      {children}
    </Link>
  );
}
