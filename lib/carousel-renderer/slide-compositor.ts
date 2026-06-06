import {
  buildCompositionPlan,
  compositionPlanToLayoutSpec,
} from "@/lib/carousel-renderer/composition-engine";
import { buildNarrativeDoodles } from "@/lib/carousel-renderer/doodle-engine";
import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";
import { layoutTypeForRole } from "@/lib/carousel-renderer/layout-presets";
import { buildTypographyFromComposition } from "@/lib/carousel-renderer/typography-engine";
import type { DoodleAsset, RenderSlide } from "@/lib/carousel-renderer/project-types";
import type {
  CarouselSlideJson,
  SlideComposition,
} from "@/lib/carousel-renderer/types";
import type { CarouselCampaign } from "@/lib/carousel-renderer/campaign-engine";
import type { PhotoAsset } from "@/lib/story-engine/types";

export type ComposeSlideInput = {
  index: number;
  role: DoodleCafeSlideRole;
  photoUrl: string;
  photoAsset?: PhotoAsset | null;
  headline: string;
  subhead?: string;
  brandName?: string;
  brandCta?: string;
  location?: string;
  showAnchors?: boolean;
  campaign?: CarouselCampaign | null;
};

/** Enable anchor debug overlay (env or localStorage). */
export function shouldShowCompositionAnchors(override?: boolean): boolean {
  if (override !== undefined) return override;
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_SHOW_COMPOSITION_ANCHORS === "true") return true;
  try {
    return window.localStorage.getItem("tts:showAnchors") === "true";
  } catch {
    return false;
  }
}

export type ComposeRenderSlideInput = ComposeSlideInput & {
  id: string;
  photoId: string;
  body: string;
  photoConfidence?: number;
  photoReasoning?: string;
  campaign?: CarouselCampaign | null;
};

/**
 * composeSlide — Photo → Composition → Typography → Narrative Doodles
 */
export function composeSlide(input: ComposeSlideInput): SlideComposition {
  const showAnchors = shouldShowCompositionAnchors(input.showAnchors);
  const plan = buildCompositionPlan({
    role: input.role,
    slideIndex: input.index,
    photoAsset: input.photoAsset,
    headline: input.headline,
    subhead: input.subhead,
    brandName: input.brandName,
    showAnchors,
    campaign: input.campaign,
  });

  const layout = compositionPlanToLayoutSpec(plan, input.photoUrl);
  const typography = buildTypographyFromComposition(plan, input.headline, input.subhead, {
    brandName: input.brandName,
    brandCta: input.brandCta,
    location: input.location,
    accentColor: input.campaign?.accent,
  });
  const doodles = buildNarrativeDoodles(plan);

  return {
    index: input.index,
    role: input.role,
    layout,
    doodles,
    typography,
    showSlideNumber: false,
    showQr: input.role === "brand-end",
    showPin: input.role === "brand-end",
    showAnchors,
  };
}

export function composeRenderSlide(input: ComposeRenderSlideInput): RenderSlide {
  const composition = composeSlide(input);
  const layoutType = layoutTypeForRole(input.role);

  const doodles: DoodleAsset[] = composition.doodles.map((d, i) => ({
    id: `${input.id}_doodle_${i}`,
    type: d.type,
    x: d.x,
    y: d.y,
    scale: d.scale,
    rotation: d.rotation,
    opacity: d.opacity,
  }));

  return {
    id: input.id,
    index: input.index,
    role: input.role,
    photoId: input.photoId,
    photoUrl: input.photoUrl,
    headline: input.headline,
    body: input.body,
    layout: layoutType,
    doodles,
    subhead: input.subhead,
    photoConfidence: input.photoConfidence,
    photoReasoning: input.photoReasoning,
  };
}

export function composeSlideJson(input: ComposeSlideInput): CarouselSlideJson {
  const slide = composeRenderSlide({
    id: `slide_${input.index}`,
    photoId: input.photoAsset?.id ?? `photo_${input.index}`,
    body: input.subhead ?? "",
    photoConfidence: undefined,
    photoReasoning: undefined,
    ...input,
  });

  const composition = composeSlide(input);
  return {
    index: slide.index,
    role: slide.role,
    photoUrl: slide.photoUrl,
    headline: slide.headline,
    subhead: slide.subhead,
    composition,
  };
}

export function renderSlideToComposition(slide: RenderSlide): SlideComposition {
  return composeSlide({
    index: slide.index,
    role: slide.role as DoodleCafeSlideRole,
    photoUrl: slide.photoUrl,
    headline: slide.headline,
    subhead: slide.subhead ?? slide.body,
  });
}
