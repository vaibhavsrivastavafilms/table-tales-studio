"use client";

import { memo, useCallback, useEffect, useState } from "react";
import CarouselSlide from "@/components/CarouselSlide";
import { SLIDE_KEYS, type Captions } from "@/lib/slides";
import type { TemplateId } from "@/lib/templates";
import type { BrandKit } from "@/lib/brandKit";
import { resolveWatermarkText } from "@/lib/brandKit";

type StoryboardPanelProps = {
  open: boolean;
  onClose: () => void;
  images: string[];
  captions: Captions;
  templateId: TemplateId;
  brandKit: BrandKit;
  showPlanWatermark: boolean;
};

function StoryboardPanel({
  open,
  onClose,
  images,
  captions,
  templateId,
  brandKit,
  showPlanWatermark,
}: StoryboardPanelProps) {
  const [index, setIndex] = useState(0);
  const slideCount = SLIDE_KEYS.length;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + slideCount) % slideCount);
    },
    [slideCount]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, go]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const key = SLIDE_KEYS[index];
  const image = images[index] ?? "";
  const watermark = resolveWatermarkText(brandKit, showPlanWatermark);

  return (
    <div
      className="storyboard-overlay fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Storyboard preview"
    >
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#f7c600]">
            Storyboard
          </p>
          <p className="text-sm text-zinc-400">
            Slide {index + 1} of {slideCount} · ← → navigate
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white ring-1 ring-zinc-700 hover:ring-[#f7c600]/40"
        >
          Close
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 md:p-8">
        <div className="storyboard-slide-enter scale-[1.15] md:scale-[1.35]">
          <CarouselSlide
            image={image}
            text={captions[key]}
            index={index + 1}
            templateId={templateId}
            brandKit={brandKit}
            watermarkText={watermark}
          />
        </div>

        <div className="flex max-w-lg flex-wrap justify-center gap-2">
          {SLIDE_KEYS.map((k, i) => (
            <button
              key={k}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index
                  ? "w-8 bg-[#f7c600]"
                  : "w-2 bg-zinc-600 hover:bg-zinc-400"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(StoryboardPanel);
