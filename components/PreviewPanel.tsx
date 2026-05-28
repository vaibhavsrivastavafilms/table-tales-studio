"use client";

import { memo, useMemo, type MutableRefObject } from "react";
import CarouselSlide from "@/components/CarouselSlide";
import EmptyState from "@/components/EmptyState";
import { SLIDE_COUNT, SLIDE_KEYS, type Captions } from "@/lib/slides";
import type { TemplateId } from "@/lib/templates";

type PreviewPanelProps = {
  images: string[];
  captions: Captions;
  templateId: TemplateId;
  slideRefs: MutableRefObject<(HTMLElement | null)[]>;
};

function PreviewPanel({
  images,
  captions,
  templateId,
  slideRefs,
}: PreviewPanelProps) {
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
    <section className="preview-glow flex min-w-0 flex-col overflow-hidden rounded-[28px] bg-[#0b0f1a] p-4 ring-1 ring-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:rounded-[40px] md:p-6 xl:min-w-0">
      <header className="mb-4 shrink-0 md:mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
          Stitched Preview
        </p>
        <h2 className="mt-1 text-2xl font-bold leading-tight text-white md:text-3xl">
          Carousel Preview
        </h2>
        <p className="mt-2 text-xs text-zinc-500 md:text-sm">
          {SLIDE_COUNT} slides · 4:5 · 2× export
        </p>
      </header>

      {images.length === 0 ? (
        <EmptyState
          title="Preview empty"
          description="Upload images to see your stitched Instagram carousel."
        />
      ) : (
        <div className="relative min-w-0">
          <div
            className="carousel-scroll -mx-1 flex gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 pb-4 scroll-smooth snap-x snap-mandatory touch-pan-x"
            style={{ scrollbarGutter: "stable" }}
          >
            {slides.map((slide, i) => (
              <div key={slide.key} className="shrink-0 snap-center">
                <CarouselSlide
                  ref={(el) => {
                    slideRefs.current[i] = el;
                  }}
                  image={slide.image}
                  text={slide.text}
                  index={slide.index}
                  templateId={templateId}
                />
              </div>
            ))}
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#0b0f1a] to-transparent md:w-8"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0b0f1a] to-transparent md:w-12"
            aria-hidden
          />
        </div>
      )}
    </section>
  );
}

export default memo(PreviewPanel);
