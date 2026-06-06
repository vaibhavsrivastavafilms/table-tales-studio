"use client";

import { useMemo, useState } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import BranchFilterBar from "@/components/os/BranchFilterBar";
import { PageHeader, StatCard } from "@/components/os/procurement/ProcurementUi";
import { getBranchName } from "@/lib/os/branches";
import {
  exportDailyMisFormats,
  generateDailyMis,
  yesterdayKey,
} from "@/lib/os/automation/daily-mis";
import { formatInr } from "@/lib/os/procurement/format";

function downloadText(content: string, filename: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DailyMisView() {
  const { db, activeBranchId, generateDailyMis: runDaily } = useProcurement();
  const [date, setDate] = useState(yesterdayKey());
  const branchName =
    activeBranchId === "all" ? "All branches" : getBranchName(db, activeBranchId);
  const report = useMemo(
    () => generateDailyMis(db, date, activeBranchId),
    [db, date, activeBranchId]
  );
  const exports = useMemo(
    () => exportDailyMisFormats(report, branchName),
    [report, branchName]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Automation"
        title="Daily Auto MIS"
        description="Yesterday sales, purchases, attendance, alerts, and profit estimate with export formats."
      />
      <BranchFilterBar />
      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => runDaily(date)}
          className="rounded-md bg-[var(--os-accent)] px-3 py-2 text-xs text-white"
        >
          Save report
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales" value={formatInr(report.sales)} />
        <StatCard label="Orders" value={String(report.ordersCount)} />
        <StatCard label="Purchases" value={formatInr(report.purchases)} />
        <StatCard label="Est. profit" value={formatInr(report.profitEstimate)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance" value={`${report.attendanceRate.toFixed(1)}%`} />
        <StatCard label="Food cost" value={`${report.foodCostPercent.toFixed(1)}%`} />
        <StatCard label="Labor est." value={formatInr(report.laborCostEst)} />
        <StatCard label="Expenses" value={formatInr(report.expensesTotal)} />
      </div>
      <section className="os-card p-5 text-sm">
        <h3 className="mb-3 font-semibold">WhatsApp summary</h3>
        <pre className="whitespace-pre-wrap rounded-md bg-[var(--os-bg-muted)] p-4 text-xs leading-relaxed">
          {exports.whatsappText}
        </pre>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={exports.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border px-3 py-1 text-xs"
          >
            WhatsApp
          </a>
          <a href={exports.emailUrl} className="rounded-full border px-3 py-1 text-xs">
            Email
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(exports.whatsappText)}
            className="rounded-full border px-3 py-1 text-xs"
          >
            Copy WhatsApp
          </button>
          <button
            type="button"
            onClick={() => downloadText(exports.csv, `daily-mis-${date}.csv`, "text/csv")}
            className="rounded-full border px-3 py-1 text-xs"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() =>
              downloadText(exports.excel, `daily-mis-${date}.xlsx`, "application/vnd.ms-excel")
            }
            className="rounded-full border px-3 py-1 text-xs"
          >
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => downloadText(exports.pdfText, `daily-mis-${date}.txt`)}
            className="rounded-full border px-3 py-1 text-xs"
          >
            Export PDF
          </button>
        </div>
      </section>
    </div>
  );
}
