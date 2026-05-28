import { getLockedPlacement } from "@/lib/doodleCafeLock";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import type { StyleReference } from "@/lib/styleReference";
import {
  buildTextZones,
  defaultFocalPoint,
  type FocalPoint,
  type TextZone,
} from "@/lib/textComposition";

export type PlacementRole = "hook" | "caption" | "cta" | "badge" | "sticker";

export type TextPlacementPlan = {
  focal: FocalPoint;
  captionZone: TextZone;
  hookZone?: TextZone;
  ctaZone?: TextZone;
  badgeZone: TextZone;
  stickerZones: TextZone[];
  layoutMode:
    | "top-left"
    | "top-center"
    | "bottom-band"
    | "floating-editorial"
    | "asymmetric";
  negativeSpaceScore: number;
  rationale: string;
};

function focalFromAnalysis(analysis: VisualAnalysis): FocalPoint {
  if (analysis.brightness < 0.4) {
    return { x: 0.5, y: 0.42 };
  }
  if (analysis.streetFoodScore > 0.6) {
    return { x: 0.48, y: 0.52 };
  }
  if (analysis.luxuryScore > 0.65) {
    return { x: 0.5, y: 0.4 };
  }
  return defaultFocalPoint();
}

function pickCaptionZone(
  zones: TextZone[],
  analysis: VisualAnalysis,
  style?: StyleReference | null
): TextZone {
  const safe = zones.filter((z) => z.safe);
  if (style?.textPlacement.floatingCards) {
    return (
      safe.find((z) => z.id === "top-left") ??
      safe[0] ??
      zones.find((z) => z.id === "bottom-curve")!
    );
  }
  if (style?.textPlacement.top || analysis.brightness > 0.65) {
    return (
      safe.find((z) => z.id === "top-left") ??
      safe.find((z) => z.id === "top-right") ??
      zones[0]
    );
  }
  return (
    safe.find((z) => z.id === "bottom-curve") ??
    safe[0] ??
    zones[zones.length - 1]
  );
}

export function analyzeTextPlacement(input: {
  analysis: VisualAnalysis;
  slideIndex?: number;
  styleReference?: StyleReference | null;
}): TextPlacementPlan {
  const focal = focalFromAnalysis(input.analysis);
  const zones = buildTextZones(focal, input.slideIndex ?? 1);
  const captionZone = pickCaptionZone(zones, input.analysis, input.styleReference);

  const brightCenter =
    input.analysis.brightness > 0.55 && input.analysis.warmth > 0.5;
  const negativeSpaceScore = brightCenter
    ? 0.72
    : input.analysis.brightness < 0.4
      ? 0.55
      : 0.65;

  let layoutMode: TextPlacementPlan["layoutMode"] = "bottom-band";
  if (input.styleReference?.textPlacement.floatingCards) {
    layoutMode = "floating-editorial";
  } else if (input.styleReference?.textPlacement.top) {
    layoutMode = "top-left";
  } else if (captionZone.id === "top-left" || captionZone.id === "top-right") {
    layoutMode = "top-center";
  } else if (input.analysis.streetFoodScore > 0.55) {
    layoutMode = "asymmetric";
  }

  const hookZone = zones.find((z) => z.id === "top-left" && z.safe);
  const ctaZone = zones.find((z) => z.id === "bottom-curve");
  const badgeZone =
    zones.find((z) => z.id === "top-right") ?? zones[1] ?? zones[0];
  const stickerZones = zones.filter(
    (z) => z.id === "top-left" || z.id === "side-right"
  );

  const rationale = [
    `Focal at ${Math.round(focal.x * 100)}%/${Math.round(focal.y * 100)}% keeps food visible.`,
    `${layoutMode} caption band avoids hero dish.`,
    negativeSpaceScore > 0.65
      ? "Strong negative space for type."
      : "Tighter frame — shorter lines recommended.",
  ].join(" ");

  return {
    focal,
    captionZone,
    hookZone,
    ctaZone,
    badgeZone,
    stickerZones,
    layoutMode,
    negativeSpaceScore,
    rationale,
  };
}

export type DoodleZoneRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export type DoodleTextPlacementPlan = {
  layoutMode: "top-left" | "top-center" | "bottom-card" | "floating-editorial";
  captionZone: DoodleZoneRect;
  burstZone: DoodleZoneRect;
  stickerZones: DoodleZoneRect[];
  /** Regions where doodles may appear (avoid food focal center). */
  doodleSafeRects: DoodleZoneRect[];
  foodSafeRect: DoodleZoneRect;
  negativeSpaceScore: number;
  rationale: string;
};

const DOODLE_W = 320;
const DOODLE_H = 400;

export function analyzeDoodleTextPlacement(input: {
  slideIndex?: number;
  styleReference?: StyleReference | null;
  analysis?: VisualAnalysis;
  width?: number;
  height?: number;
}): DoodleTextPlacementPlan {
  const w = input.width ?? DOODLE_W;
  const h = input.height ?? DOODLE_H;
  const slideIndex = input.slideIndex ?? 1;
  const locked = getLockedPlacement(slideIndex, w, h);

  const refDense = input.styleReference?.captionDensity === "dense";
  const refAiry = input.styleReference?.captionDensity === "minimal";

  let captionZone = { ...locked.captionZone };
  let burstZone = { ...locked.burstZone };

  if (refAiry) {
    captionZone = { ...captionZone, y: captionZone.y - 6, height: captionZone.height - 8 };
  } else if (refDense) {
    captionZone = { ...captionZone, height: captionZone.height + 10 };
  }

  if (input.styleReference?.textPlacement.top && !input.styleReference.textPlacement.floatingCards) {
    burstZone = { ...burstZone, y: 8, x: 12 };
  }

  const negativeSpaceScore = input.analysis
    ? input.analysis.brightness > 0.55 && input.analysis.warmth > 0.5
      ? 0.82
      : 0.65
    : 0.75;

  const rationale = [
    "Locked floating editorial — top-left headline band (reference layout).",
    "Food focal preserved; hero doodles in margins and lower frame.",
    refDense ? "Reference: tighter type rhythm." : refAiry ? "Reference: extra breathing room." : "Pinterest café spacing.",
    negativeSpaceScore > 0.75 ? "Strong asymmetry for handcrafted feel." : "Shorter lines recommended.",
  ].join(" ");

  return {
    layoutMode: locked.layoutMode,
    captionZone,
    burstZone,
    stickerZones: locked.stickerZones,
    doodleSafeRects: locked.doodleSafeRects,
    foodSafeRect: locked.foodSafeRect,
    negativeSpaceScore,
    rationale,
  };
}
