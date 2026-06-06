import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";
import type {
  CompositionLayoutId,
  NarrativeDoodleSpec,
  VisualWeightBudget,
} from "@/lib/carousel-renderer/composition-types";
import { resolveTypographyZones } from "@/lib/carousel-renderer/subject-engine";
import type { SubjectAnalysis } from "@/lib/carousel-renderer/subject-types";
import type { Rect } from "@/lib/carousel-renderer/types";
import {
  CAROUSEL_HEIGHT,
  CAROUSEL_WIDTH,
} from "@/lib/carousel-renderer/project-types";

const W = CAROUSEL_WIDTH;
const H = CAROUSEL_HEIGHT;

export type SemanticLayoutPartial = {
  layoutId: CompositionLayoutId;
  typographyZones: {
    textZone: Rect;
    primaryTextZone: Rect;
    secondaryTextZone?: Rect;
    tertiaryTextZone: Rect;
  };
  doodleZones: Rect[];
  narrativeDoodles: NarrativeDoodleSpec[];
  photoFrame: Rect;
  topScrimHeight: number;
  bottomScrimHeight: number;
  textPlacement:
    | "top-left"
    | "top-right"
    | "top-strip"
    | "bottom-left"
    | "bottom-band"
    | "center-band";
};

function tertiaryZone(side: "left" | "right" | "center"): Rect {
  if (side === "right") return { x: W - 80, y: 28, width: 52, height: 36 };
  if (side === "center") return { x: W / 2 - 24, y: 36, width: 48, height: 36 };
  return { x: 36, y: 36, width: 72, height: 36 };
}

/** Hook — heroDish primary; type in best negative space; arrow → heroDish. */
export function buildHookLayoutSemantic(
  subjects: SubjectAnalysis,
  w: VisualWeightBudget
): SemanticLayoutPartial {
  const typo = resolveTypographyZones(subjects, {
    typographyFraction: w.typography,
    preferLabels: ["top-left-band", "top-strip"],
  });
  const hero = subjects.anchors.heroDish ?? subjects.protectedRegion;
  const photoTop = typo.textZone.y + typo.textZone.height + 12;

  return {
    layoutId: "HookLayout",
    typographyZones: { ...typo, tertiaryTextZone: tertiaryZone("right") },
    doodleZones: [
      { x: (subjects.anchors.table?.x ?? 20), y: H - 200, width: 160, height: 160 },
      { x: hero.x - 52, y: hero.y + hero.height - 90, width: 100, height: 100 },
    ],
    narrativeDoodles: [
      { type: "people", anchor: "beside-table-left", scale: 0.5 },
      { type: "arrow", anchor: "point-to-hero-dish", scale: 0.48 },
      { type: "circle", anchor: "corner-bl", scale: 0.44 },
    ],
    photoFrame: { x: 0, y: photoTop, width: W, height: H - photoTop },
    topScrimHeight: typo.textZone.height + 40,
    bottomScrimHeight: Math.round(H * 0.08),
    textPlacement: "top-left",
  };
}

/** Atmosphere — interior + people; type top-right negative space. */
export function buildAtmosphereLayoutSemantic(
  subjects: SubjectAnalysis,
  w: VisualWeightBudget
): SemanticLayoutPartial {
  const typo = resolveTypographyZones(subjects, {
    typographyFraction: w.typography,
    preferLabels: ["top-right-band", "right-margin"],
  });

  return {
    layoutId: "AtmosphereLayout",
    typographyZones: { ...typo, tertiaryTextZone: tertiaryZone("left") },
    doodleZones: [
      { x: W - 220, y: H - 340, width: 200, height: 300 },
      { x: 20, y: 260, width: 110, height: 130 },
    ],
    narrativeDoodles: [
      { type: "people", anchor: "beside-table-right", scale: 0.52 },
      { type: "speech-bubble", anchor: "near-community", scale: 0.42 },
      { type: "heart", anchor: "near-emotional-copy", scale: 0.4 },
    ],
    photoFrame: { x: 0, y: 0, width: W, height: H },
    topScrimHeight: Math.round(H * 0.14),
    bottomScrimHeight: Math.round(H * 0.06),
    textPlacement: "top-right",
  };
}

/** Food closeup — heroDish fills frame; steam above; micro top strip. */
export function buildFoodCloseupLayoutSemantic(
  subjects: SubjectAnalysis,
  w: VisualWeightBudget
): SemanticLayoutPartial {
  const typo = resolveTypographyZones(subjects, {
    typographyFraction: w.typography,
    preferLabels: ["top-strip", "top-left-band"],
  });
  const hero = subjects.anchors.heroDish ?? subjects.protectedRegion;

  return {
    layoutId: "FoodCloseupLayout",
    typographyZones: {
      textZone: typo.textZone,
      primaryTextZone: typo.primaryTextZone,
      tertiaryTextZone: tertiaryZone("right"),
    },
    doodleZones: [{ x: hero.x + hero.width * 0.42, y: hero.y - 88, width: 130, height: 76 }],
    narrativeDoodles: [
      { type: "steam", anchor: "above-hero-dish", scale: 0.52 },
      { type: "steam", anchor: "above-hero-dish", scale: 0.46 },
      { type: "arrow", anchor: "point-to-hero-dish", scale: 0.42 },
    ],
    photoFrame: { x: 0, y: typo.textZone.height + 24, width: W, height: H - typo.textZone.height - 20 },
    topScrimHeight: typo.textZone.height + 16,
    bottomScrimHeight: 0,
    textPlacement: "top-strip",
  };
}

/** Drink — drink primary; type opposite side; arrow → drink. */
export function buildDrinkLayoutSemantic(
  subjects: SubjectAnalysis,
  w: VisualWeightBudget
): SemanticLayoutPartial {
  const typo = resolveTypographyZones(subjects, {
    typographyFraction: w.typography,
    preferLabels: ["bottom-left-band", "left-margin"],
  });
  const drink = subjects.anchors.drink ?? subjects.anchors.heroDish!;

  return {
    layoutId: "DrinkLayout",
    typographyZones: { ...typo, tertiaryTextZone: tertiaryZone("right") },
    doodleZones: [
      { x: drink.x + drink.width - 40, y: drink.y + 20, width: 88, height: 88 },
      { x: 18, y: 110, width: 72, height: 72 },
    ],
    narrativeDoodles: [
      { type: "arrow", anchor: "point-to-drink", scale: 0.46 },
      { type: "circle", anchor: "point-to-drink", scale: 0.44 },
      { type: "coffee-stain", anchor: "corner-bl", scale: 0.36 },
    ],
    photoFrame: { x: 0, y: 0, width: W, height: H - typo.textZone.height - 28 },
    topScrimHeight: 0,
    bottomScrimHeight: typo.textZone.height + 52,
    textPlacement: "bottom-left",
  };
}

/** Community — people primary; CTA bottom band. */
export function buildCommunityLayoutSemantic(
  subjects: SubjectAnalysis,
  w: VisualWeightBudget
): SemanticLayoutPartial {
  const typo = resolveTypographyZones(subjects, {
    typographyFraction: w.typography,
    preferLabels: ["bottom-band", "bottom-left-band"],
  });

  return {
    layoutId: "CommunityLayout",
    typographyZones: { ...typo, tertiaryTextZone: tertiaryZone("right") },
    doodleZones: [{ x: 20, y: H - typo.textZone.height - 240, width: 160, height: 200 }],
    narrativeDoodles: [
      { type: "people", anchor: "near-community", scale: 0.54 },
      { type: "speech-bubble", anchor: "near-community", scale: 0.46 },
      { type: "heart", anchor: "near-emotional-copy", scale: 0.42 },
    ],
    photoFrame: { x: 0, y: 0, width: W, height: H - typo.textZone.height - 24 },
    topScrimHeight: 0,
    bottomScrimHeight: typo.textZone.height + 60,
    textPlacement: "bottom-band",
  };
}

export function buildQuoteLayoutSemantic(
  subjects: SubjectAnalysis,
  w: VisualWeightBudget
): SemanticLayoutPartial {
  const typo = resolveTypographyZones(subjects, {
    typographyFraction: w.typography,
    preferLabels: ["center-quiet", "top-strip"],
  });
  typo.textZone = {
    x: 64,
    y: Math.round(H * 0.36),
    width: W - 128,
    height: typo.textZone.height,
  };
  typo.primaryTextZone = { ...typo.textZone };

  return {
    layoutId: "QuoteLayout",
    typographyZones: { ...typo, tertiaryTextZone: tertiaryZone("left") },
    doodleZones: [
      { x: 44, y: 92, width: 76, height: 86 },
      { x: W - 116, y: 96, width: 76, height: 86 },
    ],
    narrativeDoodles: [
      { type: "light-bulb", anchor: "near-insight-copy", scale: 0.48 },
      { type: "light-bulb", anchor: "near-insight-copy", scale: 0.46 },
      { type: "star", anchor: "corner-tr", scale: 0.38 },
    ],
    photoFrame: { x: 0, y: 0, width: W, height: H },
    topScrimHeight: 96,
    bottomScrimHeight: 96,
    textPlacement: "center-band",
  };
}

export function buildPayoffLayoutSemantic(
  subjects: SubjectAnalysis,
  w: VisualWeightBudget
): SemanticLayoutPartial {
  const typo = resolveTypographyZones(subjects, {
    typographyFraction: w.typography,
    preferLabels: ["bottom-left-band", "bottom-band"],
  });

  return {
    layoutId: "PayoffLayout",
    typographyZones: { ...typo, tertiaryTextZone: tertiaryZone("right") },
    doodleZones: [{ x: W - 92, y: 76, width: 64, height: 64 }],
    narrativeDoodles: [{ type: "heart", anchor: "near-emotional-copy", scale: 0.4 }],
    photoFrame: { x: 0, y: 0, width: W, height: H - typo.textZone.height - 20 },
    topScrimHeight: 0,
    bottomScrimHeight: typo.textZone.height + 44,
    textPlacement: "bottom-left",
  };
}

export function buildBrandLayoutSemantic(
  subjects: SubjectAnalysis,
  w: VisualWeightBudget
): SemanticLayoutPartial {
  const typo = resolveTypographyZones(subjects, {
    typographyFraction: w.typography,
    preferLabels: ["bottom-band"],
  });

  return {
    layoutId: "BrandLayout",
    typographyZones: { ...typo, tertiaryTextZone: tertiaryZone("center") },
    doodleZones: [
      { x: 28, y: 132, width: 68, height: 68 },
      { x: W - 100, y: 148, width: 68, height: 68 },
    ],
    narrativeDoodles: [
      { type: "coffee-stain", anchor: "corner-tl", scale: 0.34 },
      { type: "coffee-stain", anchor: "corner-br", scale: 0.32 },
      { type: "star", anchor: "corner-tr", scale: 0.36 },
    ],
    photoFrame: { x: 0, y: 0, width: W, height: H - typo.textZone.height - 28 },
    topScrimHeight: 0,
    bottomScrimHeight: typo.textZone.height + 52,
    textPlacement: "bottom-band",
  };
}

export const SEMANTIC_LAYOUT_BUILDERS: Record<
  CompositionLayoutId,
  (subjects: SubjectAnalysis, w: VisualWeightBudget) => SemanticLayoutPartial
> = {
  HookLayout: buildHookLayoutSemantic,
  AtmosphereLayout: buildAtmosphereLayoutSemantic,
  FoodCloseupLayout: buildFoodCloseupLayoutSemantic,
  DrinkLayout: buildDrinkLayoutSemantic,
  CommunityLayout: buildCommunityLayoutSemantic,
  QuoteLayout: buildQuoteLayoutSemantic,
  PayoffLayout: buildPayoffLayoutSemantic,
  BrandLayout: buildBrandLayoutSemantic,
};
