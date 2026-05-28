"use client";

import { memo, useMemo, type MutableRefObject } from "react";
import CarouselSlide from "@/components/CarouselSlide";
import EmptyState from "@/components/EmptyState";
import { SLIDE_KEYS, SLIDE_COUNT, type Captions } from "@/lib/slides";
import { DEFAULT_BRAND_KIT, resolveWatermarkText, type BrandKit } from "@/lib/brandKit";
import type { AiSlideDesign } from "@/lib/aiOverlayRenderer";
import type { SlideEditorPrefs } from "@/lib/slideEditorPrefs";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { TemplateId } from "@/lib/templates";

type BuilderPreviewProps = {
  images: string[];
  captions: Captions;
  templateId: TemplateId;
  slideRefs: MutableRefObject<(HTMLElement | null)[]>;
  selectedIndex: number;
  onSelectSlide: (index: number) => void;
  showWatermark?: boolean;
  brandKit?: BrandKit;
  storyMood?: string;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  getAiDesign?: (slideIndex: number) => AiSlideDesign | null;
  getSlidePrefs?: (slideIndex: number) => SlideEditorPrefs;
};

function BuilderPreview({
  images,
  captions,
  templateId,
  slideRefs,
  selectedIndex,
  onSelectSlide,
  showWatermark,
  brandKit,
  storyMood,
  styleReference,
  styleVision,
  getAiDesign,
  getSlidePrefs,
}: BuilderPreviewProps) {
  const watermark = resolveWatermarkText(
    brandKit ?? DEFAULT_BRAND_KIT,
    showWatermark ?? false
  );

  const slides = useMemo(
    () =>
      SLIDE_KEYS.map((key, i) => ({
        key,
        image: images[i] ?? images[images.length - 1] ?? images[0] ?? "",
        text: captions[key],
        index: i + 1,
      })),
    [images, captions]
  );

  return (
    <section className="builder-preview flex min-h-0 flex-1 flex-col p-4 md:p-6">
      {images.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/[0.06] bg-black/20">
          <EmptyState
            icon="📷"
            title="Upload photos to preview your carousel"
            description="Choose a template, add food images, then generate or edit captions."
          />
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {SLIDE_COUNT} slides · swipe to browse
            </p>
            <p className="text-xs font-semibold text-[#f4c430]">
              Slide {selectedIndex + 1}
            </p>
          </div>
          <div className="carousel-scroll flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                onClick={() => onSelectSlide(i)}
                className={`shrink-0 snap-center rounded-2xl transition-all duration-300 ${
                  i === selectedIndex
                    ? "ring-2 ring-[#f4c430] scale-[1.02]"
                    : "opacity-75 ring-1 ring-white/10 hover:opacity-100"
                }`}
              >
                <CarouselSlide
                  ref={(el) => {
                    slideRefs.current[i] = el;
                  }}
                  image={slide.image}
                  text={slide.text}
                  index={slide.index}
                  templateId={templateId}
                  brandKit={brandKit}
                  watermarkText={watermark}
                  storyMood={storyMood}
                  styleReference={styleReference}
                  styleVision={styleVision}
                  aiDesign={getAiDesign?.(slide.index) ?? null}
                  slidePrefs={getSlidePrefs?.(slide.index)}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default memo(BuilderPreview);
