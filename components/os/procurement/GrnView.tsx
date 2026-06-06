"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";

export default function GrnView() {
  const { db, createGrn, updateGrnLines, confirmGrnRecord } = useProcurement();

  const postedBills = db.purchaseBills.filter(
    (b) => b.status === "draft" || b.status === "verified" || b.status === "posted"
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 6 · Goods Received Note"
        title="GRN"
        description="Record physical receipt vs billed quantity before posting inventory."
      />

      <div className="os-card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
          Create GRN from bill
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {postedBills.slice(0, 8).map((bill) => {
            const hasGrn = db.grns.some((g) => g.billId === bill.id);
            return (
              <li
                key={bill.id}
                className="flex flex-wrap items-center justify-between gap-2 text-[var(--os-fg-on-card)]"
              >
                <span>
                  {bill.invoiceNumber} · {bill.vendorName}
                </span>
                {hasGrn ? (
                  <StatusBadge status="verified" />
                ) : (
                  <Button size="sm" variant="outline" onClick={() => createGrn(bill.id)}>
                    Create GRN
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {db.grns.map((grn) => (
        <div key={grn.id} className="os-card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-[var(--os-fg-on-card)]">
                {grn.invoiceNumber} · {grn.vendorName}
              </p>
              <p className="text-xs text-[var(--os-fg-muted-on-card)]">
                GRN {grn.id.slice(-8)}
              </p>
            </div>
            <StatusBadge status={grn.receiptStatus} />
          </div>

          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2">Billed</th>
                <th className="py-2">Received</th>
                <th className="py-2">Variance</th>
              </tr>
            </thead>
            <tbody>
              {grn.lines.map((line) => (
                <tr key={line.id} className="text-[var(--os-fg-on-card)]">
                  <td className="py-2">{line.itemName}</td>
                  <td className="py-2 tabular-nums">
                    {line.billedQty} {line.unit}
                  </td>
                  <td className="py-2">
                    {grn.status !== "confirmed" ? (
                      <Input
                        type="number"
                        className="h-8 w-24 bg-white/90"
                        value={line.receivedQty}
                        onChange={(e) => {
                          const received = Number(e.target.value);
                          updateGrnLines(
                            grn.id,
                            grn.lines.map((l) =>
                              l.id === line.id
                                ? {
                                    ...l,
                                    receivedQty: received,
                                    variance: received - l.billedQty,
                                  }
                                : l
                            )
                          );
                        }}
                      />
                    ) : (
                      <span className="tabular-nums">
                        {line.receivedQty} {line.unit}
                      </span>
                    )}
                  </td>
                  <td
                    className={`py-2 tabular-nums font-semibold ${
                      line.variance !== 0 ? "text-[var(--os-accent)]" : ""
                    }`}
                  >
                    {line.variance > 0 ? "+" : ""}
                    {line.variance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {grn.status !== "confirmed" ? (
            <div className="flex gap-2">
              <Button onClick={() => confirmGrnRecord(grn.id)}>
                Confirm GRN
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/os/procurement/purchase-bills/${grn.billId}/review`}>
                  Open bill
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      ))}

      {!db.grns.length ? (
        <p className="text-sm text-[var(--os-fg-muted)]">
          No GRNs yet. Create one from a purchase bill before approving.
        </p>
      ) : null}
    </div>
  );
}
