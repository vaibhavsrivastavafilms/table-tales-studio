"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import ProcurementRoleBar from "@/components/os/procurement/ProcurementRoleBar";
import {
  formatInr,
  PageHeader,
  StatCard,
} from "@/components/os/procurement/ProcurementUi";
import {
  computePaymentStats,
  listVendorPayments,
  summarizePaymentsByVendor,
} from "@/lib/os/procurement/payments";
import { getVendorOutstanding } from "@/lib/os/procurement/local-db";

export default function PaymentsView() {
  const { db, recordPayment } = useProcurement();
  const stats = useMemo(() => computePaymentStats(db), [db]);
  const payments = useMemo(() => listVendorPayments(db), [db]);
  const byVendor = useMemo(() => summarizePaymentsByVendor(db), [db]);
  const [vendorId, setVendorId] = useState(db.vendors[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const outstanding = vendorId ? getVendorOutstanding(db, vendorId) : 0;

  function handlePay() {
    if (!vendorId || !amount || !reference.trim()) return;
    recordPayment({
      vendorId,
      amount: Number(amount),
      paymentDate,
      reference: reference.trim(),
      note: null,
      createdBy: "user",
    });
    setAmount("");
    setReference("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Procurement"
          title="Vendor Payments"
          description="Record payments against vendor ledger. Outstanding updates automatically."
        />
        <ProcurementRoleBar />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total paid" value={formatInr(stats.totalPaid)} />
        <StatCard label="Paid this month" value={formatInr(stats.paidThisMonth)} />
        <StatCard label="Payment count" value={stats.paymentCount} />
      </div>

      <div className="os-card grid gap-3 p-5 md:grid-cols-2">
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm md:col-span-2"
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
        >
          {db.vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} · Outstanding {formatInr(getVendorOutstanding(db, v.id))}
            </option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-white/90"
        />
        <Input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="bg-white/90"
        />
        <Input
          placeholder="Reference / UTR"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="bg-white/90 md:col-span-2"
        />
        <p className="text-xs text-[var(--os-fg-muted-on-card)] md:col-span-2">
          Current outstanding: {formatInr(outstanding)}
        </p>
        <Button onClick={handlePay} className="md:col-span-2">
          Record Payment
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="os-card p-5">
          <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">
            Recent payments
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {payments.slice(0, 10).map((p) => (
              <li key={p.id} className="flex justify-between gap-4">
                <span>
                  {p.vendorName} · {p.reference}
                </span>
                <span className="font-medium">{formatInr(p.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="os-card p-5">
          <h3 className="text-sm font-semibold text-[var(--os-fg-on-card)]">
            By vendor
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {byVendor.map((v) => (
              <li key={v.vendorId} className="flex justify-between">
                <span>{v.vendorName}</span>
                <span>{formatInr(v.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
