"use client";

import { memo, useCallback } from "react";
import { QUICK_WORKFLOWS, type QuickWorkflowId } from "@/lib/quickWorkflows";
import { trackWorkflowUsage } from "@/lib/creatorMemory";

type QuickWorkflowsPanelProps = {
  onApply: (workflowId: QuickWorkflowId) => void;
  busy?: boolean;
};

function QuickWorkflowsPanel({ onApply, busy }: QuickWorkflowsPanelProps) {
  const handleClick = useCallback(
    (id: QuickWorkflowId, label: string) => {
      trackWorkflowUsage(id, label);
      onApply(id);
    },
    [onApply]
  );

  return (
    <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 ring-1 ring-white/5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        Quick workflows
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        One tap — template, hook tone, CTA, and pacing.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_WORKFLOWS.map((w) => (
          <button
            key={w.id}
            type="button"
            disabled={busy}
            title={w.description}
            onClick={() => handleClick(w.id, w.label)}
            className="btn-press rounded-full border border-[#f7c600]/20 bg-[#f7c600]/10 px-3 py-1.5 text-[11px] font-semibold text-[#f7c600] transition hover:bg-[#f7c600]/20 disabled:opacity-50"
          >
            {w.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default memo(QuickWorkflowsPanel);
