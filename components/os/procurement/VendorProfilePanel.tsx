"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import {
  buildCreditRegister,
  getVendorCreditProfile,
} from "@/lib/os/procurement/credit-register";

import { getVendorOutstanding } from "@/lib/os/procurement/local-db";

const TABS = [
  "Purchases",
  "Ledger",
  "Disputes",
  "Credit Notes",
  "Recovery",
  "Documents",
  "Analytics",
] as const;

type Tab = (typeof TABS)[number];

export default function VendorProfilePanel({ vendorId }: { vendorId: string }) {
  const { db } = useProcurement();
  const [tab, setTab] = useState<Tab>("Disputes");
  const vendor = db.vendors.find((v) => v.id === vendorId);
  const profile = useMemo(
    () => getVendorCreditProfile(db, vendorId),
    [db, vendorId]
  );
  const bills = db.purchaseBills.filter(
    (b) => b.vendorId === vendorId && b.status === "posted"
  );
  const creditNotes = db.creditNotes.filter((c) => c.vendorId === vendorId);
  const documents = db.vendorDocuments.filter((d) => d.vendorId === vendorId);
  const registerRows = buildCreditRegister(db).filter((r) => r.vendorId === vendorId);
  const outstanding = getVendorOutstanding(db, vendorId);

  if (!vendor) return null;

  return (
    <div className="os-card space-y-4 p-5">
      <div>
        <h3 className="text-lg font-semibold text-[var(--os-fg-on-card)]">{vendor.name}</h3>
        <p className="text-xs text-[var(--os-fg-muted-on-card)]">
          GST {vendor.gstNumber ?? "—"} · Outstanding {formatInr(outstanding)}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[var(--os-border)] pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-2 py-1 text-xs font-medium ${
              tab === t
                ? "bg-[var(--os-accent)] text-white"
                : "text-[var(--os-fg-muted-on-card)] hover:bg-white/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Purchases" && (
        <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
          {bills.map((b) => (
            <li key={b.id}>
              <Link
                href={`/os/procurement/invoice-history/${b.id}`}
                className="text-[var(--os-accent)] hover:underline"
              >
                {b.invoiceNumber}
              </Link>{" "}
              — {formatInr(b.totalValue)}
            </li>
          ))}
        </ul>
      )}

      {tab === "Ledger" && (
        <ul className="space-y-1 text-sm max-h-64 overflow-y-auto">
          {(profile?.ledger ?? []).map((e) => (
            <li key={e.id} className="flex justify-between gap-2">
              <span className="truncate">{e.description}</span>
              <span>
                {e.debit ? `Dr ${formatInr(e.debit)}` : `Cr ${formatInr(e.credit)}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {tab === "Disputes" && (
        <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
          {(profile?.disputes ?? []).map((d) => (
            <li key={d.id}>
              <Link
                href={`/os/procurement/disputes/${d.id}`}
                className="text-[var(--os-accent)] hover:underline"
              >
                {d.disputeNumber}
              </Link>{" "}
              — {d.itemName} · {formatInr(d.pendingCredit)} pending
              <StatusBadge status={d.status} />
            </li>
          ))}
        </ul>
      )}

      {tab === "Credit Notes" && (
        <ul className="space-y-2 text-sm">
          {creditNotes.map((cn) => (
            <li key={cn.id}>
              <Link
                href={`/os/procurement/credit-notes/${cn.id}`}
                className="text-[var(--os-accent)] hover:underline"
              >
                {cn.creditNoteNumber}
              </Link>{" "}
              — {formatInr(cn.amount)}
            </li>
          ))}
        </ul>
      )}

      {tab === "Recovery" && (
        <div className="text-sm space-y-2">
          <p>Pending: {formatInr(profile?.dispute.pendingRecoverable ?? 0)}</p>
          <p>Recovered: {formatInr(profile?.dispute.recoveredCredits ?? 0)}</p>
          {registerRows.map((r) => (
            <p key={r.id}>
              {r.itemName}: expected {formatInr(r.expectedCredit)} · balance{" "}
              {formatInr(r.balance)}
            </p>
          ))}
        </div>
      )}

      {tab === "Documents" && (
        <ul className="text-sm">
          {documents.map((d) => (
            <li key={d.id}>
              {d.label} ({d.docType})
            </li>
          ))}
        </ul>
      )}

      {tab === "Analytics" && profile && (
        <div className="text-sm grid gap-2">
          <p>Total purchases: {formatInr(profile.dispute.totalPurchases)}</p>
          <p>Open disputes: {profile.dispute.openDisputes}</p>
          <p>Cases: {profile.dispute.caseCount}</p>
        </div>
      )}
    </div>
  );
}
