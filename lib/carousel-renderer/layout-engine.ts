import { buildSlideLayoutFromComposition } from "@/lib/carousel-renderer/composition-engine";
import type { SlideLayoutSpec } from "@/lib/carousel-renderer/types";
import type { PhotoAsset } from "@/lib/story-engine/types";

export type DoodleCafeSlideRole =
  | "hero-hook"
  | "atmosphere"
  | "food-steam"
  | "drink"
  | "community-cta"
  | "quote"
  | "hero-payoff"
  | "brand-end";

export type BuildSlideLayoutOptions = {
  slideIndex?: number;
  photoAsset?: PhotoAsset | null;
  headline?: string;
  subhead?: string;
  brandName?: string;
};

export function buildSlideLayout(
  role: DoodleCafeSlideRole,
  photoUrl: string,
  options?: BuildSlideLayoutOptions
): SlideLayoutSpec {
  return buildSlideLayoutFromComposition({
    role,
    photoUrl,
    slideIndex: options?.slideIndex ?? 1,
    photoAsset: options?.photoAsset,
    headline: options?.headline,
    subhead: options?.subhead,
    brandName: options?.brandName,
  });
}

export { edgeScrimTop, edgeScrimBottom } from "@/lib/carousel-renderer/photo-treatment";

export const DOODLE_CAFE_ROLES: DoodleCafeSlideRole[] = [
  "hero-hook",
  "atmosphere",
  "food-steam",
  "drink",
  "community-cta",
  "quote",
  "hero-payoff",
  "brand-end",
];
