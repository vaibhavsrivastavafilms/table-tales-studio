"use client";

import { memo, useMemo, type MutableRefObject } from "react";
import CarouselSlide from "@/components/CarouselSlide";
import BuilderEmptyWorkspace from "@/components/builder/BuilderEmptyWorkspace";
import { buildCarouselFromPipeline } from "@/lib/carousel-renderer/pipeline";
import { studioCaptionsToCarouselLines } from "@/lib/carousel-renderer/captions-bridge";
import { analyzePhotos } from "@/lib/story-engine/photo/photo-intelligence";
import { SLIDE_KEYS, slideCountForTemplate, type Captions } from "@/lib/slides";
import { DEFAULT_BRAND_KIT, resolveWatermarkText, type BrandKit } from "@/lib/brandKit";
import { useRenderDiagnostic, slideStatesKey } from "@/lib/renderProfiler";
import type { SlideArtDirection } from "@/lib/slideArtDirector";
import type { SlideEditorPrefs } from "@/lib/slideEditorPrefs";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { TemplateId } from "@/lib/templates";
import type { SlideRenderState } from "@/lib/generationStages";
import type { CarouselDocument } from "@/lib/carousel-renderer/types";

type BuilderPreviewProps = {
  images: string[];
  captions: Captions;
  templateId: TemplateId;
  /** Pre-built carousel JSON (hero-selected photos). Avoids duplicate pipeline runs. */
  carouselDocument?: CarouselDocument | null;
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
  isGenerating?: boolean;
  slideStates?: Map<number, SlideRenderState>;
  enhancingSlideIndex?: number | null;
  directionsVersion?: number;
};

function thumbRevealClass(state: SlideRenderState | undefined): string {
  if (state === "rendered") return "builder-grid-reveal is-rendered";
  if (state === "generating") return "builder-grid-reveal is-generating";
  return "builder-grid-reveal is-queued";
}

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
  isGenerating = false,
  slideStates,
  enhancingSlideIndex = null,
  directionsVersion = 0,
  carouselDocument: carouselDocumentProp = null,
}: BuilderPreviewProps) {
  useRenderDiagnostic("BuilderPreview");

  const watermark = resolveWatermarkText(
    brandKit ?? DEFAULT_BRAND_KIT,
    showWatermark ?? false
  );

  const useCarouselEngine = templateId === "doodle-story";

  const carouselDocument = useMemo(() => {
    if (carouselDocumentProp) return carouselDocumentProp;
    if (!useCarouselEngine || images.length === 0) return null;
    const { document } = buildCarouselFromPipeline({
      templateId: "doodle-cafe",
      theme: "cozy-cafe-storytelling",
      style: "doodle-cafe",
      photos: analyzePhotos(images).assets,
      captions: studioCaptionsToCarouselLines(
        captions,
        brandKit?.brandName,
        brandKit?.brandCta
      ),
      brandName: brandKit?.brandName,
      brandCta: brandKit?.brandCta,
    });
    return document;
  }, [carouselDocumentProp, useCarouselEngine, images, captions, brandKit]);

  const slides = useMemo(() => {
    if (carouselDocument) {
      return carouselDocument.slides.map((s) => ({
        key: `cafe-${s.index}` as const,
        image: s.photoUrl,
        text: s.headline,
        index: s.index,
      }));
    }
    return SLIDE_KEYS.map((key, i) => ({
      key,
      image: images[i] ?? images[images.length - 1] ?? images[0] ?? "",
      text: captions[key],
      index: i + 1,
    }));
  }, [carouselDocument, images, captions]);

  const slideTotal = slideCountForTemplate(templateId);

  const artBySlide = useMemo(() => {
    const map = new Map<number, SlideArtDirection | null>();
    if (!getArtDirection) return map;
    for (let i = 1; i <= slides.length; i++) {
      map.set(i, getArtDirection(i));
    }
    return map;
    // directionsVersion bumps when art direction map changes
  }, [getArtDirection, directionsVersion, slides.length]);

  const selected = slides[selectedIndex] ?? slides[0];
  const selectedArt = artBySlide.get(selected.index) ?? null;
  const selectedState = slideStates?.get(selected.index);
  const isEnhancingThis = enhancingSlideIndex === selected.index;
  const heroReady =
    (!isGenerating || selectedState === "rendered") && !isEnhancingThis;

  const slideProps = (slide: (typeof slides)[0], exportMode = false) => ({
    image: slide.image,
    text: slide.text,
    index: slide.index,
    templateId,
    brandKit,
    watermarkText: watermark,
    storyMood,
    styleReference,
    styleVision,
    artDirection: artBySlide.get(slide.index) ?? null,
    aiDesign: artBySlide.get(slide.index)?.aiOverlay ?? null,
    slidePrefs: getSlidePrefs?.(slide.index),
    carouselDocument,
    exportMode,
  });

  return (
    <section className="builder-preview flex min-h-0 flex-1 flex-col">
      {images.length === 0 ? (
        <BuilderEmptyWorkspace />
      ) : (
        <>
          <div className="flex shrink-0 items-center justify-between px-4 pt-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Live storyboard
            </p>
            <span className="text-xs font-semibold text-[#f4c430]">
              Slide {selectedIndex + 1} of {slideTotal}
            </span>
          </div>

          <div
            className={`builder-export-rack${useCarouselEngine ? " builder-export-rack--carousel" : ""}`}
            aria-hidden
          >
            {slides.map((slide, i) => (
              <CarouselSlide
                key={`export-${slide.key}`}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                {...slideProps(slide, true)}
              />
            ))}
          </div>

          <div className="builder-stage flex min-h-0 flex-1 items-center justify-center px-4 py-2 md:px-8">
            <div
              className={`builder-hero-wrap builder-hero-reveal ${
                heroReady ? "is-ready art-motion-float" : "is-building"
              } ${isEnhancingThis ? "builder-hero-enhancing" : ""}`}
            >
              <CarouselSlide key={`hero-${selected.key}`} {...slideProps(selected)} />
            </div>
          </div>

          <div className="builder-grid shrink-0 border-t border-white/[0.06] px-3 py-3 md:px-4">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
              All slides
            </p>
            <div
              className={`grid gap-2 ${
                slides.length > 6
                  ? "grid-cols-4 sm:grid-cols-8"
                  : "grid-cols-3 sm:grid-cols-6"
              }`}
            >
              {slides.map((slide, i) => {
                const state = slideStates?.get(slide.index);
                const active = i === selectedIndex;
                return (
                  <button
                    key={`grid-${slide.key}`}
                    type="button"
                    onClick={() => onSelectSlide(i)}
                    className={`builder-grid-cell relative overflow-hidden rounded-xl transition-all duration-300 ${
                      active
                        ? "ring-2 ring-[#f4c430]"
                        : "ring-1 ring-white/10"
                    } ${state === "generating" ? "builder-thumb-shimmer" : ""}`}
                    aria-label={`Preview slide ${i + 1}`}
                    aria-current={active ? "true" : undefined}
                  >
                    {slide.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slide.image}
                        alt=""
                        className={`h-full w-full object-cover ${thumbRevealClass(state)}`}
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

function previewPropsEqual(
  prev: BuilderPreviewProps,
  next: BuilderPreviewProps
): boolean {
  return (
    prev.selectedIndex === next.selectedIndex &&
    prev.templateId === next.templateId &&
    prev.isGenerating === next.isGenerating &&
    prev.enhancingSlideIndex === next.enhancingSlideIndex &&
    prev.directionsVersion === next.directionsVersion &&
    prev.showWatermark === next.showWatermark &&
    prev.storyMood === next.storyMood &&
    prev.images === next.images &&
    prev.carouselDocument === next.carouselDocument &&
    prev.captions === next.captions &&
    prev.brandKit === next.brandKit &&
    prev.styleReference === next.styleReference &&
    prev.styleVision === next.styleVision &&
    prev.getArtDirection === next.getArtDirection &&
    prev.getSlidePrefs === next.getSlidePrefs &&
    slideStatesKey(prev.slideStates) === slideStatesKey(next.slideStates)
  );
}

export default memo(BuilderPreview, previewPropsEqual);
