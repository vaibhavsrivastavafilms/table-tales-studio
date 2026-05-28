"use client";

import { memo } from "react";
import {
  formatElapsed,
  formatEta,
  type ExportTimelineSnapshot,
} from "@/lib/exportTimeline";
import { MOTION } from "@/lib/motion";

type ExportPipelineBarProps = {
  snapshot: ExportTimelineSnapshot | null;
};

function ExportPipelineBar({ snapshot }: ExportPipelineBarProps) {
  if (!snapshot || snapshot.phase === "idle") return null;

  const pct =
    snapshot.totalSlots > 0
      ? Math.min(
          100,
          Math.round((snapshot.currentSlot / snapshot.totalSlots) * 100)
        )
      : 0;

  const eta = formatEta(snapshot.estimatedRemainingMs);

  return (
    <div
      className="export-pipeline mb-4 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800"
      role="status"
      aria-live="polite"
    >
      <div className="h-1.5 overflow-hidden bg-zinc-800">
        <div
          className="export-pipeline-fill h-full bg-[#f7c600]"
          style={{
            width: `${pct}%`,
            transition: `width ${MOTION.durationSlow}ms ${MOTION.easingStandard}`,
          }}
        />
      </div>
      <div className="space-y-0.5 px-3 py-2">
        <p className="text-xs font-semibold text-zinc-300">
          {snapshot.pipelineLabel}
        </p>
        <p className="text-[10px] text-zinc-500">
          {formatElapsed(snapshot.elapsedMs)} elapsed
          {eta ? ` · ${eta}` : ""}
          {snapshot.exportedCount > 0
            ? ` · ${snapshot.exportedCount} rendered`
            : ""}
        </p>
      </div>
    </div>
  );
}

export default memo(ExportPipelineBar);
