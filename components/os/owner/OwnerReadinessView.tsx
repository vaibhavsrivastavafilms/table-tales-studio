"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { calculateBusinessReadiness } from "@/lib/os/platform/business-readiness";
import { cn } from "@/lib/utils";

const SCORE_ROWS: { key: keyof ReturnType<typeof calculateBusinessReadiness>["scores"]; label: string }[] = [
  { key: "procurement", label: "Procurement" },
  { key: "inventory", label: "Inventory" },
  { key: "recipes", label: "Recipes" },
  { key: "foodCost", label: "Food Cost" },
  { key: "sales", label: "Sales" },
  { key: "hr", label: "HR" },
  { key: "finance", label: "Finance" },
  { key: "profitability", label: "Profitability" },
];

function barBlocks(score: number): string {
  const filled = Math.round(score / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

export default function OwnerReadinessView() {
  const { db } = useProcurement();
  const report = useMemo(() => calculateBusinessReadiness(db), [db]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Owner"
        title="Business Readiness"
        description="Data completeness across procurement, recipes, HR, finance, and profitability."
      />

      <section className="os-card p-6 text-center">
        <p className="text-sm uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
          Overall Business Readiness
        </p>
        <p className="mt-2 text-5xl font-bold tabular-nums text-[#1B3A2D]">
          {report.scores.overall}%
        </p>
        <p className="mt-2 text-sm text-[#1B3A2D]/70">{report.overallLabel}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/os/setup-wizard"
            className="rounded-lg bg-[#1B3A2D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#153024]"
          >
            Complete setup
          </Link>
          <Link
            href="/os/missing-data"
            className="rounded-lg border-2 border-[#1B3A2D] px-4 py-2 text-sm font-semibold text-[#1B3A2D] hover:bg-[#1B3A2D]/5"
          >
            Missing data center
          </Link>
        </div>
      </section>

      <section className="os-card space-y-4 p-6 font-mono text-sm">
        {SCORE_ROWS.map(({ key, label }) => (
          <div key={key} className="flex flex-wrap items-center gap-3">
            <span className="w-28 shrink-0 text-[#1B3A2D]">{label}</span>
            <span className="text-[#C9A84C]">{barBlocks(report.scores[key])}</span>
            <span className="tabular-nums text-[#1B3A2D]">{report.scores[key]}%</span>
          </div>
        ))}
      </section>

      <section className="os-card overflow-x-auto p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#1B3A2D]">Branch readiness</h2>
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-[var(--os-fg-muted-on-card)]">
              <th className="pb-2 pr-4">Branch</th>
              <th className="pb-2 pr-4 text-right">Complete</th>
              <th className="pb-2">Top gaps</th>
            </tr>
          </thead>
          <tbody>
            {report.branchRows.map((row) => (
              <tr key={row.branchId} className="border-b border-[var(--os-border)]/40">
                <td className="py-3 pr-4 font-medium">{row.name}</td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  <span
                    className={cn(
                      row.overall >= 80 && "text-emerald-700",
                      row.overall >= 50 && row.overall < 80 && "text-amber-700",
                      row.overall < 50 && "text-red-700"
                    )}
                  >
                    {row.overall}%
                  </span>
                </td>
                <td className="py-3 text-[var(--os-fg-muted-on-card)]">
                  {row.gaps.length ? row.gaps.join(" · ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
