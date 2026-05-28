"use client";

import { memo, useMemo } from "react";
import StoryPanel from "@/components/StoryPanel";
import { buildCreativeDirection } from "@/lib/creativeDirection";
import type { CreatorDirection } from "@/lib/creatorDirection";
import type { CreatorMemory } from "@/lib/creatorMemory";
import type { Captions } from "@/lib/slides";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualStoryBrief } from "@/lib/storyDirector";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import type { TemplateId } from "@/lib/templates";
import type { ViralHookMode } from "@/lib/viralHooks";
type CreatorDirectorPanelProps = {
  brief: VisualStoryBrief | null;
  analysis: VisualAnalysis | null;
  captions: Captions;
  templateId: TemplateId;
  creatorDirection: CreatorDirection;
  memory: Pick<
    CreatorMemory,
    "captionTone" | "nichePreference" | "viralMode" | "platformMode"
  >;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  loading?: boolean;
  isGenerating?: boolean;
  viralMode: ViralHookMode;
  onCaptionChange: (key: keyof Captions, value: string) => void;
  onCaptionsReplace: (next: Captions) => void;
};

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <p className="mt-0.5 text-[11px] font-medium leading-snug text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function CreatorDirectorPanel({
  brief,
  analysis,
  captions,
  templateId,
  creatorDirection,
  memory,
  styleReference,
  styleVision,
  loading,
  isGenerating,
  viralMode,
  onCaptionChange,
  onCaptionsReplace,
}: CreatorDirectorPanelProps) {
  const direction = useMemo(() => {
    if (!analysis) return null;
    return buildCreativeDirection({
      analysis,
      direction: creatorDirection,
      memory,
      templateId,
      styleReference,
      styleVision,
    });
  }, [
    analysis,
    creatorDirection,
    memory,
    styleReference,
    styleVision,
    templateId,
  ]);

  const retentionScore =
    brief?.confidence != null ? Math.round(brief.confidence * 100) : null;

  return (
    <aside className="studio-panel panel-scroll flex max-h-[calc(100vh-4rem)] flex-col gap-4 overflow-y-auto p-4 md:p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4c430]">
          AI director
        </p>
        <h2 className="mt-1 text-lg font-bold text-white">Story direction</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Your creative director explains the visual storytelling strategy in
          real time.
        </p>
      </div>

      {loading && (
        <p className="studio-shimmer text-xs text-zinc-500">
          Reading warmth, plating, and emotional tone from your uploads…
        </p>
      )}

      {!brief && !loading && (
        <p className="text-xs text-zinc-600">
          Upload food photos — direction appears as the AI art-directs your
          carousel.
        </p>
      )}

      {brief && (
        <div className="studio-glass space-y-3 rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-2">
            <Metric
              label="Cuisine"
              value={brief.cuisine ?? analysis?.cuisine ?? "Detecting…"}
            />
            <Metric label="Emotional tone" value={brief.mood} />
            <Metric
              label="Visual mood"
              value={brief.detectedStyle ?? brief.detectedTemplate}
            />
            <Metric
              label="Reference aesthetic"
              value={brief.referenceStyle ?? styleReference?.aesthetic ?? "—"}
            />
            <Metric label="Narrative angle" value={brief.narrativeAngle} />
            {retentionScore !== null && (
              <Metric
                label="Retention score"
                value={`${retentionScore} · ${direction?.retentionPattern.label ?? ""}`}
              />
            )}
            <Metric
              label="Carousel pacing"
              value={
                direction?.pacingStrategy ??
                brief.storyArc ??
                "Cinematic build"
              }
            />
          </div>

          {brief.hookStrategy && (
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                Generated hook
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {captions.hook || "—"}
              </p>
              <p className="mt-1 text-[10px] text-zinc-500">{brief.hookStrategy}</p>
            </div>
          )}

          {direction?.emotionalArc && (
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                Emotional payoff
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                {direction.emotionalArc}
              </p>
            </div>
          )}

          {direction?.ctaStyle && (
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                CTA direction
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">{direction.ctaStyle}</p>
            </div>
          )}

          {(brief.viewerPsychology || direction?.viewerPsychology) && (
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">
                Audience psychology
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                {brief.viewerPsychology ?? direction?.viewerPsychology}
              </p>
            </div>
          )}

          {brief.compositionNote && (
            <p className="text-[10px] text-zinc-500">
              <span className="text-zinc-600">Composition · </span>
              {brief.compositionNote}
            </p>
          )}
        </div>
      )}

      <StoryPanel
        captions={captions}
        onCaptionChange={onCaptionChange}
        onCaptionsReplace={onCaptionsReplace}
        isGenerating={isGenerating ?? false}
        viralMode={viralMode}
        compact
      />
    </aside>
  );
}

export default memo(CreatorDirectorPanel);
