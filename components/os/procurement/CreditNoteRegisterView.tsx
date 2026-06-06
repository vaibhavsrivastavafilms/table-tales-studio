"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, FileText, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  StatCard,
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import {
  buildCreditRegister,
  computeCreditRegisterStats,
  downloadCsv,
  filterCreditRegister,
  generateCreditRegisterInsights,
  getBillHistoryBundle,
  getVendorCreditProfile,
  registerToCsv,
} from "@/lib/os/procurement/credit-register";
import type {
  CreditRegisterFilters,
  CreditRegisterRow,
  CreditRegisterStatus,
} from "@/lib/os/procurement/types";

const STATUS_OPTIONS: { value: CreditRegisterStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "requested", label: "Requested" },
  { value: "partial", label: "Partial" },
  { value: "received", label: "Received" },
  { value: "adjusted", label: "Adjusted" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
];

export default function CreditNoteRegisterView() {
  const { db } = useProcurement();
  const allRows = useMemo(() => buildCreditRegister(db), [db]);
  const [filters, setFilters] = useState<CreditRegisterFilters>({
    vendor: "",
    invoice: "",
    item: "",
    creditNoteNumber: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
    branch: "",
    pendingOnly: false,
    minAmount: null,
    disputeReason: "all",
  });
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<CreditRegisterRow | null>(null);

  const rows = useMemo(
    () => filterCreditRegister(allRows, filters),
    [allRows, filters]
  );
  const stats = useMemo(
    () => computeCreditRegisterStats(db, allRows),
    [db, allRows]
  );
  const insights = useMemo(
    () => generateCreditRegisterInsights(db, allRows),
    [db, allRows]
  );
  const vendorProfile = selectedVendorId
    ? getVendorCreditProfile(db, selectedVendorId)
    : null;
  const billBundle = selectedBillId ? getBillHistoryBundle(db, selectedBillId) : null;

  function exportRegister() {
    downloadCsv(
      `credit-note-register-${new Date().toISOString().slice(0, 10)}.csv`,
      registerToCsv(rows)
    );
  }

  function printRegister() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 print:space-y-4">
      <PageHeader
        eyebrow="Credit & disputes"
        title="Credit Note Register"
        description="Track vendor shortages, bill edits, omissions, and recoverable amounts with full audit trail."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total credit notes" value={stats.totalCreditNotes} />
        <StatCard label="Pending" value={stats.pendingCreditNotes} />
        <StatCard label="Received" value={stats.receivedCreditNotes} />
        <StatCard label="Recoverable" value={formatInr(stats.totalRecoverable)} />
        <StatCard label="Recovered this month" value={formatInr(stats.recoveredThisMonth)} />
        <StatCard
          label="Top vendor credits"
          value={stats.topVendorCredits[0]?.vendorName ?? "—"}
          hint={
            stats.topVendorCredits[0]
              ? formatInr(stats.topVendorCredits[0].amount)
              : undefined
          }
        />
      </div>

      <div className="os-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <FilterInput
          placeholder="Vendor"
          value={filters.vendor}
          onChange={(v) => setFilters((f) => ({ ...f, vendor: v }))}
        />
        <FilterInput
          placeholder="Invoice"
          value={filters.invoice}
          onChange={(v) => setFilters((f) => ({ ...f, invoice: v }))}
        />
        <FilterInput
          placeholder="Item"
          value={filters.item}
          onChange={(v) => setFilters((f) => ({ ...f, item: v }))}
        />
        <select
          className="h-10 rounded-lg border border-[var(--os-border)] bg-white px-2 text-sm text-zinc-900"
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: e.target.value as CreditRegisterFilters["status"],
            }))
          }
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Input
          type="date"
          className="bg-white text-zinc-900"
          value={filters.dateFrom}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
        />
        <Input
          type="date"
          className="bg-white text-zinc-900"
          value={filters.dateTo}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-xs text-[var(--os-fg-on-card)]">
          <input
            type="checkbox"
            checked={filters.pendingOnly}
            onChange={(e) =>
              setFilters((f) => ({ ...f, pendingOnly: e.target.checked }))
            }
          />
          Pending amount only
        </label>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button size="sm" variant="outline" onClick={exportRegister}>
            <Download className="h-4 w-4" />
            Excel
          </Button>
          <Button size="sm" variant="outline" onClick={printRegister}>
            <Printer className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-2xl border border-[var(--os-border)] print:border-black">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-[var(--os-surface)] text-left text-[10px] uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
              <tr>
                <th className="px-3 py-3">Vendor</th>
                <th className="px-3 py-3">Invoice</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Item</th>
                <th className="px-3 py-3">Bill</th>
                <th className="px-3 py-3">Rcvd</th>
                <th className="px-3 py-3">Short</th>
                <th className="px-3 py-3">Rate</th>
                <th className="px-3 py-3">Expected</th>
                <th className="px-3 py-3">CN #</th>
                <th className="px-3 py-3">CN Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`cursor-pointer border-t border-[var(--os-border)] bg-[var(--os-surface-elevated)] text-[var(--os-fg-on-card)] hover:bg-white/80 ${
                    selectedRow?.id === row.id ? "ring-1 ring-[var(--os-accent)]" : ""
                  }`}
                  onClick={() => {
                    setSelectedRow(row);
                    setSelectedBillId(row.billId);
                    if (row.vendorId) setSelectedVendorId(row.vendorId);
                  }}
                >
                  <td className="px-3 py-2 font-medium">{row.vendorName}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-[var(--os-accent)] hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBillId(row.billId);
                      }}
                    >
                      {row.invoiceNumber}
                    </button>
                  </td>
                  <td className="px-3 py-2">{row.invoiceDate}</td>
                  <td className="px-3 py-2">{row.itemName}</td>
                  <td className="px-3 py-2 tabular-nums">{row.billQty}</td>
                  <td className="px-3 py-2 tabular-nums">{row.receivedQty}</td>
                  <td className="px-3 py-2 tabular-nums font-semibold text-[var(--os-accent)]">
                    {row.shortQty}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{row.rate}</td>
                  <td className="px-3 py-2 tabular-nums">{formatInr(row.expectedCredit)}</td>
                  <td className="px-3 py-2">{row.creditNoteNumber ?? "—"}</td>
                  <td className="px-3 py-2">{row.creditNoteDate ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2 text-xs">{row.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? (
            <p className="p-6 text-sm text-[var(--os-fg-muted-on-card)]">
              No register entries. Omissions appear when received qty is below bill qty on review.
            </p>
          ) : null}
        </div>

        <aside className="space-y-4 print:hidden">
          <div className="os-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
              AI insights
            </p>
            <ul className="mt-3 space-y-2 text-xs text-[var(--os-fg-on-card)]">
              {insights.map((i) => (
                <li key={i.id}>
                  <span className="font-semibold">{i.title}</span>
                  <p className="text-[var(--os-fg-muted-on-card)]">{i.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          {selectedRow ? (
            <ItemDetailPanel row={selectedRow} />
          ) : null}

          {vendorProfile ? (
            <VendorDetailPanel profile={vendorProfile} />
          ) : null}

          {billBundle ? (
            <BillHistoryPanel bundle={billBundle} />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function FilterInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-[var(--os-fg-muted)]" />
      <Input
        placeholder={placeholder}
        className="bg-white pl-8 text-zinc-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ItemDetailPanel({ row }: { row: CreditRegisterRow }) {
  return (
    <div className="os-card p-4 text-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
        Item history
      </p>
      <dl className="mt-2 space-y-1 text-[var(--os-fg-on-card)]">
        <Row label="Vendor" value={row.vendorName} />
        <Row label="Invoice" value={row.invoiceNumber} />
        <Row label="Item" value={row.itemName} />
        <Row label="Bill qty" value={String(row.billQty)} />
        <Row label="Received" value={String(row.receivedQty)} />
        <Row label="Short" value={String(row.shortQty)} />
        <Row label="Expected credit" value={formatInr(row.expectedCredit)} />
        <Row label="Actual credit" value={formatInr(row.actualCredit)} />
        <Row label="Balance" value={formatInr(row.balance)} />
        <Row
          label="Tracker"
          value={row.balance > 0 ? "Partial recovery" : "Settled"}
        />
      </dl>
      <div className="mt-3 flex flex-col gap-2">
        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link href={`/os/procurement/disputes/${row.disputeId}`}>Dispute detail</Link>
        </Button>
        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link href={`/os/procurement/invoice-history/${row.billId}`}>Invoice history</Link>
        </Button>
      </div>
    </div>
  );
}

function VendorDetailPanel({
  profile,
}: {
  profile: NonNullable<ReturnType<typeof getVendorCreditProfile>>;
}) {
  const d = profile.dispute;
  return (
    <div className="os-card p-4 text-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
        Vendor view
      </p>
      <p className="mt-1 font-semibold text-[var(--os-fg-on-card)]">{d.vendorName}</p>
      <dl className="mt-2 space-y-1">
        <Row label="Total purchases" value={formatInr(d.totalPurchases)} />
        <Row label="Credit notes" value={formatInr(d.totalCreditNotes)} />
        <Row label="Pending credits" value={String(d.pendingCredits)} />
        <Row label="Recovered" value={formatInr(d.recoveredCredits)} />
        <Row label="Recoverable" value={formatInr(d.pendingRecoverable)} />
        <Row label="Outstanding" value={formatInr(profile.outstanding)} />
      </dl>
      <Button size="sm" variant="outline" className="mt-3 w-full" asChild>
        <Link href="/os/procurement/vendor-ledger">Ledger impact</Link>
      </Button>
    </div>
  );
}

function BillHistoryPanel({
  bundle,
}: {
  bundle: NonNullable<ReturnType<typeof getBillHistoryBundle>>;
}) {
  return (
    <div className="os-card max-h-[420px] overflow-y-auto p-4 text-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
        Bill history · {bundle.bill.invoiceNumber}
      </p>
      <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">
        OCR preserved · {bundle.bill.status}
      </p>
      {bundle.editHistory.length ? (
        <div className="mt-3">
          <p className="font-semibold text-[var(--os-fg-on-card)]">Edit history</p>
          <ul className="mt-1 space-y-2 text-xs">
            {bundle.editHistory.map((h) => (
              <li key={h.id} className="rounded-lg bg-white/60 p-2">
                <strong>{h.itemName}</strong> — {h.userName}
                <br />
                {h.createdAt.slice(0, 16).replace("T", " ")}
                <br />
                Qty {h.originalQty} → {h.newQty} ({h.reason})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {bundle.omissions.length ? (
        <p className="mt-2 text-xs">
          {bundle.omissions.length} omission(s) ·{" "}
          {bundle.creditNotes.length} credit note(s)
        </p>
      ) : null}
      {bundle.revisions.length ? (
        <p className="mt-1 text-xs">{bundle.revisions.length} revision(s)</p>
      ) : null}
      {bundle.grn ? (
        <p className="mt-1 text-xs">GRN {bundle.grn.receiptStatus}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2">
        <Button size="sm" className="w-full" asChild>
          <Link href={`/os/procurement/invoice-history/${bundle.bill.id}`}>
            <FileText className="mr-1 h-3 w-3" />
            Full invoice history
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link href={`/os/procurement/purchase-bills/${bundle.bill.id}/review`}>
            Bill review
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[var(--os-fg-muted-on-card)]">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
