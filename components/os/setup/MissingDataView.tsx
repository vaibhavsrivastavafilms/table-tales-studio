"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { calculateBusinessReadiness } from "@/lib/os/platform/business-readiness";
import { ChevronRight } from "lucide-react";

function PrioritySection({
  title,
  items,
}: {
  title: string;
  items: ReturnType<typeof calculateBusinessReadiness>["missingHigh"];
}) {
  if (!items.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[#1B3A2D]">{title}</h2>
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={item.id}>
            <Link
              href={item.actionHref ?? "/os/setup-wizard"}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#1B3A2D]/15 bg-white p-4 transition hover:border-[#C9A84C] hover:shadow-md"
            >
              <div>
                <span className="mr-2 font-bold text-[#C9A84C]">{index + 1}.</span>
                <span className="font-semibold text-[#1B3A2D]">{item.title}</span>
                <p className="mt-1 text-sm text-[#1B3A2D]/70">
                  {item.askPrompt ?? item.message}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[#1B3A2D]" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function MissingDataView() {
  const { db } = useProcurement();
  const report = useMemo(() => calculateBusinessReadiness(db), [db]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Platform"
        title="Missing Data Center"
        description="Priority actions to reach 100% business readiness. The OS will not assume data exists."
      />

      <div className="os-card p-5">
        <p className="text-sm text-[var(--os-fg-muted-on-card)]">
          Overall completeness:{" "}
          <span className="font-bold text-[#1B3A2D]">{report.scores.overall}%</span>
        </p>
        <p className="mt-1 text-sm text-[#1B3A2D]/70">
          {report.missingHigh.length + report.missingMedium.length + report.missingLow.length}{" "}
          items still required for accurate MIS, food cost, and profitability.
        </p>
      </div>

      <PrioritySection title="High priority" items={report.missingHigh} />
      <PrioritySection title="Medium priority" items={report.missingMedium} />
      <PrioritySection title="Low priority" items={report.missingLow} />

      {!report.missingHigh.length &&
      !report.missingMedium.length &&
      !report.missingLow.length ? (
        <div className="os-card p-8 text-center text-[#1B3A2D]">
          All required data is present. Business readiness is at 100%.
        </div>
      ) : null}
    </div>
  );
}
