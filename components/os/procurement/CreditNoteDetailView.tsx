"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import AuditTrailPanel from "@/components/os/procurement/AuditTrailPanel";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import { getEntityAuditTrail } from "@/lib/os/procurement/audit";

type CreditNoteDetailViewProps = {
  creditNoteId: string;
};

export default function CreditNoteDetailView({
  creditNoteId,
}: CreditNoteDetailViewProps) {
  const { db } = useProcurement();
  const note = db.creditNotes.find((c) => c.id === creditNoteId);
  const vendor = note ? db.vendors.find((v) => v.id === note.vendorId) : undefined;
  const dispute = note?.omissionId
    ? db.vendorDisputes.find((d) => d.omissionId === note.omissionId)
    : undefined;
  const recovery = dispute
    ? db.creditRecoveries.find((r) => r.disputeId === dispute.id)
    : undefined;
  const auditTrail = useMemo(
    () => (note ? getEntityAuditTrail(db, note.id) : []),
    [db, note]
  );

  if (!note) {
    return <p className="text-sm text-[var(--os-fg-muted)]">Credit note not found.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Credit Note"
        title={note.creditNoteNumber}
        description={vendor?.name ?? "Vendor"}
      />

      <div className="os-card grid gap-4 p-5 sm:grid-cols-2">
        <Detail label="Amount" value={formatInr(note.amount)} />
        <Detail label="Date" value={note.creditNoteDate ?? "—"} />
        <Detail label="Status" value={<StatusBadge status={note.status} />} />
        <Detail label="Applied" value={note.appliedAt ? new Date(note.appliedAt).toLocaleString("en-IN") : "—"} />
        <Detail label="Created by" value={note.createdBy} />
        {note.billId ? (
          <Detail
            label="Invoice"
            value={
              <Link
                href={`/os/procurement/invoice-history/${note.billId}`}
                className="text-[var(--os-accent)] hover:underline"
              >
                View invoice history
              </Link>
            }
          />
        ) : null}
        {dispute ? (
          <Detail
            label="Dispute"
            value={
              <Link
                href={`/os/procurement/disputes/${dispute.id}`}
                className="text-[var(--os-accent)] hover:underline"
              >
                {dispute.disputeNumber}
              </Link>
            }
          />
        ) : null}
      </div>

      {recovery ? (
        <div className="os-card p-5">
          <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">Recovery impact</h3>
          <p className="mt-2 text-sm">
            Expected {formatInr(recovery.expectedCredit)} · Received{" "}
            {formatInr(recovery.receivedCredit)} · Balance {formatInr(recovery.balance)}
          </p>
          <StatusBadge status={recovery.status} />
        </div>
      ) : null}

      <div className="os-card overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Rate</th>
              <th className="py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {note.items.map((row, i) => (
              <tr key={i} className="border-t border-[var(--os-border)]">
                <td className="py-2">{row.itemName}</td>
                <td className="py-2">{row.quantity}</td>
                <td className="py-2">{formatInr(row.rate)}</td>
                <td className="py-2">{formatInr(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {note.imageDataUrl ? (
        <div className="os-card p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={note.imageDataUrl}
            alt="Credit note"
            className="max-h-96 rounded-lg object-contain"
          />
        </div>
      ) : null}

      <div className="os-card p-5">
        <AuditTrailPanel entries={auditTrail} />
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
        {label}
      </p>
      <div className="mt-1 text-sm text-[var(--os-fg-on-card)]">{value}</div>
    </div>
  );
}
