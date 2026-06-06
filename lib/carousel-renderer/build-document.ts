import { studioCaptionsToCarouselLines } from "@/lib/carousel-renderer/captions-bridge";
import { buildCarouselFromPipeline } from "@/lib/carousel-renderer/pipeline";
import { DOODLE_CAFE_TEMPLATE } from "@/lib/carousel-renderer/template-engine";
import type { CarouselDocument, CarouselRenderInput } from "@/lib/carousel-renderer/types";
import type { Captions } from "@/lib/slides";
import { analyzePhotos } from "@/lib/story-engine/photo/photo-intelligence";

/**
 * Build Carousel JSON from uploaded photos + story captions.
 */
export function buildCarouselDocument(input: CarouselRenderInput): CarouselDocument {
  const lines = [...input.captions];
  while (lines.length < 8) lines.push("");

  const { document } = buildCarouselFromPipeline({
    templateId: input.templateId,
    theme: "restaurant-story",
    style: input.templateId,
    photos: analyzePhotos(input.photoUrls).assets,
    captions: lines,
    brandName: input.brandName,
    brandCta: input.brandCta,
    location: input.location,
  });

  return document;
}

export function buildDoodleCafeFromStudio(input: {
  photoUrls: string[];
  captions: string[] | Captions;
  brandName?: string;
  brandCta?: string;
  location?: string;
}): CarouselDocument {
  const lines = Array.isArray(input.captions)
    ? input.captions
    : studioCaptionsToCarouselLines(
        input.captions,
        input.brandName,
        input.brandCta
      );

  const { document } = buildCarouselFromPipeline({
    templateId: "doodle-cafe",
    theme: "cozy-cafe-storytelling",
    style: "doodle-cafe",
    photos: analyzePhotos(input.photoUrls).assets,
    captions: lines,
    brandName: input.brandName,
    brandCta: input.brandCta,
    location: input.location,
  });

  return document;
}

export { DOODLE_CAFE_TEMPLATE };
