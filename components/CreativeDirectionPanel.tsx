"use client";

import { memo, useMemo, useState } from "react";
import type { VisualStoryBrief } from "@/lib/storyDirector";

type CreativeDirectionPanelProps = {
  brief: VisualStoryBrief | null;
};

function CreativeDirectionPanel({ brief }: CreativeDirectionPanelProps) {
  const [open, setOpen] = useState(false);
  const lines = useMemo(() => {
    if (!brief) return [];
    const out: string[] = [];
    if (brief.hookStrategy) out.push(`Strategy: ${brief.hookStrategy}`);
    if (brief.viewerPsychology) out.push(`Psychology: ${brief.viewerPsychology}`);
    if (brief.storyArc) out.push(`Arc: ${brief.storyArc}`);
    if (brief.reason) out.push(`Why: ${brief.reason}`);
    return out;
  }, [brief]);

  if (!lines.length) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 py-3 text-xs font-semibold text-zinc-400 transition hover:border-[#f7c600]/30 hover:text-[#f7c600]"
      >
        Creative direction · AI director notes
      </button>
    );
  }

  return (
    <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 ring-1 ring-white/5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f7c600]">Creative direction</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Collapse
        </button>
      </div>
      <ul className="space-y-2 text-xs leading-relaxed text-zinc-400">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export default memo(CreativeDirectionPanel);
