"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import BranchFilterBar from "@/components/os/BranchFilterBar";
import { formatPaise, marginColorClass } from "@/lib/os/money";
import {
  compareBranchPnLSnapshots,
  generatePnLSnapshot,
} from "@/lib/os/reports/pnl-snapshot";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import type { PnlPeriod } from "@/lib/os/procurement/types";
import { cn } from "@/lib/utils";

export default function PnlView() {
  const { db, activeBranchId } = useProcurement();
  const [period, setPeriod] = useState<PnlPeriod>("monthly");
  const [periodStart, setPeriodStart] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const snapshot = useMemo(
    () => generatePnLSnapshot(db, activeBranchId, period, periodStart),
    [db, activeBranchId, period, periodStart]
  );

  const branches = useMemo(
    () => compareBranchPnLSnapshots(db, period, periodStart),
    [db, period, periodStart]
  );

  const waterfall = [
    { label: "Revenue", paise: snapshot.revenuePaise },
    { label: "Food Cost", paise: -snapshot.foodCostPaise },
    { label: "Gross Profit", paise: snapshot.grossProfitPaise },
    { label: "Labor Cost", paise: -snapshot.laborCostPaise },
    { label: "Expenses", paise: -snapshot.expensesPaise },
    { label: "Net Profit", paise: snapshot.netProfitPaise },
  ];

  function exportPdf() {
    const text = waterfall
      .map((r) => `${r.label}: ${formatPaise(Math.abs(r.paise))}`)
      .join("\n");
    const blob = new Blob([`P&L ${periodStart}\n\n${text}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pnl-${periodStart}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Profit & Loss"
        description="Revenue − Food Cost − Labor − Expenses = Net Profit"
      />
      <BranchFilterBar />
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
          value={period}
          onChange={(e) => setPeriod(e.target.value as PnlPeriod)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <input
          type={period === "monthly" ? "month" : "date"}
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
        />
        <Button variant="outline" size="sm" onClick={exportPdf}>
          Export PDF
        </Button>
      </div>

      <section className="os-card p-6">
        <h3 className="text-sm font-semibold">P&L statement</h3>
        <div className="mt-4 space-y-3">
          {waterfall.map((row) => (
            <div
              key={row.label}
              className={cn(
                "flex items-center justify-between border-b border-[var(--os-border)]/40 py-2 text-sm",
                row.label === "Net Profit" && "font-semibold"
              )}
            >
              <span>{row.label}</span>
              <span
                className={cn(
                  "tabular-nums",
                  row.label === "Net Profit" && marginColorClass(snapshot.netMargin)
                )}
              >
                {formatPaise(Math.abs(row.paise))}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[var(--os-fg-muted-on-card)]">
          Net margin {snapshot.netMargin.toFixed(1)}% · Food{" "}
          {snapshot.foodCostPct.toFixed(1)}% · Labor {snapshot.laborCostPct.toFixed(1)}%
        </p>
      </section>

      <section className="os-card overflow-x-auto p-5">
        <h3 className="mb-3 text-sm font-semibold">Branch comparison</h3>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--os-border)] text-left text-[var(--os-fg-muted-on-card)]">
              <th className="py-2 pr-4">Branch</th>
              <th className="py-2 pr-4 text-right">Revenue</th>
              <th className="py-2 pr-4 text-right">Net Profit</th>
              <th className="py-2 text-right">Margin</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(({ branchId, branchName, snapshot: s }) => (
              <tr key={branchId} className="border-b border-[var(--os-border)]/50">
                <td className="py-2 pr-4">{branchName}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {formatPaise(s.revenuePaise)}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {formatPaise(s.netProfitPaise)}
                </td>
                <td
                  className={cn(
                    "py-2 text-right tabular-nums",
                    marginColorClass(s.netMargin)
                  )}
                >
                  {s.netMargin.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
