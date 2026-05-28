"use client";

import { memo, useMemo, type MutableRefObject } from "react";
import CarouselSlide from "@/components/CarouselSlide";
import EmptyState from "@/components/EmptyState";
import { SLIDE_KEYS, type Captions } from "@/lib/slides";
import { DEFAULT_BRAND_KIT, resolveWatermarkText, type BrandKit } from "@/lib/brandKit";
import type { SlideArtDirection } from "@/lib/slideArtDirector";
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
  getArtDirection?: (slideIndex: number) => SlideArtDirection | null;
  getSlidePrefs?: (slideIndex: number) => SlideEditorPrefs;
  pipelineStatus?: "idle" | "loading" | "ready" | "partial" | "fallback";
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
  getArtDirection,
  getSlidePrefs,
  pipelineStatus = "idle",
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

  const selected = slides[selectedIndex] ?? slides[0];
  const slideProps = (slide: (typeof slides)[0]) => ({
    image: slide.image,
    text: slide.text,
    index: slide.index,
    templateId,
    brandKit,
    watermarkText: watermark,
    storyMood,
    styleReference,
    styleVision,
    artDirection: getArtDirection?.(slide.index) ?? null,
    aiDesign: getArtDirection?.(slide.index)?.aiOverlay ?? null,
    slidePrefs: getSlidePrefs?.(slide.index),
  });

  const statusLabel =
    pipelineStatus === "loading"
      ? "Art directing…"
      : pipelineStatus === "ready"
        ? "Carousel ready"
        : pipelineStatus === "partial"
          ? "Partial AI layers"
          : pipelineStatus === "fallback"
            ? "Procedural art direction"
            : null;

  return (
    <section className="builder-preview flex min-h-0 flex-1 flex-col">
      {images.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState
            icon="◈"
            title="Upload food photos to begin"
            description="AI will redesign layout, typography, doodles, and emotional pacing — no templates, just art direction."
          />
        </div>
      ) : (
        <>
          <div className="flex shrink-0 items-center justify-between px-4 pt-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Live storyboard
            </p>
            <div className="flex items-center gap-2">
              {statusLabel && (
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    pipelineStatus === "loading"
                      ? "text-[#f4c430] studio-shimmer"
                      : "text-zinc-500"
                  }`}
                >
                  {statusLabel}
                </span>
              )}
              <span className="text-xs font-semibold text-[#f4c430]">
                Slide {selectedIndex + 1}
              </span>
            </div>
          </div>

          {/* Off-screen slides — export capture targets (preview parity) */}
          <div className="builder-export-rack" aria-hidden>
            {slides.map((slide, i) => (
              <CarouselSlide
                key={`export-${slide.key}`}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                {...slideProps(slide)}
              />
            ))}
          </div>

          <div className="builder-stage flex min-h-0 flex-1 items-center justify-center px-4 py-2 md:px-8">
            <div className="builder-hero-wrap art-motion-float">
              <CarouselSlide key={`hero-${selected.key}`} {...slideProps(selected)} />
            </div>
          </div>

          <div className="builder-grid shrink-0 border-t border-white/[0.06] px-3 py-3 md:px-4">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
              All slides
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {slides.map((slide, i) => {
                const art = getArtDirection?.(slide.index);
                const active = i === selectedIndex;
                return (
                  <button
                    key={`grid-${slide.key}`}
                    type="button"
                    onClick={() => onSelectSlide(i)}
                    className={`builder-grid-cell relative overflow-hidden rounded-xl transition-all duration-300 ${
                      active
                        ? "ring-2 ring-[#f4c430]"
                        : "ring-1 ring-white/10 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Preview slide ${i + 1}`}
                    aria-current={active ? "true" : undefined}
                  >
                    {slide.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slide.image}
                        alt=""
                        className="h-full w-full object-cover"
                        style={{
                          filter: art?.photoFilter ?? undefined,
                        }}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm text-zinc-600">
                        {i + 1}
                      </span>
                    )}
                    <span
                      className={`absolute bottom-1 left-1 rounded px-1 py-0.5 text-[9px] font-bold ${
                        active
                          ? "bg-[#f4c430] text-black"
                          : "bg-black/75 text-zinc-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {pipelineStatus === "loading" && active && (
                      <span
                        className="absolute inset-0 bg-black/30"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default memo(BuilderPreview);
