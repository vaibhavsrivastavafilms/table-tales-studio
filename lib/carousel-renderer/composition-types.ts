import {
  type PlacedDoodle,
  type Rect,
} from "@/lib/carousel-renderer/types";

import type { SubjectAnalysis } from "@/lib/carousel-renderer/subject-types";
import type { DoodleCafeSlideRole } from "@/lib/carousel-renderer/layout-engine";

export type CompositionLayoutId =
  | "HookLayout"
  | "AtmosphereLayout"
  | "FoodCloseupLayout"
  | "DrinkLayout"
  | "CommunityLayout"
  | "QuoteLayout"
  | "PayoffLayout"
  | "BrandLayout";

export type VisualWeightBudget = {
  photo: number;
  typography: number;
  doodles: number;
};

export type CompositionHierarchy = {
  primary: string;
  secondary: string;
  tertiary: string;
};

/** Semantic doodle placement — relative to subject anchors, not generic focal rect. */
export type NarrativeDoodleSpec = {
  type: PlacedDoodle["type"];
  anchor:
    | "above-hero-dish"
    | "point-to-hero-dish"
    | "point-to-drink"
    | "beside-table-left"
    | "beside-table-right"
    | "near-emotional-copy"
    | "near-insight-copy"
    | "near-community"
    | "corner-tl"
    | "corner-tr"
    | "corner-bl"
    | "corner-br";
  scale?: number;
};

export type TypographyZones = {
  textZone: Rect;
  primaryTextZone: Rect;
  secondaryTextZone?: Rect;
  tertiaryTextZone: Rect;
};

export type CompositionPlan = {
  layoutId: CompositionLayoutId;
  role: DoodleCafeSlideRole;
  subjects: SubjectAnalysis;
  /** @deprecated use subjects.protectedRegion */
  focalPoint: Rect;
  typographyZones: TypographyZones;
  /** @deprecated use typographyZones.textZone */
  textZone: Rect;
  primaryTextZone: Rect;
  secondaryTextZone?: Rect;
  tertiaryTextZone: Rect;
  negativeSpace: SubjectAnalysis["negativeSpace"];
  doodleZones: Rect[];
  narrativeDoodles: NarrativeDoodleSpec[];
  visualWeight: VisualWeightBudget;
  hierarchy: CompositionHierarchy;
  objectPosition: string;
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
  showAnchors?: boolean;
};
