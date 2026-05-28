"use client";

import { type MutableRefObject } from "react";
import CarouselSlide from "@/components/CarouselSlide";
import { SLIDE_COUNT, SLIDE_KEYS, type Captions } from "@/lib/slides";

type PreviewPanelProps = {
  images: string[];
  captions: Captions;
  template?: string;
  slideRefs: MutableRefObject<(HTMLElement | null)[]>;
};

export default function PreviewPanel({
  images,
  captions,
  template = "Street Food",
  slideRefs,
}: PreviewPanelProps) {
  return (
    <section className="flex flex-col rounded-[40px] bg-[#0b0f1a] p-6 ring-1 ring-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <header className="mb-5 shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
          Stitched Preview
        </p>
        <h2 className="mt-1 text-3xl font-bold leading-tight text-white">
          Carousel
          <br />
          Preview
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          {SLIDE_COUNT} slides · 4:5 · 1080×1350 export
        </p>
      </header>

      <div className="relative">
        <div
          className="carousel-scroll flex gap-3 overflow-x-auto overflow-y-hidden pb-4 pr-2 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarGutter: "stable" }}
        >
          {SLIDE_KEYS.map((key, i) => {
            const image =
              images[i] ?? images[images.length - 1] ?? images[0] ?? "";

            return (
              <div key={key} className="shrink-0 snap-center">
                <CarouselSlide
                  ref={(el) => {
                    slideRefs.current[i] = el;
                  }}
                  image={image}
                  text={captions[key]}
                  index={i + 1}
                  template={template}
                />
              </div>
            );
          })}
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0b0f1a] to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0b0f1a] to-transparent"
          aria-hidden
        />
      </div>
    </section>
  );
}
