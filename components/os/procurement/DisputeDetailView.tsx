"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import AuditTrailPanel from "@/components/os/procurement/AuditTrailPanel";
import { useProcurementActor } from "@/components/os/procurement/ProcurementRoleBar";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import { getDisputeDetailBundle } from "@/lib/os/procurement/disputes";
import {
  canApproveCreditNotes,
  canCloseDisputes,
} from "@/lib/os/procurement/permissions";

type DisputeDetailViewProps = {
  disputeId: string;
};

export default function DisputeDetailView({ disputeId }: DisputeDetailViewProps) {
  const { db, addDisputeNote, closeDisputeRecord } = useProcurement();
  const actor = useProcurementActor();
  const [noteText, setNoteText] = useState("");
  const bundle = useMemo(
    () => getDisputeDetailBundle(db, disputeId),
    [db, disputeId]
  );

  if (!bundle) {
    return <p className="text-sm text-[var(--os-fg-muted)]">Dispute not found.</p>;
  }

  const { dispute, bill, grn, creditNotes, notes, activities, documents, editHistory, auditTrail, recovery } =
    bundle;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Vendor Dispute"
        title={dispute.disputeNumber}
        description={`${dispute.vendorName} · ${dispute.invoiceNumber} · ${dispute.itemName}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Bill Qty" value={String(dispute.billQty)} />
        <Metric label="Received" value={String(dispute.receivedQty)} />
        <Metric label="Difference" value={String(dispute.differenceQty)} />
        <Metric label="Expected credit" value={formatInr(dispute.expectedCredit)} />
        <Metric label="Received credit" value={formatInr(dispute.receivedCredit)} />
        <Metric label="Pending" value={formatInr(dispute.pendingCredit)} />
        <Metric label="Rate (locked)" value={formatInr(dispute.rate)} />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            Status
          </p>
          <div className="mt-1">
            <StatusBadge status={dispute.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="os-card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">Vendor</h3>
          <p className="text-sm">{dispute.vendorName}</p>
          <p className="text-xs text-[var(--os-fg-muted-on-card)]">
            Reason: {dispute.reason} · Branch: {dispute.branch}
          </p>
          <p className="text-xs text-[var(--os-fg-muted-on-card)]">
            Created by {dispute.createdBy} · {new Date(dispute.createdAt).toLocaleString("en-IN")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/os/procurement/invoice-history/${dispute.billId}`}>
                Invoice history
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/os/procurement/purchase-bills/${dispute.billId}/review`}>
                Bill review
              </Link>
            </Button>
            {dispute.omissionId ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/os/procurement/omissions/${dispute.omissionId}`}>
                  Omission case
                </Link>
              </Button>
            ) : null}
          </div>
        </section>

        <section className="os-card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">Recovery</h3>
          {recovery ? (
            <>
              <p className="text-sm">
                Expected {formatInr(recovery.expectedCredit)} · Received{" "}
                {formatInr(recovery.receivedCredit)} · Balance{" "}
                {formatInr(recovery.balance)}
              </p>
              <StatusBadge status={recovery.status} />
            </>
          ) : (
            <p className="text-sm text-[var(--os-fg-muted-on-card)]">No recovery record.</p>
          )}
          {canCloseDisputes(actor.role) && dispute.pendingCredit <= 0 ? (
            <Button
              size="sm"
              onClick={() => closeDisputeRecord(dispute.id, "Fully recovered")}
            >
              Close dispute
            </Button>
          ) : null}
          {!canCloseDisputes(actor.role) ? (
            <p className="text-xs text-[var(--os-fg-muted-on-card)]">
              Only Owner / Accountant can close disputes or approve credits.
            </p>
          ) : null}
        </section>
      </div>

      {bill?.imageDataUrl || bill?.pdfDataUrl ? (
        <section className="os-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">
            Original invoice (OCR)
          </h3>
          {bill.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bill.imageDataUrl}
              alt="Invoice"
              className="max-h-96 rounded-lg border object-contain"
            />
          ) : (
            <p className="text-sm text-[var(--os-fg-muted-on-card)]">PDF stored — open from bill review.</p>
          )}
        </section>
      ) : null}

      {grn ? (
        <section className="os-card p-5">
          <h3 className="mb-2 text-sm font-semibold text-[var(--os-fg-on-card)]">GRN</h3>
          <p className="text-xs text-[var(--os-fg-muted-on-card)]">
            {grn.invoiceNumber} · {grn.receiptStatus} · {grn.lines.length} lines
          </p>
        </section>
      ) : null}

      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">
          Edit history (received qty)
        </h3>
        {editHistory.length ? (
          <ul className="space-y-2 text-sm">
            {editHistory.map((h) => (
              <li key={h.id} className="rounded-lg bg-black/5 p-2">
                <strong>{h.itemName}</strong>: {h.originalQty} → {h.newQty} by {h.userName}{" "}
                — {h.reason} ({new Date(h.createdAt).toLocaleString("en-IN")})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--os-fg-muted-on-card)]">No edits logged.</p>
        )}
      </section>

      <section className="os-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">
          Credit notes received
        </h3>
        {creditNotes.length ? (
          <ul className="space-y-2">
            {creditNotes.map((cn) => (
              <li key={cn.id}>
                <Link
                  href={`/os/procurement/credit-notes/${cn.id}`}
                  className="text-sm font-medium text-[var(--os-accent)] hover:underline"
                >
                  {cn.creditNoteNumber} — {formatInr(cn.amount)}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--os-fg-muted-on-card)]">No credit notes yet.</p>
        )}
        {canApproveCreditNotes(actor.role) && dispute.omissionId ? (
          <Button className="mt-3" size="sm" asChild>
            <Link href={`/os/procurement/omissions/${dispute.omissionId}`}>
              Upload / apply credit note
            </Link>
          </Button>
        ) : null}
      </section>

      <section className="os-card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">Timeline</h3>
        <ul className="space-y-2 text-sm">
          {activities.map((a) => (
            <li key={a.id} className="border-l-2 border-[var(--os-accent)] pl-3">
              {a.activityType} · {formatInr(a.amount)} — {a.note}
              <span className="block text-xs text-[var(--os-fg-muted-on-card)]">
                {a.createdBy} · {new Date(a.createdAt).toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="os-card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">Internal notes</h3>
        <ul className="space-y-2 text-sm">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-black/5 p-2">
              {n.text}
              <span className="block text-xs text-[var(--os-fg-muted-on-card)]">
                {n.createdBy} · {new Date(n.createdAt).toLocaleString("en-IN")}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add internal note…"
            className="bg-white/90"
          />
          <Button
            disabled={!noteText.trim()}
            onClick={() => {
              addDisputeNote(dispute.id, noteText.trim());
              setNoteText("");
            }}
          >
            Add
          </Button>
        </div>
      </section>

      {documents.length ? (
        <section className="os-card p-5">
          <h3 className="mb-2 text-sm font-semibold text-[var(--os-fg-on-card)]">
            Attachments ({documents.length})
          </h3>
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
        <AuditTrailPanel entries={auditTrail} />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="os-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--os-fg-on-card)]">{value}</p>
    </div>
  );
}
