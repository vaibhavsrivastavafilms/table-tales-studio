"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { calculateBusinessReadiness } from "@/lib/os/platform/business-readiness";
import { generateMissingDataReport } from "@/lib/os/platform/missing-data-report";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronRight } from "lucide-react";

const CATEGORY_LABELS: { key: keyof import("@/lib/os/platform/business-readiness").BranchReadinessCategories; label: string }[] = [
  { key: "salesData", label: "Sales Data" },
  { key: "recipeData", label: "Recipe Costing" },
  { key: "ingredientCosts", label: "Ingredient Rates" },
  { key: "inventoryAccuracy", label: "Inventory Accuracy" },
  { key: "vendorData", label: "Vendor Data" },
  { key: "attendanceData", label: "Attendance Data" },
  { key: "payrollData", label: "Payroll Data" },
  { key: "wastageData", label: "Wastage Data" },
  { key: "expenseData", label: "Expense Data" },
];

function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 75) return "text-amber-800 bg-amber-50 border-amber-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
}

export default function BusinessReadinessView() {
  const { db } = useProcurement();
  const report = useMemo(() => calculateBusinessReadiness(db), [db]);
  const gaps = useMemo(() => generateMissingDataReport(db), [db]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Platform Intelligence"
        title="Business Readiness"
        description="Audit data completeness across every branch. Missing information blocks accurate food cost, profitability, and MIS."
      />

      <section className="os-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--os-fg-muted-on-card)]">Overall readiness</p>
            <p className="text-5xl font-bold tabular-nums text-[#1B3A2D]">{report.scores.overall}%</p>
            <p className="mt-1 text-sm text-[#1B3A2D]/70">{report.overallLabel}</p>
          </div>
          <Link
            href="/os/setup"
            className="rounded-lg bg-[#1B3A2D] px-4 py-2 text-sm font-semibold text-[#FDF6EC] hover:bg-[#153024]"
          >
            Complete setup wizard
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-[#1B3A2D]">Branch scoreboard</h2>
        {report.branchDetails.map((branch) => (
          <article key={branch.branchId} className="os-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--os-border)] bg-[#1B3A2D]/5 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[#1B3A2D]">{branch.shortName}</h3>
                <p className="text-sm text-[var(--os-fg-muted-on-card)]">{branch.name}</p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-bold tabular-nums",
                  scoreColor(branch.overall)
                )}
              >
                {branch.overall}/100
              </span>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORY_LABELS.map(({ key, label }) => (
                <div key={key} className="rounded-lg border border-[var(--os-border)] bg-white/60 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--os-fg-muted-on-card)]">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-[#1B3A2D]">
                    {branch.categories[key]}%
                  </p>
                </div>
              ))}
            </div>
            {branch.missing.length ? (
              <div className="border-t border-[var(--os-border)] px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#C9A84C]">Missing information</p>
                <ul className="mt-2 space-y-1 text-sm text-[#1B3A2D]/80">
                  {branch.missing.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      {m.title} — {m.message}
                      {m.actionHref ? (
                        <Link href={m.actionHref} className="ml-auto text-xs font-medium underline">
                          Fix
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <section className="os-card p-6">
        <h2 className="text-lg font-semibold text-[#1B3A2D]">Data gap detector</h2>
        <p className="mt-1 text-sm text-[var(--os-fg-muted-on-card)]">{gaps.summary}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-[var(--os-fg-muted-on-card)]">
                <th className="pb-2 pr-4">Priority</th>
                <th className="pb-2 pr-4">Gap</th>
                <th className="pb-2 pr-4">Impact</th>
                <th className="pb-2 pr-4">Module</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {gaps.gaps.map((gap) => (
                <tr key={gap.id} className="border-b border-[var(--os-border)]/60">
                  <td className="py-3 pr-4 capitalize">{gap.priority}</td>
                  <td className="py-3 pr-4 font-medium">{gap.title}</td>
                  <td className="py-3 pr-4 text-[var(--os-fg-muted-on-card)]">{gap.impact}</td>
                  <td className="py-3 pr-4">{gap.affectedModule}</td>
                  <td className="py-3">
                    {gap.actionHref ? (
                      <Link
                        href={gap.actionHref}
                        className="inline-flex items-center gap-1 font-medium text-[#1B3A2D] hover:underline"
                      >
                        {gap.recommendedAction}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      gap.recommendedAction
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
