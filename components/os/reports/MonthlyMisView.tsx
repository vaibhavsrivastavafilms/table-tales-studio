"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatCard,
} from "@/components/os/procurement/ProcurementUi";
import {
  buildMonthlyMisBreakdown,
  computeMonthlyMis,
  currentMonthKey,
} from "@/lib/os/reports/monthly-mis";
import type { OrgInsight } from "@/lib/os/procurement/types";

export default function MonthlyMisView() {
  const { db, addExpense } = useProcurement();
  const [month, setMonth] = useState(currentMonthKey());
  const mis = useMemo(() => computeMonthlyMis(db, month), [db, month]);
  const breakdown = useMemo(() => buildMonthlyMisBreakdown(db, month), [db, month]);
  const [insights, setInsights] = useState<OrgInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  useEffect(() => {
    fetch("/api/os/reports/monthly-mis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ db, month }),
    })
      .then((r) => r.json())
      .then((data: { insights?: OrgInsight[] }) => {
        if (data.insights) setInsights(data.insights);
      })
      .catch(() => setInsights([]));
  }, [db, month]);

  async function enhanceInsights() {
    setLoading(true);
    try {
      const res = await fetch("/api/os/reports/monthly-mis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ db, month, enhance: true }),
      });
      const data = (await res.json()) as { insights: OrgInsight[] };
      setInsights(data.insights ?? []);
    } finally {
      setLoading(false);
    }
  }

  function handleAddExpense() {
    if (!expenseDesc.trim() || !expenseAmount) return;
    addExpense({
      date: `${month}-01`,
      category: "Miscellaneous",
      vendorName: null,
      description: expenseDesc.trim(),
      amountRupees: Number(expenseAmount),
    });
    setExpenseDesc("");
    setExpenseAmount("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Management Dashboard"
        description="Monthly MIS combining sales, procurement, inventory, ledger, credit notes, attendance, payroll, and expenses."
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
        />
        <Button onClick={enhanceInsights} disabled={loading}>
          {loading ? "Generating…" : "Owner AI Insights"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Revenue" value={formatInr(mis.revenue)} hint={`${mis.salesCount} orders`} />
        <StatCard label="Food cost %" value={`${mis.foodCostPercent.toFixed(1)}%`} />
        <StatCard label="Labor cost %" value={`${mis.laborCostPercent.toFixed(1)}%`} />
        <StatCard label="Inventory value" value={formatInr(mis.inventoryValue)} />
        <StatCard label="Vendor outstanding" value={formatInr(mis.vendorOutstanding)} />
        <StatCard
          label="Est. profitability"
          value={`${mis.estimatedProfitMargin.toFixed(1)}%`}
          hint={formatInr(mis.estimatedProfit)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="os-card p-5 text-sm">
          <h3 className="font-semibold text-[var(--os-fg-on-card)]">Procurement & finance</h3>
          <ul className="mt-3 space-y-2 text-[var(--os-fg-muted-on-card)]">
            <li>Procurement spend: {formatInr(breakdown.sections.procurement.spend)}</li>
            <li>Credit notes applied: {formatInr(breakdown.sections.procurement.creditNotesApplied)}</li>
            <li>Operating expenses: {formatInr(breakdown.sections.finance.operatingExpenses)}</li>
            <li>Payroll: {formatInr(breakdown.sections.workforce.payrollCost)}</li>
          </ul>
        </section>
        <section className="os-card p-5 text-sm">
          <h3 className="font-semibold text-[var(--os-fg-on-card)]">Inventory & workforce</h3>
          <ul className="mt-3 space-y-2 text-[var(--os-fg-muted-on-card)]">
            <li>SKUs: {breakdown.sections.inventory.skuCount}</li>
            <li>Low stock: {breakdown.sections.inventory.lowStock}</li>
            <li>Headcount: {breakdown.sections.workforce.headcount}</li>
            <li>Attendance rate: {breakdown.sections.workforce.attendanceRate.toFixed(1)}%</li>
          </ul>
        </section>
      </div>

      <div className="os-card grid gap-3 p-5 md:grid-cols-3">
        <Input
          placeholder="Expense description"
          value={expenseDesc}
          onChange={(e) => setExpenseDesc(e.target.value)}
          className="bg-white/90 md:col-span-2"
        />
        <Input
          placeholder="Amount"
          value={expenseAmount}
          onChange={(e) => setExpenseAmount(e.target.value)}
          className="bg-white/90"
        />
        <Button onClick={handleAddExpense} className="md:col-span-3">
          Add Operating Expense
        </Button>
      </div>

      {insights.length ? (
        <section className="os-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--os-fg-on-card)]">
            Owner-level AI insights
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.map((ins) => (
              <div key={ins.id} className="rounded-lg border border-[var(--os-border)] p-3 text-sm">
                <p className="text-[10px] uppercase text-[var(--os-accent)]">{ins.module}</p>
                <p className="font-medium">{ins.title}</p>
                <p className="text-[var(--os-fg-muted-on-card)]">{ins.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
