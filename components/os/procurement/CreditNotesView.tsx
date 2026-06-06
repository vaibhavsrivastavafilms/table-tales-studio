"use client";

import Link from "next/link";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";

export default function CreditNotesView() {
  const { db } = useProcurement();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 12 · Credit Notes"
        title="Credit Notes"
        description="Vendor-accepted shortages reduce outstanding, adjust purchase value, and update inventory."
      />

      <div className="overflow-hidden rounded-2xl border border-[var(--os-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            <tr>
              <th className="px-4 py-3">Credit Note</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {db.creditNotes.map((note) => {
              const vendor = db.vendors.find((v) => v.id === note.vendorId);
              return (
                <tr
                  key={note.id}
                  className="border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] text-[var(--os-fg-on-card)]"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/os/procurement/credit-notes/${note.id}`}
                      className="text-[var(--os-accent)] hover:underline"
                    >
                      {note.creditNoteNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{vendor?.name ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{formatInr(note.amount)}</td>
                  <td className="px-4 py-3">
                    {note.items.map((i) => i.itemName).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={note.status} />
                  </td>
                  <td className="px-4 py-3">{note.createdAt.slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!db.creditNotes.length ? (
          <p className="p-6 text-sm text-[var(--os-fg-muted-on-card)]">
            No credit notes yet. Resolve an omission case with a vendor credit note.
          </p>
        ) : null}
      </div>

      {db.internalAdjustments.length ? (
        <div className="os-card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            Internal Adjustments (no credit note)
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--os-fg-on-card)]">
            {db.internalAdjustments.map((adj) => (
              <li key={adj.id}>
                {adj.itemName} · {adj.reason} · {formatInr(adj.amount)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
