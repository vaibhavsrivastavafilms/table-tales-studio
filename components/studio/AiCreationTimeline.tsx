"use client";

import { memo, useMemo } from "react";

export type AiPipelineStatus =
  | "idle"
  | "loading"
  | "ready"
  | "partial"
  | "fallback";

type AiCreationTimelineProps = {
  isUploading: boolean;
  isDirecting: boolean;
  isGenerating: boolean;
  aiOverlayStatus?: AiPipelineStatus;
  hasImages: boolean;
};

type Step = {
  id: string;
  label: string;
  detail: string;
  active: boolean;
  done: boolean;
};

function AiCreationTimeline({
  isUploading,
  isDirecting,
  isGenerating,
  aiOverlayStatus = "idle",
  hasImages,
}: AiCreationTimelineProps) {
  const steps = useMemo((): Step[] => {
    const overlayActive =
      aiOverlayStatus === "loading" ||
      (hasImages && aiOverlayStatus !== "idle" && aiOverlayStatus !== "fallback");
    const overlayDone =
      aiOverlayStatus === "ready" || aiOverlayStatus === "partial";

    return [
      {
        id: "warmth",
        label: "Visual analysis",
        detail: "Warmth, composition, emotional tone",
        active: isDirecting || isUploading,
        done: hasImages && !isDirecting && !isUploading,
      },
      {
        id: "captions",
        label: "Editorial captions",
        detail: "Hook, pacing, sensory story beats",
        active: isGenerating || isDirecting,
        done: hasImages && !isGenerating && !isDirecting,
      },
      {
        id: "doodles",
        label: "Doodle & overlay layers",
        detail: "Hand-drawn art direction on your photos",
        active: overlayActive && !overlayDone,
        done: overlayDone,
      },
      {
        id: "layout",
        label: "Carousel composition",
        detail: "Template rhythm & typography placement",
        active: hasImages && (isDirecting || isGenerating),
        done: hasImages && !isDirecting && !isGenerating,
      },
    ];
  }, [
    aiOverlayStatus,
    hasImages,
    isDirecting,
    isGenerating,
    isUploading,
  ]);

  const headline = isUploading
    ? "Ingesting your food photography…"
    : isDirecting
      ? "AI analyzing warmth, composition, emotional tone…"
      : isGenerating
        ? "Writing cinematic story beats…"
        : aiOverlayStatus === "loading"
          ? "Rendering editorial doodles & overlays…"
          : hasImages
            ? "Art direction live on canvas"
            : "Drop photos to begin art direction";

  return (
    <div
      className="studio-glass mb-4 rounded-2xl border border-white/[0.06] px-4 py-3"
      aria-live="polite"
    >
      <p className="text-[11px] font-medium tracking-wide text-zinc-400">
        {headline}
      </p>
      <ul className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                step.done
                  ? "bg-[#f4c430]/25 text-[#f4c430]"
                  : step.active
                    ? "studio-pulse-ring bg-[#f4c430]/15 text-[#f4c430]"
                    : "bg-zinc-800 text-zinc-600"
              }`}
              aria-hidden
            >
              {step.done ? "✓" : step.active ? "·" : ""}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  step.active || step.done ? "text-zinc-300" : "text-zinc-600"
                }`}
              >
                {step.label}
              </p>
              <p className="text-[10px] text-zinc-600">{step.detail}</p>
              {step.active && (
                <div className="studio-progress mt-1.5 h-0.5 overflow-hidden rounded-full bg-zinc-800">
                  <div className="studio-progress-bar h-full w-2/5 rounded-full bg-gradient-to-r from-[#f4c430]/40 via-[#f4c430] to-[#f4c430]/40" />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(AiCreationTimeline);
