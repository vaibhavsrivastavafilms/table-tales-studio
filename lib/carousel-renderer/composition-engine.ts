import {
  applyCampaignToCompositionPlan,
  type CarouselCampaign,
} from "@/lib/carousel-renderer/campaign-engine";
import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";
import {
  edgeScrimBottom,
  edgeScrimTop,
  MAX_EDGE_VIGNETTE,
  SUBTLE_PHOTO_FILTER,
} from "@/lib/carousel-renderer/photo-treatment";
import type {
  CompositionLayoutId,
  CompositionPlan,
  VisualWeightBudget,
} from "@/lib/carousel-renderer/composition-types";
import { SEMANTIC_LAYOUT_BUILDERS } from "@/lib/carousel-renderer/semantic-layouts";
import { analyzeSubjectsFromAsset } from "@/lib/carousel-renderer/subject-engine";
import type { SlideLayoutSpec } from "@/lib/carousel-renderer/types";

export type {
  CompositionLayoutId,
  CompositionHierarchy,
  CompositionPlan,
  NarrativeDoodleSpec,
  TypographyZones,
  VisualWeightBudget,
} from "@/lib/carousel-renderer/composition-types";

export type BuildCompositionInput = {
  role: DoodleCafeSlideRole;
  slideIndex: number;
  photoAsset?: import("@/lib/story-engine/types").PhotoAsset | null;
  headline?: string;
  subhead?: string;
  brandName?: string;
  showAnchors?: boolean;
  campaign?: CarouselCampaign | null;
};

const ROLE_LAYOUT: Record<DoodleCafeSlideRole, CompositionLayoutId> = {
  "hero-hook": "HookLayout",
  atmosphere: "AtmosphereLayout",
  "food-steam": "FoodCloseupLayout",
  drink: "DrinkLayout",
  "community-cta": "CommunityLayout",
  quote: "QuoteLayout",
  "hero-payoff": "PayoffLayout",
  "brand-end": "BrandLayout",
};

const WEIGHTS: Record<DoodleCafeSlideRole, VisualWeightBudget> = {
  "hero-hook": { photo: 0.75, typography: 0.15, doodles: 0.1 },
  atmosphere: { photo: 0.78, typography: 0.14, doodles: 0.08 },
  "food-steam": { photo: 0.85, typography: 0.05, doodles: 0.1 },
  drink: { photo: 0.8, typography: 0.12, doodles: 0.08 },
  "community-cta": { photo: 0.65, typography: 0.25, doodles: 0.1 },
  quote: { photo: 0.78, typography: 0.14, doodles: 0.08 },
  "hero-payoff": { photo: 0.9, typography: 0.08, doodles: 0.02 },
  "brand-end": { photo: 0.82, typography: 0.14, doodles: 0.04 },
};

/** @deprecated use analyzeSubjectsFromAsset */
export function findFocalArea(
  asset: import("@/lib/story-engine/types").PhotoAsset | null | undefined,
  role: DoodleCafeSlideRole
) {
  return analyzeSubjectsFromAsset(asset, role).protectedRegion;
}

/** Semantic composition — subjects + negative space + layout intelligence. */
export function buildCompositionPlan(input: BuildCompositionInput): CompositionPlan {
  const weights = WEIGHTS[input.role];
  const subjects = analyzeSubjectsFromAsset(input.photoAsset, input.role);
  const layoutId = ROLE_LAYOUT[input.role];
  const partial = SEMANTIC_LAYOUT_BUILDERS[layoutId](subjects, weights);

  const primaryLine = (input.headline ?? "").split("\n")[0]?.trim() || "Story";
  const secondaryLine =
    input.subhead?.trim() ||
    (input.headline ?? "").split("\n").slice(1).join(" ").trim() ||
    input.brandName?.trim() ||
    "";

  const { typographyZones } = partial;

  let plan: CompositionPlan = {
    layoutId: partial.layoutId,
    role: input.role,
    subjects,
    focalPoint: subjects.protectedRegion,
    typographyZones,
    textZone: typographyZones.textZone,
    primaryTextZone: typographyZones.primaryTextZone,
    secondaryTextZone: typographyZones.secondaryTextZone,
    tertiaryTextZone: typographyZones.tertiaryTextZone,
    negativeSpace: subjects.negativeSpace,
    doodleZones: partial.doodleZones,
    narrativeDoodles: partial.narrativeDoodles,
    visualWeight: weights,
    hierarchy: {
      primary: primaryLine,
      secondary: secondaryLine,
      tertiary: String(input.slideIndex),
    },
    objectPosition: subjects.objectPosition,
    photoFrame: partial.photoFrame,
    topScrimHeight: partial.topScrimHeight,
    bottomScrimHeight: partial.bottomScrimHeight,
    textPlacement: partial.textPlacement,
    showAnchors: input.showAnchors ?? false,
  };

  if (input.campaign) {
    plan = applyCampaignToCompositionPlan(plan, input.slideIndex, input.campaign);
  }

  return plan;
}

export function compositionPlanToLayoutSpec(
  plan: CompositionPlan,
  photoUrl: string
): SlideLayoutSpec {
  return {
    role: plan.role,
    photo: {
      url: photoUrl,
      layout: "cover",
      filter: SUBTLE_PHOTO_FILTER,
      objectPosition: plan.objectPosition,
      vignette: MAX_EDGE_VIGNETTE,
    },
    photoFrame: plan.photoFrame,
    captionZone: plan.textZone,
    foodSafe: plan.focalPoint,
    doodleZones: plan.doodleZones,
    topScrimHeight: plan.topScrimHeight,
    bottomScrimHeight: plan.bottomScrimHeight,
    gradientTop: edgeScrimTop(plan.topScrimHeight),
    gradientBottom: edgeScrimBottom(plan.bottomScrimHeight),
    compositionPlan: plan,
  };
}

export function buildSlideLayoutFromComposition(
  input: BuildCompositionInput & { photoUrl: string }
): SlideLayoutSpec {
  const plan = buildCompositionPlan(input);
  return compositionPlanToLayoutSpec(plan, input.photoUrl);
}
