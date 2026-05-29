"use client";

import { memo } from "react";
import {
  STAGE_META,
  formatElapsedMs,
  type GenerationProgressSnapshot,
  type ExportGenerationStage,
  EXPORT_STAGE_META,
  exportPercent,
} from "@/lib/generationStages";

type BuilderGenerationProgressProps = {
  progress: GenerationProgressSnapshot;
  exportActive?: boolean;
  exportStage?: ExportGenerationStage;
  exportSlideRatio?: number;
};

function BuilderGenerationProgress({
  progress,
  exportActive = false,
  exportStage = "preparing",
  exportSlideRatio = 0,
}: BuilderGenerationProgressProps) {
  const showPipeline = progress.active;
  const showExport = exportActive;
  if (!showPipeline && !showExport) return null;

  const meta = showExport
    ? {
        label: EXPORT_STAGE_META[exportStage].label,
        description: "Retina 1080×1350 · matches live preview",
        glow: "#f4c430",
      }
    : STAGE_META[progress.stage];

  const percent = showExport
    ? exportPercent(exportStage, exportSlideRatio)
    : progress.displayPercent;

  const elapsed = showExport ? undefined : formatElapsedMs(progress.elapsedMs);

  return (
    <div className="builder-gen-progress shrink-0 border-b border-white/[0.06]">
      <div className="flex items-start justify-between gap-3 px-4 py-2 md:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="builder-gen-pulse h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: meta.glow }}
              aria-hidden
            />
            <p className="truncate text-[11px] font-semibold tracking-tight text-white md:text-xs">
              {meta.label}
            </p>
          </div>
          <p className="mt-0.5 hidden truncate text-[10px] text-zinc-500 sm:block">
            {meta.description}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-zinc-500 sm:hidden">
            {meta.label} · {percent}%
          </p>
        </div>
        <div className="flex shrink-0 items-baseline gap-2 tabular-nums">
          <span
            className="text-xs font-bold text-[#f4c430]"
            style={{ textShadow: `0 0 12px ${meta.glow}44` }}
          >
            {percent}%
          </span>
          {elapsed && (
            <span className="hidden text-[10px] text-zinc-600 md:inline">
              {elapsed}
            </span>
          )}
        </div>
      </div>

      <div className="builder-gen-track relative mx-4 mb-2 h-[2px] overflow-hidden rounded-full bg-white/[0.06] md:mx-6">
        <div
          className="builder-gen-fill absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${meta.glow}88, ${meta.glow})`,
            boxShadow: `0 0 12px ${meta.glow}66`,
          }}
        />
        <div className="builder-gen-shimmer pointer-events-none absolute inset-0" aria-hidden />
      </div>
    </div>
  );
}

export default memo(BuilderGenerationProgress, (prev, next) => {
  return (
    prev.exportActive === next.exportActive &&
    prev.exportStage === next.exportStage &&
    prev.exportSlideRatio === next.exportSlideRatio &&
    prev.progress.active === next.progress.active &&
    prev.progress.stage === next.progress.stage &&
    prev.progress.displayPercent === next.progress.displayPercent &&
    prev.progress.targetPercent === next.progress.targetPercent
  );
});
