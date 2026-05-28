/**
 * LOCKED CORE TEMPLATE — Doodle Café Stories
 * Visual DNA matched to reference carousel (Pinterest editorial doodles).
 */
import type { DoodleElement } from "@/lib/doodleSystem";
import type { TemplateVisualTreatment } from "@/lib/templates";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import type { DoodleZoneRect } from "@/lib/textPlacement";

export const DOODLE_CAFE_TEMPLATE_ID = "doodle-story" as const;

export const DOODLE_CAFE_DISPLAY_NAME = "Doodle Café Stories";

export const DOODLE_CAFE_ACCENT = "#f4c430";

export const DOODLE_CAFE_CREAM = "#fff8f0";

export const DOODLE_CAFE_ESPRESSO = "#1a120c";

export const DOODLE_CAFE_CARAMEL = "#3d2914";

/** Reference carousel copy (6 slides — hook → cta). */
export const DOODLE_CAFE_REFERENCE_COPY: readonly string[] = [
  "DOODLE THE\nNOODLES",
  "COFFEE.\nCONVERSATIONS.\nCOMFORT.",
  "HOT MAGGI.\nHAPPY MOOD.",
  "SIP.\nCHILL.\nREPEAT.",
  "THE BEST KINDS OF\nTALKS HAPPEN HERE.",
  "GOOD FOOD.\nGOOD MOOD.\nSEE YOU SOON!",
] as const;

export const DOODLE_CAFE_HOOKS = DOODLE_CAFE_REFERENCE_COPY;

export type ReferenceSlideBlueprint = {
  layoutMode: "floating-editorial";
  captionZone: DoodleZoneRect;
  scriptLine?: string;
  heroDoodles: DoodleElement[];
  showQr?: boolean;
  showPin?: boolean;
  showSaveArrow?: boolean;
};

export function getReferenceSlideBlueprint(
  slideIndex: number,
  width = 320,
  height = 400
): ReferenceSlideBlueprint {
  const topCaption: DoodleZoneRect = {
    x: 10,
    y: 12,
    width: width - 22,
    height: 118,
    rotation: slideIndex % 2 === 0 ? -1 : 0,
  };

  switch (slideIndex) {
    case 1:
      return {
        layoutMode: "floating-editorial",
        captionZone: topCaption,
        heroDoodles: [
          { type: "human", variant: "duo-sitting", x: 24, y: height - 118, scale: 2.35, rotation: 0 },
          { type: "underline", x: 12, y: 98, scale: 1.1, rotation: -2 },
        ],
      };
    case 2:
      return {
        layoutMode: "floating-editorial",
        captionZone: topCaption,
        heroDoodles: [
          { type: "human", variant: "table-duo", x: width - 108, y: height - 152, scale: 2.1, rotation: 4 },
          { type: "steam", x: 18, y: height - 200, scale: 1.05, rotation: -8 },
        ],
      };
    case 3:
      return {
        layoutMode: "floating-editorial",
        captionZone: topCaption,
        heroDoodles: [
          { type: "steam", x: width - 72, y: 88, scale: 1.15, rotation: 6 },
          { type: "sparkle", x: 28, y: 72, scale: 0.95, rotation: 0 },
          { type: "sparkle", x: width - 40, y: height - 100, scale: 0.8, rotation: 12 },
        ],
      };
    case 4:
      return {
        layoutMode: "floating-editorial",
        captionZone: topCaption,
        scriptLine: "Psh!",
        heroDoodles: [
          { type: "human", variant: "on-rim", x: width - 118, y: height - 168, scale: 2.25, rotation: -6 },
          { type: "speech", label: "Psh!", x: width - 52, y: height - 218, scale: 1.35, rotation: 8 },
        ],
      };
    case 5:
      return {
        layoutMode: "floating-editorial",
        captionZone: { ...topCaption, height: 128 },
        scriptLine: "SAVE THIS SPOT!",
        showQr: true,
        showSaveArrow: true,
        heroDoodles: [
          { type: "human", variant: "table-duo", x: 20, y: height - 140, scale: 1.95, rotation: -4 },
          { type: "arrow", x: width - 118, y: height - 108, scale: 1.2, rotation: -28 },
        ],
      };
    case 6:
    default:
      return {
        layoutMode: "floating-editorial",
        captionZone: topCaption,
        showPin: true,
        heroDoodles: [
          { type: "heart", x: width - 56, y: 64, scale: 0.75, rotation: 10 },
          { type: "sparkle", x: 22, y: height - 88, scale: 0.85, rotation: 0 },
        ],
      };
  }
}

export function getLockedPlacement(
  slideIndex: number,
  width = 320,
  height = 400
) {
  const bp = getReferenceSlideBlueprint(slideIndex, width, height);
  return {
    layoutMode: bp.layoutMode,
    burstZone: { x: 10, y: 8, width: 120, height: 40, rotation: -4 },
    captionZone: bp.captionZone,
    stickerZones: [
      { x: width - 78, y: 24, width: 68, height: 52, rotation: 7 },
      { x: width - 58, y: height * 0.34, width: 52, height: 44, rotation: 6 },
      { x: 6, y: height * 0.2, width: 58, height: 52, rotation: -10 },
    ],
    doodleSafeRects: [
      { x: 0, y: 0, width: width * 0.5, height: height * 0.32 },
      { x: width * 0.5, y: 0, width: width * 0.5, height: height * 0.35 },
      { x: 0, y: height * 0.45, width: width * 0.42, height: height * 0.55 },
      { x: width * 0.55, y: height * 0.48, width: width * 0.45, height: height * 0.52 },
    ],
    foodSafeRect: { x: 64, y: 118, width: 192, height: 160 },
  };
}

export function getLockedPhotoFilter(visual?: TemplateVisualTreatment): string {
  const sat = (visual?.imageSaturation ?? 1.09) + (visual?.saturationBoost ?? 0.06);
  const contrast = (visual?.imageContrast ?? 1.07) + (visual?.contrastBoost ?? 0.05);
  return [
    `contrast(${contrast.toFixed(2)})`,
    `saturate(${sat.toFixed(2)})`,
    "brightness(0.98)",
    "sepia(0.16)",
    "hue-rotate(-8deg)",
  ].join(" ");
}

export function getLockedOverlayLayers(): {
  vertical: string;
  vignette: string;
  tungsten: string;
} {
  return {
    vertical: `linear-gradient(180deg,
      rgba(10,8,6,0.5) 0%,
      rgba(26,18,12,0.12) 32%,
      transparent 50%,
      rgba(26,18,12,0.22) 70%,
      rgba(10,8,6,0.62) 100%)`,
    vignette:
      "radial-gradient(ellipse 90% 80% at 50% 42%, transparent 35%, rgba(10,8,6,0.38) 100%)",
    tungsten:
      "radial-gradient(ellipse 65% 45% at 28% 18%, rgba(244,196,48,0.1), transparent 68%)",
  };
}

export function getLockedPhotoTreatment(visual: TemplateVisualTreatment) {
  return {
    filter: getLockedPhotoFilter(visual),
    grain: visual.grainOpacity ?? 0.025,
    glow: visual.glowStrength ?? 0.04,
    borderRadius: visual.borderRadius ?? 28,
    overlayIntensity: visual.overlayIntensity ?? 0.18,
  };
}

export function scoreCafeComfort(analysis: VisualAnalysis): number {
  let score = analysis.warmth * 0.45;
  if (analysis.brightness > 0.38 && analysis.brightness < 0.8) score += 0.22;
  if (analysis.streetFoodScore < 0.55) score += 0.12;
  if (analysis.luxuryScore < 0.6) score += 0.08;
  const c = (analysis.cuisine ?? "").toLowerCase();
  const d = (analysis.dishType ?? "").toLowerCase();
  const a = (analysis.ambience ?? "").toLowerCase();
  if (c.includes("café") || c.includes("cafe") || a.includes("café") || a.includes("cozy")) {
    score += 0.2;
  }
  if (/maggi|noodle|comfort|dessert|drink|beverage|pastry|coffee|chai/.test(`${d} ${c}`)) {
    score += 0.18;
  }
  if (analysis.mood?.includes("cozy") || analysis.lighting?.includes("tungsten")) {
    score += 0.1;
  }
  return Math.min(1, score);
}

export function prefersDoodleCafeTemplate(analysis: VisualAnalysis): boolean {
  return scoreCafeComfort(analysis) >= 0.55;
}

export function isPinterestDoodleReference(
  aesthetic: string,
  editorialFeel: string,
  stickerStyle: string
): boolean {
  const blob = `${aesthetic} ${editorialFeel} ${stickerStyle}`.toLowerCase();
  return (
    blob.includes("pinterest") ||
    blob.includes("doodle") ||
    blob.includes("hand") ||
    blob.includes("café") ||
    blob.includes("cafe") ||
    blob.includes("editorial")
  );
}

export const DOODLE_CAFE_BRIEF = {
  detectedStyle: "Warm editorial doodle storytelling",
  narrative: "Cozy café relationship carousel",
  composition: "Floating handwritten Pinterest layout",
} as const;

export function referenceCopyForSlide(slideIndex: number): string {
  const i = Math.max(0, Math.min(DOODLE_CAFE_REFERENCE_COPY.length - 1, slideIndex - 1));
  return DOODLE_CAFE_REFERENCE_COPY[i] ?? DOODLE_CAFE_REFERENCE_COPY[0];
}
