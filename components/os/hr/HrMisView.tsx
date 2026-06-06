"use client";

import { useEffect, useMemo, useState } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { generateHrInsights } from "@/lib/os/reports/hr-mis";
import { currentMonthKey } from "@/lib/os/reports/monthly-mis";
import type { OrgInsight } from "@/lib/os/procurement/types";

export default function HrMisView() {
  const { db } = useProcurement();
  const [month, setMonth] = useState(currentMonthKey());
  const baseline = useMemo(() => generateHrInsights(db, month), [db, month]);
  const [insights, setInsights] = useState<OrgInsight[]>(baseline);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInsights(baseline);
  }, [baseline]);

  async function refreshAi() {
    setLoading(true);
    try {
      const res = await fetch("/api/os/reports/hr-mis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ db, month }),
      });
      const data = (await res.json()) as { insights: OrgInsight[] };
      setInsights(data.insights?.length ? data.insights : baseline);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="HR"
        title="HR MIS"
        description="Workforce alerts — attendance, overtime, payroll approval, and Flip Office sync status."
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={refreshAi}
          disabled={loading}
          className="rounded-md bg-[var(--os-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Analyzing…" : "Enhance with AI"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {insights.map((ins) => (
          <div key={ins.id} className="os-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--os-accent)]">
              {ins.module}
            </p>
            <h3 className="mt-1 font-semibold text-[var(--os-fg-on-card)]">{ins.title}</h3>
            <p className="mt-2 text-sm text-[var(--os-fg-muted-on-card)]">{ins.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
