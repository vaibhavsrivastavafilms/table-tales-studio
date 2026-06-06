"use client";

import { useEffect, useMemo, useState } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import BranchFilterBar from "@/components/os/BranchFilterBar";
import { formatInr, PageHeader, StatCard } from "@/components/os/procurement/ProcurementUi";
import { marginColorClass } from "@/lib/os/money";
import {
  buildBranchComparisonPnL,
  buildExecutiveSummary,
  buildExpenseSummaryTable,
  buildProfitabilitySummary,
  computeMonthlyMis,
  currentMonthKey,
} from "@/lib/os/reports/monthly-mis";
import { cn } from "@/lib/utils";

export default function MonthlyMisExecutiveView() {
  const { db, activeBranchId } = useProcurement();
  const [month, setMonth] = useState(currentMonthKey());
  const mis = useMemo(() => computeMonthlyMis(db, month, activeBranchId), [db, month, activeBranchId]);
  const executive = useMemo(
    () => buildExecutiveSummary(db, month, activeBranchId),
    [db, month, activeBranchId]
  );
  const expenseRows = useMemo(
    () => buildExpenseSummaryTable(db, month, activeBranchId),
    [db, month, activeBranchId]
  );
  const expenseTotals = useMemo(
    () =>
      expenseRows.reduce(
        (acc, r) => ({
          budget: acc.budget + r.budget,
          actual: acc.actual + r.actual,
          variance: acc.variance + r.variance,
        }),
        { budget: 0, actual: 0, variance: 0 }
      ),
    [expenseRows]
  );
  const profitability = useMemo(
    () => buildProfitabilitySummary(db, month, activeBranchId),
    [db, month, activeBranchId]
  );
  const branchComparison = useMemo(() => buildBranchComparisonPnL(db, month), [db, month]);
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    fetch("/api/os/reports/monthly-mis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ db, month, branchId: activeBranchId, enhance: true }),
    })
      .then((r) => r.json())
      .then((data: { executiveSummary?: string; insights?: { title: string; detail: string }[] }) => {
        const text =
          data.executiveSummary ??
          data.insights?.map((i) => `${i.title}: ${i.detail}`).join("\n") ??
          "";
        setAiSummary(text);
      })
      .catch(() => setAiSummary(""));
  }, [db, month, activeBranchId]);

  const sections = [
    ["Sales", executive.salesSummary],
    ["Procurement", executive.procurementSummary],
    ["Inventory", executive.inventorySummary],
    ["Vendor", executive.vendorSummary],
    ["Food cost", executive.foodCostSummary],
    ["Labor", executive.laborCostSummary],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Monthly Management MIS"
        description="Executive summary across sales, procurement, inventory, workforce, and profitability."
      />
      <BranchFilterBar />
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatInr(mis.revenue)} />
        <StatCard label="Food cost %" value={`${mis.foodCostPercent.toFixed(1)}%`} />
        <StatCard label="Labor cost %" value={`${mis.laborCostPercent.toFixed(1)}%`} />
        <StatCard label="Est. margin" value={`${mis.estimatedProfitMargin.toFixed(1)}%`} />
      </div>
      <section className="os-card p-5">
        <h3 className="text-sm font-semibold">Executive summary</h3>
        <p className="mt-2 text-sm text-[var(--os-fg-muted-on-card)]">{executive.executiveSummary}</p>
        {aiSummary ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--os-fg-muted-on-card)]">
            {aiSummary.split("\n").filter(Boolean).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="os-card overflow-x-auto p-5">
        <h3 className="text-sm font-semibold">Expense summary</h3>
        <table className="mt-4 w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-[var(--os-fg-muted)]">
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Budget</th>
              <th className="py-2 pr-4">Actual</th>
              <th className="py-2 pr-4">Variance</th>
              <th className="py-2">% of Revenue</th>
            </tr>
          </thead>
          <tbody>
            {expenseRows.map((row) => (
              <tr key={row.category} className="border-b border-[var(--os-border)]/40">
                <td className="py-2 pr-4">{row.category}</td>
                <td className="py-2 pr-4 tabular-nums">{formatInr(row.budget)}</td>
                <td className="py-2 pr-4 tabular-nums">{formatInr(row.actual)}</td>
                <td
                  className={cn(
                    "py-2 pr-4 tabular-nums",
                    row.variance > 0 ? "text-red-700" : "text-emerald-700"
                  )}
                >
                  {formatInr(row.variance)}
                </td>
                <td className="py-2 tabular-nums">{row.pctOfRevenue.toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2 pr-4">Total</td>
              <td className="py-2 pr-4 tabular-nums">{formatInr(expenseTotals.budget)}</td>
              <td className="py-2 pr-4 tabular-nums">{formatInr(expenseTotals.actual)}</td>
              <td className="py-2 pr-4 tabular-nums">{formatInr(expenseTotals.variance)}</td>
              <td className="py-2 tabular-nums">
                {mis.revenue > 0 ? ((expenseTotals.actual / mis.revenue) * 100).toFixed(1) : "0.0"}%
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="os-card overflow-x-auto p-5">
        <h3 className="text-sm font-semibold">Profitability summary</h3>
        <table className="mt-4 w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-[var(--os-fg-muted)]">
              <th className="py-2 pr-4">Line</th>
              <th className="py-2 pr-4">Amount (₹)</th>
              <th className="py-2 pr-4">% Revenue</th>
              <th className="py-2 pr-4">Prior month (₹)</th>
              <th className="py-2">Prior %</th>
            </tr>
          </thead>
          <tbody>
            {profitability.map((row) => (
              <tr key={row.label} className="border-b border-[var(--os-border)]/40">
                <td className="py-2 pr-4">{row.label}</td>
                <td className="py-2 pr-4 tabular-nums">{formatInr(row.amount)}</td>
                <td
                  className={cn(
                    "py-2 pr-4 tabular-nums",
                    row.label === "Net Profit" && marginColorClass(row.pctOfRevenue)
                  )}
                >
                  {row.pctOfRevenue.toFixed(1)}%
                </td>
                <td className="py-2 pr-4 tabular-nums">{formatInr(row.priorAmount)}</td>
                <td className="py-2 tabular-nums">{row.priorPct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="os-card overflow-x-auto p-5">
        <h3 className="text-sm font-semibold">Branch comparison</h3>
        <table className="mt-4 w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-[var(--os-fg-muted)]">
              <th className="py-2 pr-4">Branch</th>
              <th className="py-2 pr-4">Revenue</th>
              <th className="py-2 pr-4">Food cost</th>
              <th className="py-2 pr-4">Labor</th>
              <th className="py-2 pr-4">Expenses</th>
              <th className="py-2 pr-4">Net profit</th>
              <th className="py-2">Margin</th>
            </tr>
          </thead>
          <tbody>
            {branchComparison.map((b) => (
              <tr key={b.branchId} className="border-b border-[var(--os-border)]/40">
                <td className="py-2 pr-4">{b.name}</td>
                <td className="py-2 pr-4 tabular-nums">{formatInr(b.revenue)}</td>
                <td className="py-2 pr-4 tabular-nums">
                  {formatInr(b.foodCost)} ({b.foodCostPct.toFixed(1)}%)
                </td>
                <td className="py-2 pr-4 tabular-nums">
                  {formatInr(b.laborCost)} ({b.laborCostPct.toFixed(1)}%)
                </td>
                <td className="py-2 pr-4 tabular-nums">{formatInr(b.expenses)}</td>
                <td className="py-2 pr-4 tabular-nums">{formatInr(b.netProfit)}</td>
                <td className={cn("py-2 tabular-nums", marginColorClass(b.netMargin))}>
                  {b.netMargin.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(([title, text]) => (
          <section key={title} className="os-card p-4 text-sm">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-[var(--os-fg-muted-on-card)]">{text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
