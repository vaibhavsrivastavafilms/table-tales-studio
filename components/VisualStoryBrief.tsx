"use client";

import { memo } from "react";
import type { VisualStoryBrief as Brief } from "@/lib/storyDirector";

type VisualStoryBriefProps = {
  brief: Brief | null;
  loading?: boolean;
};

function VisualStoryBrief({ brief, loading }: VisualStoryBriefProps) {
  if (loading) {
    return (
      <p
        className="mb-3 text-[11px] text-zinc-500"
        aria-live="polite"
      >
        AI is reading your visuals…
      </p>
    );
  }

  if (!brief) return null;

  return (
    <div
      className="mb-3 rounded-xl border border-zinc-800/80 bg-black/25 px-3 py-2.5 ring-1 ring-white/5"
      aria-live="polite"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        AI direction
      </p>
      <ul className="mt-1.5 space-y-0.5 text-[11px] text-zinc-400">
        <li>
          <span className="text-zinc-600">Detected · </span>
          {brief.detectedTemplate}
        </li>
        <li>
          <span className="text-zinc-600">Narrative · </span>
          {brief.narrativeAngle}
        </li>
        <li>
          <span className="text-zinc-600">Mood · </span>
          {brief.mood}
        </li>
        {brief.referenceStyle && (
          <li>
            <span className="text-zinc-600">Reference · </span>
            {brief.referenceStyle}
          </li>
        )}
      </ul>
    </div>
  );
}

export default memo(VisualStoryBrief);
