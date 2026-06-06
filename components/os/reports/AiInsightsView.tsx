"use client";

import { useEffect, useMemo, useState } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { generateOrgInsights } from "@/lib/os/reports/ai-insights";
import { currentMonthKey } from "@/lib/os/reports/monthly-mis";
import type { OrgInsight } from "@/lib/os/procurement/types";

export default function AiInsightsView() {
  const { db } = useProcurement();
  const month = currentMonthKey();
  const baseline = useMemo(() => generateOrgInsights(db, month), [db, month]);
  const [insights, setInsights] = useState<OrgInsight[]>(baseline);
  const [source, setSource] = useState<"rules" | "openai" | "error">("rules");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInsights(baseline);
  }, [baseline]);

  async function enhanceWithAi() {
    setLoading(true);
    try {
      const res = await fetch("/api/os/reports/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ db, month }),
      });
      const data = (await res.json()) as {
        insights: OrgInsight[];
        source: "rules" | "openai" | "error";
      };
      setInsights(data.insights?.length ? data.insights : baseline);
      setSource(data.source ?? "rules");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="AI Insights"
        description="Cross-module alerts for disputes, recovery, stock variance, food cost, and purchasing."
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={enhanceWithAi}
          disabled={loading}
          className="rounded-md bg-[var(--os-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Analyzing…" : "Refresh with AI"}
        </button>
        <span className="text-xs text-[var(--os-fg-muted)]">Source: {source}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className={`os-card p-4 ${
              ins.severity === "critical"
                ? "border-red-500/30"
                : ins.severity === "warning"
                  ? "border-amber-500/30"
                  : ""
            }`}
          >
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
