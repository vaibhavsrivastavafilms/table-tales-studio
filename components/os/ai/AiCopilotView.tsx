"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import {
  answerOwnerQuestion,
  COPILOT_STARTER_QUESTIONS,
} from "@/lib/os/ai/copilot-engine";
import { Sparkles } from "lucide-react";

export default function AiCopilotView() {
  const { db } = useProcurement();
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<{ q: string; a: string; citations: string[] }[]>([]);

  const ask = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const response = answerOwnerQuestion(db, trimmed);
    setHistory((prev) => [
      { q: trimmed, a: response.answer, citations: response.citations },
      ...prev,
    ]);
    setQuestion("");
  };

  const suggestions = useMemo(() => COPILOT_STARTER_QUESTIONS, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <PageHeader
        eyebrow="Executive AI"
        title="AI Copilot"
        description="Ask questions about profitability, food cost, vendors, workforce, and missing data — answered from live business data."
      />

      <section className="os-card p-5">
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(question)}
            placeholder="Which branch is most profitable this month?"
            className="bg-white/90"
          />
          <Button
            onClick={() => ask(question)}
            className="shrink-0 bg-[#1B3A2D] hover:bg-[#153024]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Ask
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rounded-full border border-[var(--os-border)] px-3 py-1 text-xs hover:bg-[#1B3A2D]/5"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        {history.map((entry, idx) => (
          <article key={`${entry.q}-${idx}`} className="space-y-3">
            <div className="rounded-xl bg-[#1B3A2D] px-4 py-3 text-sm text-[#FDF6EC]">{entry.q}</div>
            <div className="os-card p-4 text-sm leading-relaxed text-[#1B3A2D]">{entry.a}</div>
            {entry.citations.length ? (
              <p className="text-xs text-[var(--os-fg-muted-on-card)]">
                Sources: {entry.citations.join(" · ")}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
