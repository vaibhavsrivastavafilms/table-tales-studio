"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  LineBadge,
  LockLabel,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import { sumExtraCharges, sumLineAmounts } from "@/lib/os/procurement/bill-totals";
import { computeExpectedCredit } from "@/lib/os/procurement/procurement-controls";

type BillReviewViewProps = {
  billId: string;
};

export default function BillReviewView({ billId }: BillReviewViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const automated = searchParams.get("automated") === "1";
  const {
    db,
    approveBill,
    rejectBill,
    updateLineReceivedQty,
    omitLineToOmissionQueue,
    createBillRevision,
  } = useProcurement();

  const bill = db.purchaseBills.find((b) => b.id === billId);
  const grn = db.grns.find((g) => g.billId === billId);
  const revisions = useMemo(
    () => db.billRevisions.filter((r) => r.parentBillId === billId),
    [db.billRevisions, billId]
  );
  const omittedLines = useMemo(
    () => bill?.items.filter((l) => l.omissionStatus === "omitted") ?? [],
    [bill?.items]
  );
  const omissionRevisionBill = useMemo(() => {
    for (const rev of revisions) {
      const draft = db.purchaseBills.find(
        (b) => b.id === rev.revisionBillId && b.status === "draft"
      );
      if (draft) return draft;
    }
    const first = revisions[0];
    return first
      ? (db.purchaseBills.find((b) => b.id === first.revisionBillId) ?? null)
      : null;
  }, [revisions, db.purchaseBills]);
  const isLocked = bill?.status === "posted" || bill?.status === "rejected";

  if (!bill) {
    return (
      <p className="text-sm text-[var(--os-fg-muted)]">Bill not found.</p>
    );
  }

  const pendingOmissions = db.omissionCases.filter(
    (c) => c.billId === billId && c.status === "pending"
  );
  const itemsSubtotal = sumLineAmounts(bill.items);
  const extraTotal = sumExtraCharges(bill.extraCharges ?? []);

  function handleApprove() {
    approveBill(billId);
    router.push("/os/procurement");
  }

  function handleRevision() {
    const reason = window.prompt("Reason for revision invoice?");
    if (!reason?.trim()) return;
    const result = createBillRevision(billId, reason.trim());
    if (result) {
      router.push(
        `/os/procurement/purchase-bills/${result.revisionBill.id}/review`
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Bill Review · Invoice locked"
        title="Review Bill"
        description="Financial values are locked to the supplier invoice. Only received quantity can be changed."
      />

      {automated ? (
        <div className="os-card border-[var(--os-accent)]/30 p-4 text-sm text-[var(--os-fg-on-card)]">
          <p className="font-semibold text-[var(--os-accent)]">AI extraction complete</p>
          <p className="mt-1 text-[var(--os-fg-muted-on-card)]">
            Confirm received qty per line. Use ✕ to omit a line — a revision invoice is
            created automatically with only received items. Original invoice stays locked.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="os-card grid gap-3 p-5 sm:grid-cols-2">
            <Field label="Vendor" value={bill.vendorName} />
            <Field label="Invoice" value={bill.invoiceNumber} />
            <Field label="Date" value={bill.invoiceDate} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
                Status
              </p>
              <div className="mt-1">
                <StatusBadge status={bill.status} />
              </div>
            </div>
            <LockLabel label="Taxable" value={formatInr(bill.taxableAmount)} />
            <LockLabel label="GST" value={formatInr(bill.gstAmount)} />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--os-border)]">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
                <tr>
                  <th className="w-10 px-2 py-3" />
                  <th className="px-3 py-3">Item</th>
                  <th className="px-3 py-3">Bill Qty</th>
                  <th className="px-3 py-3">Received Qty</th>
                  <th className="px-3 py-3">Unit</th>
                  <th className="px-3 py-3">
                    <span className="inline-flex items-center gap-1">
                      Rate <Lock className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-3 py-3">
                    <span className="inline-flex items-center gap-1">
                      GST% <Lock className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="px-3 py-3">
                    <span className="inline-flex items-center gap-1">
                      Amount <Lock className="h-3 w-3" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((line) => {
                  const expectedCredit = computeExpectedCredit(
                    line.shortQty,
                    line.rate
                  );
                  return (
                    <tr
                      key={line.id}
                      className="border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] text-[var(--os-fg-on-card)]"
                    >
                      <td className="px-2 py-3">
                        {!isLocked ? (
                          <button
                            type="button"
                            title="Move to omission queue"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-300/60 text-red-600 hover:bg-red-50"
                            onClick={() => omitLineToOmissionQueue(billId, line.id)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{line.itemName}</span>
                          {line.omissionStatus === "omitted" ? (
                            <LineBadge variant="omitted">Omitted</LineBadge>
                          ) : null}
                          {line.omissionStatus === "partial" ? (
                            <LineBadge variant="short">
                              Short {line.shortQty} {line.unit}
                            </LineBadge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 tabular-nums font-medium">
                        {line.quantity}
                      </td>
                      <td className="px-3 py-3">
                        {isLocked ? (
                          <span className="tabular-nums">{line.receivedQty}</span>
                        ) : (
                          <Input
                            type="number"
                            min={0}
                            max={line.quantity}
                            step="any"
                            className="h-8 w-24 bg-white text-zinc-900"
                            value={line.receivedQty}
                            onChange={(e) => {
                              const v = Math.min(
                                line.quantity,
                                Math.max(0, Number(e.target.value))
                              );
                              updateLineReceivedQty(billId, line.id, v);
                            }}
                          />
                        )}
                      </td>
                      <td className="px-3 py-3">{line.unit}</td>
                      <td className="px-3 py-3 tabular-nums text-[var(--os-fg-muted-on-card)]">
                        {line.rate}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-[var(--os-fg-muted-on-card)]">
                        {line.gstPercent}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-[var(--os-fg-muted-on-card)]">
                        {formatInr(line.amount)}
                        {line.shortQty > 0 ? (
                          <p className="mt-0.5 text-[10px] text-[var(--os-accent)]">
                            Credit est. {formatInr(expectedCredit)}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(bill.extraCharges?.length ?? 0) > 0 ? (
            <div className="os-card overflow-x-auto p-5">
              <p className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">
                Extra charges (locked — included in invoice total)
              </p>
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase text-[var(--os-fg-muted-on-card)]">
                  <tr>
                    <th className="py-2">Charge</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.extraCharges.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--os-border)]">
                      <td className="py-2">{c.label}</td>
                      <td className="py-2 text-right tabular-nums">{formatInr(c.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[var(--os-border)] font-medium">
                    <td className="py-2">Items subtotal</td>
                    <td className="py-2 text-right tabular-nums">{formatInr(itemsSubtotal)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Extra charges</td>
                    <td className="py-2 text-right tabular-nums">{formatInr(extraTotal)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Invoice total (payable)</td>
                    <td className="py-2 text-right tabular-nums text-[var(--os-accent)]">
                      {formatInr(bill.totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : null}

          {omittedLines.length > 0 ? (
            <div className="os-card border-amber-400/40 bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-[var(--os-fg-on-card)]">
                {omittedLines.length} item(s) omitted — revision invoice{" "}
                {omissionRevisionBill ? omissionRevisionBill.invoiceNumber : "pending"}
              </p>
              <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">
                Omitted: {omittedLines.map((l) => l.itemName).join(", ")}. Original bill
                unchanged; revision reflects received qty only.
              </p>
              {omissionRevisionBill ? (
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link
                    href={`/os/procurement/purchase-bills/${omissionRevisionBill.id}/review`}
                  >
                    Open revision invoice
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}

          {pendingOmissions.length ? (
            <div className="os-card p-4">
              <p className="text-sm font-semibold text-[var(--os-fg-on-card)]">
                {pendingOmissions.length} pending omission(s) for this bill
              </p>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/os/procurement/omissions">Open Omission Center</Link>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {bill.pdfDataUrl ? (
            <iframe
              src={bill.pdfDataUrl}
              title="Bill PDF"
              className="os-card h-[420px] w-full rounded-2xl bg-white"
            />
          ) : bill.imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bill.imageDataUrl}
              alt="Bill scan"
              className="os-card w-full object-cover"
            />
          ) : (
            <div className="os-card flex h-40 items-center justify-center p-4 text-sm text-[var(--os-fg-muted-on-card)]">
              Original OCR preserved in bill record
            </div>
          )}

          <div className="os-card space-y-2 p-4">
            <LockLabel label="Invoice total (payable)" value={formatInr(bill.totalValue)} />
            <p className="text-xs text-[var(--os-fg-muted-on-card)]">
              Items {formatInr(itemsSubtotal)}
              {extraTotal > 0 ? ` + extras ${formatInr(extraTotal)}` : ""} — matches supplier invoice
            </p>
          </div>

          {revisions.length ? (
            <div className="os-card p-4 text-sm">
              <p className="font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)] text-[10px]">
                Revision history
              </p>
              <ul className="mt-2 space-y-1 text-[var(--os-fg-on-card)]">
                {revisions.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/os/procurement/purchase-bills/${r.revisionBillId}/review`}
                      className="text-[var(--os-accent)] hover:underline"
                    >
                      {r.reason}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {!isLocked ? (
              <>
                <Button onClick={handleApprove}>Approve & Post</Button>
                <Button variant="outline" onClick={handleRevision}>
                  {omittedLines.length
                    ? "Create another revision"
                    : "Create revision invoice"}
                </Button>
                <Button variant="destructive" onClick={() => rejectBill(billId)}>
                  Reject
                </Button>
              </>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/os/procurement/purchase-bills">Back to bills</Link>
              </Button>
            )}
            {pendingOmissions.length ? (
              <Button variant="secondary" asChild>
                <Link href="/os/procurement/credit-notes">Credit notes</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
        {label}
      </p>
      <p className="mt-1 font-medium text-[var(--os-fg-on-card)]">{value}</p>
    </div>
  );
}
