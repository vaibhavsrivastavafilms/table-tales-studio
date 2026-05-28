"use client";

import { memo, type MutableRefObject } from "react";
import PreviewPanel from "@/components/PreviewPanel";
import AiCreationTimeline, {
  type AiPipelineStatus,
} from "@/components/studio/AiCreationTimeline";
import type { Captions } from "@/lib/slides";
import { DEFAULT_BRAND_KIT, type BrandKit } from "@/lib/brandKit";
import type { AiSlideDesign } from "@/lib/aiOverlayRenderer";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { TemplateId } from "@/lib/templates";

type CreatorLiveCanvasProps = {
  images: string[];
  captions: Captions;
  templateId: TemplateId;
  slideRefs: MutableRefObject<(HTMLElement | null)[]>;
  brandKit?: BrandKit;
  showWatermark?: boolean;
  storyMood?: string;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  getAiDesign?: (slideIndex: number) => AiSlideDesign | null;
  onOpenStoryboard?: () => void;
  isUploading: boolean;
  isDirecting: boolean;
  isGenerating: boolean;
  aiOverlayStatus?: AiPipelineStatus;
};

function CreatorLiveCanvas({
  images,
  captions,
  templateId,
  slideRefs,
  brandKit,
  showWatermark,
  storyMood,
  styleReference,
  styleVision,
  getAiDesign,
  onOpenStoryboard,
  isUploading,
  isDirecting,
  isGenerating,
  aiOverlayStatus,
}: CreatorLiveCanvasProps) {
  const hasImages = images.length > 0;

  return (
    <section className="studio-canvas flex min-h-0 flex-1 flex-col p-4 md:p-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f4c430]">
            Live AI canvas
          </p>
          <h2 className="text-xl font-bold text-white md:text-2xl">
            {hasImages ? "Carousel in production" : "Your storyboard awaits"}
          </h2>
        </div>
        {hasImages && onOpenStoryboard && (
          <button
            type="button"
            onClick={onOpenStoryboard}
            className="shrink-0 rounded-full border border-[#f4c430]/30 bg-[#f4c430]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#f4c430] transition hover:bg-[#f4c430]/20"
          >
            Fullscreen
          </button>
        )}
      </div>

      <AiCreationTimeline
        isUploading={isUploading}
        isDirecting={isDirecting}
        isGenerating={isGenerating}
        aiOverlayStatus={aiOverlayStatus}
        hasImages={hasImages}
      />

      <div className="studio-canvas-stage relative min-h-0 flex-1 overflow-hidden rounded-2xl ring-1 ring-white/[0.08]">
        <div className="studio-canvas-glow pointer-events-none absolute inset-0" aria-hidden />
        {!hasImages ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center md:min-h-[420px]">
            <p className="text-4xl opacity-40" aria-hidden>
              ◈
            </p>
            <p className="mt-4 max-w-sm text-sm font-medium text-zinc-400">
              Drop food photos on the left — AI will art-direct doodles, overlays,
              captions, and editorial typography here in real time.
            </p>
          </div>
        ) : (
          <div className="h-full overflow-hidden p-2 md:p-4">
            <PreviewPanel
              images={images}
              captions={captions}
              templateId={templateId}
              slideRefs={slideRefs}
              showWatermark={showWatermark}
              brandKit={brandKit ?? DEFAULT_BRAND_KIT}
              storyMood={storyMood}
              styleReference={styleReference}
              styleVision={styleVision}
              getAiDesign={getAiDesign}
              onOpenStoryboard={onOpenStoryboard}
              studioMode
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(CreatorLiveCanvas);
