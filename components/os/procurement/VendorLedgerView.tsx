"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
} from "@/components/os/procurement/ProcurementUi";
import { computeVendorAgeing } from "@/lib/os/procurement/analytics";
import { getVendorOutstanding } from "@/lib/os/procurement/local-db";
import {
  downloadVendorStatement,
  printVendorStatement,
} from "@/lib/os/procurement/vendor-statement";

export default function VendorLedgerView() {
  const { db } = useProcurement();
  const ageing = computeVendorAgeing(db);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Module 14 · Vendor Ledger"
        title="Vendor Ledger"
        description="Purchases, payments, credit notes, adjustments, outstanding, ageing, and statement export."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {db.vendors.map((vendor) => {
          const outstanding = getVendorOutstanding(db, vendor.id);
          const age = ageing.find((a) => a.vendorId === vendor.id);
          return (
            <div key={vendor.id} className="os-card p-4">
              <p className="font-semibold text-[var(--os-fg-on-card)]">{vendor.name}</p>
              <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">
                GST {vendor.gstNumber ?? "—"} · {vendor.paymentTermsDays} days credit
              </p>
              <p className="mt-3 text-xl font-bold tabular-nums text-[var(--os-fg-on-card)]">
                {formatInr(outstanding)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
                Outstanding
                {age && age.days60plus > 0
                  ? ` · 60+ ${formatInr(age.days60plus)}`
                  : ""}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadVendorStatement(db, vendor)}
                >
                  <Download className="h-3 w-3" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => printVendorStatement(db, vendor)}
                >
                  <Printer className="h-3 w-3" />
                  PDF
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--os-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Debit</th>
              <th className="px-4 py-3">Credit</th>
              <th className="px-4 py-3">Balance</th>
            </tr>
          </thead>
          <tbody>
            {[...db.vendorLedger]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((entry) => {
                const vendor = db.vendors.find((v) => v.id === entry.vendorId);
                return (
                  <tr
                    key={entry.id}
                    className="border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] text-[var(--os-fg-on-card)]"
                  >
                    <td className="px-4 py-3">{entry.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3">{vendor?.name ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">
                      {entry.type.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">{entry.description}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {entry.debit ? formatInr(entry.debit) : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {entry.credit ? formatInr(entry.credit) : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold">
                      {formatInr(entry.balance)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {!db.vendorLedger.length ? (
          <p className="p-6 text-sm text-[var(--os-fg-muted-on-card)]">
            Ledger entries appear when bills are approved and posted.
          </p>
        ) : null}
      </div>
    </div>
  );
}
