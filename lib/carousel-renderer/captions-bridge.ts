import type { Captions } from "@/lib/slides";

/** Map studio caption fields (6) → 8-slide Doodle Café carousel lines. */
export function studioCaptionsToCarouselLines(
  captions: Captions,
  brandName?: string,
  brandCta?: string
): string[] {
  return [
    captions.hook,
    captions.slide1,
    captions.slide2,
    captions.slide3,
    captions.slide4,
    "",
    captions.cta,
    brandCta?.trim() || brandName?.trim() || "",
  ];
}
