"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import {
  calculateBusinessReadiness,
  type ReadinessCheckItem,
} from "@/lib/os/platform/business-readiness";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-[#1B3A2D]/10", className)}>
      <div
        className="h-full rounded-full bg-[#1B3A2D] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function ChecklistCard({
  item,
  onAnswer,
}: {
  item: ReadinessCheckItem;
  onAnswer?: (questionId: string, value: string) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        item.complete
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-[#C9A84C]/40 bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        {item.complete ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#1B3A2D]">{item.title}</p>
          <p className="mt-1 text-sm text-[#1B3A2D]/70">{item.message}</p>
          {!item.complete && item.askPrompt ? (
            <p className="mt-2 text-sm font-medium text-[#1B3A2D]">{item.askPrompt}</p>
          ) : null}
          {item.affectedMetrics.length ? (
            <p className="mt-2 text-xs text-[#1B3A2D]/60">
              Affects: {item.affectedMetrics.join(" · ")}
            </p>
          ) : null}
          {!item.complete && item.actionHref ? (
            <Button
              asChild
              size="sm"
              className="mt-3 bg-[#1B3A2D] text-white hover:bg-[#153024]"
            >
              <Link href={item.actionHref}>
                {item.actionLabel ?? "Fix now"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function SetupWizardView() {
  const { db } = useProcurement();
  const report = useMemo(() => calculateBusinessReadiness(db), [db]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function saveAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Platform"
        title="Restaurant Intelligence Setup"
        description="Complete these steps to unlock live calculations across food cost, profitability, inventory, and MIS."
      />

      <section className="os-card space-y-4 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--os-fg-muted-on-card)]">Overall readiness</p>
            <p className="text-4xl font-bold tabular-nums text-[#1B3A2D]">
              {report.scores.overall}%
            </p>
            <p className="text-sm text-[#1B3A2D]/70">{report.overallLabel}</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/os/owner/readiness">Owner readiness view</Link>
          </Button>
        </div>
        <ProgressBar value={report.scores.overall} />
      </section>

      {report.checklists.map((checklist) => (
        <section key={checklist.id} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-[#1B3A2D]">{checklist.title}</h2>
              <p className="text-sm text-[#1B3A2D]/70">{checklist.description}</p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-[#1B3A2D]">
              {checklist.score}%
            </span>
          </div>
          <ProgressBar value={checklist.score} />
          <div className="grid gap-3">
            {checklist.items.map((item) => (
              <ChecklistCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}

      {report.smartQuestions.length ? (
        <section className="os-card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-[#1B3A2D]">Smart questions</h2>
          <p className="text-sm text-[var(--os-fg-muted-on-card)]">
            Help Table Tales OS tailor workflows to how you operate.
          </p>
          {report.smartQuestions.map((q) => (
            <div key={q.id} className="rounded-xl border border-[var(--os-border)] p-4">
              <p className="font-medium text-[#1B3A2D]">{q.question}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => saveAnswer(q.id, opt.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      answers[q.id] === opt.value
                        ? "border-[#1B3A2D] bg-[#1B3A2D] text-white"
                        : "border-[#1B3A2D]/30 bg-white text-[#1B3A2D] hover:bg-[#1B3A2D]/5"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
