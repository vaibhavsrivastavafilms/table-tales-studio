"use client";

import { memo, useMemo } from "react";
import CarouselRendererSlide from "@/components/carousel-renderer/CarouselRendererSlide";
import { buildDoodleCafeFromStudio } from "@/lib/carousel-renderer/build-document";
import type { CarouselDocument } from "@/lib/carousel-renderer/types";

const PREVIEW_W = 320;
const PREVIEW_H = 400;
const DESIGN_W = 1080;
const DESIGN_H = 1350;
const SCALE = PREVIEW_W / DESIGN_W;

type CarouselRendererPreviewProps = {
  photoUrls: string[];
  captions: string[];
  brandName?: string;
  brandCta?: string;
  document?: CarouselDocument | null;
  slideIndex?: number;
  showWatermark?: string | null;
  className?: string;
};

function CarouselRendererPreview({
  photoUrls,
  captions,
  brandName,
  brandCta,
  document: docProp,
  slideIndex = 1,
  showWatermark,
  className = "",
}: CarouselRendererPreviewProps) {
  const document = useMemo(() => {
    if (docProp) return docProp;
    if (photoUrls.length === 0) return null;
    return buildDoodleCafeFromStudio({
      photoUrls,
      captions,
      brandName,
      brandCta,
    });
  }, [docProp, photoUrls, captions, brandName, brandCta]);

  const slide = document?.slides.find((s) => s.index === slideIndex) ?? document?.slides[0];

  if (!slide) {
    return (
      <div
        className={`flex items-center justify-center rounded-[28px] bg-[#1a120c] ring-1 ring-white/10 ${className}`}
        style={{ width: PREVIEW_W, height: PREVIEW_H }}
      >
        <p className="text-xs text-zinc-500">Upload photos to render carousel</p>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] ring-1 ring-white/10 ${className}`}
      style={{ width: PREVIEW_W, height: PREVIEW_H }}
    >
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
        }}
      >
        <CarouselRendererSlide
          slide={slide}
          showWatermark={showWatermark}
        />
      </div>
    </div>
  );
}

export default memo(CarouselRendererPreview);
