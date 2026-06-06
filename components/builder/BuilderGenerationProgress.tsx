"use client";

import { memo } from "react";
import {
  STAGE_META,
  STORY_GENERATION_META,
  formatElapsedMs,
  type GenerationProgressSnapshot,
  type ExportGenerationStage,
  EXPORT_STAGE_META,
  exportPercent,
} from "@/lib/generationStages";
import {
  isUploadBusy,
  uploadUiPhaseLabel,
  uploadPhasePercent,
  type UploadUiPhase,
} from "@/lib/uploadState";

type BuilderGenerationProgressProps = {
  progress: GenerationProgressSnapshot;
  exportActive?: boolean;
  exportStage?: ExportGenerationStage;
  exportSlideRatio?: number;
  uploadPhase?: UploadUiPhase;
  storyGenerating?: boolean;
};

function BuilderGenerationProgress({
  progress,
  exportActive = false,
  exportStage = "preparing",
  exportSlideRatio = 0,
  uploadPhase = "idle",
  storyGenerating = false,
}: BuilderGenerationProgressProps) {
  const uploadBusy = isUploadBusy(uploadPhase);
  const showExport = exportActive;
  const showPipeline = progress.active && !showExport;
  const showUpload = uploadBusy && !showExport && !showPipeline;
  const showStory =
    storyGenerating && !showExport && !showPipeline && !showUpload;

  if (!showExport && !showPipeline && !showUpload && !showStory) {
    return null;
  }

  const meta = showExport
    ? {
        label: EXPORT_STAGE_META[exportStage].label,
        description: "Retina 1080×1350 · matches live preview",
        glow: "#f4c430",
      }
    : showUpload
      ? {
          label: uploadUiPhaseLabel(uploadPhase) ?? "Uploading…",
          description: "Preparing your food photos for the carousel",
          glow: "#facc15",
        }
      : showStory
        ? {
            label: STORY_GENERATION_META.label,
            description: STORY_GENERATION_META.description,
            glow: STORY_GENERATION_META.glow,
          }
        : STAGE_META[progress.stage];

  const percent = showExport
    ? exportPercent(exportStage, exportSlideRatio)
    : showUpload
      ? uploadPhasePercent(uploadPhase)
      : showStory
        ? STORY_GENERATION_META.percent
        : progress.displayPercent;

  const indeterminate = showUpload || showStory;
  const elapsed =
    showExport || showUpload || showStory ? undefined : formatElapsedMs(progress.elapsedMs);

  return (
    <div
      className="builder-gen-progress shrink-0 border-b border-white/[0.06]"
      role="region"
      aria-label="Generation progress"
    >
      <div className="flex items-start justify-between gap-3 px-4 py-2.5 md:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="builder-gen-pulse h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: meta.glow }}
              aria-hidden
            />
            <p className="truncate text-xs font-semibold tracking-tight text-white">
              {meta.label}
            </p>
          </div>
          <p className="mt-0.5 truncate text-[10px] text-zinc-500">
            {meta.description}
          </p>
        </div>
        <div className="flex shrink-0 items-baseline gap-2 tabular-nums">
          <span
            className="text-sm font-bold text-[#f4c430]"
            style={{ textShadow: `0 0 12px ${meta.glow}44` }}
            aria-hidden={indeterminate}
          >
            {indeterminate ? "…" : `${percent}%`}
          </span>
          {elapsed && (
            <span className="hidden text-[10px] text-zinc-600 md:inline">{elapsed}</span>
          )}
        </div>
      </div>

      <div
        className="builder-gen-track relative mx-4 mb-3 h-2 overflow-hidden rounded-full bg-white/[0.08] md:mx-6"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : percent}
        aria-valuetext={indeterminate ? meta.label : `${percent}%`}
        aria-busy={indeterminate || showPipeline}
      >
        <div
          className={`builder-gen-fill absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out ${
            indeterminate ? "builder-gen-indeterminate w-[42%]" : ""
          }`}
          style={
            indeterminate
              ? {
                  background: `linear-gradient(90deg, ${meta.glow}66, ${meta.glow})`,
                  boxShadow: `0 0 14px ${meta.glow}55`,
                }
              : {
                  width: `${percent}%`,
                  background: `linear-gradient(90deg, ${meta.glow}88, ${meta.glow})`,
                  boxShadow: `0 0 14px ${meta.glow}66`,
                }
          }
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
    prev.uploadPhase === next.uploadPhase &&
    prev.storyGenerating === next.storyGenerating &&
    prev.progress.active === next.progress.active &&
    prev.progress.stage === next.progress.stage &&
    prev.progress.displayPercent === next.progress.displayPercent &&
    prev.progress.targetPercent === next.progress.targetPercent
  );
});
