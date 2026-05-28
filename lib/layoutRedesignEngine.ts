import type { EmotionalStyleProfile } from "@/lib/emotionalStylingEngine";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type LayoutZone = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export type SlideLayoutVariant =
  | "headline-top"
  | "giant-type"
  | "minimal-poetic"
  | "center-emotional"
  | "image-hero"
  | "doodle-heavy"
  | "cinematic-pause";

export type LayoutRedesign = {
  variant: SlideLayoutVariant;
  foodSafe: LayoutZone;
  captionZone: LayoutZone;
  doodleZones: LayoutZone[];
  stickerZones: LayoutZone[];
  gradientZones: { top?: string; bottom?: string; vignette: number };
  negativeSpace: number;
  visualWeight: "top" | "center" | "bottom";
  lightingBias: "warm" | "neutral" | "cool";
};

const VARIANTS: SlideLayoutVariant[] = [
  "headline-top",
  "giant-type",
  "minimal-poetic",
  "center-emotional",
  "image-hero",
  "doodle-heavy",
  "cinematic-pause",
];

function variantForSlide(
  slideIndex: number,
  style: EmotionalStyleProfile
): SlideLayoutVariant {
  const rhythm = style.captionRhythm;
  if (slideIndex === 1) return "headline-top";
  if (slideIndex === 2) return rhythm === "punchy" ? "giant-type" : "image-hero";
  if (slideIndex === 3) return "minimal-poetic";
  if (slideIndex === 4) return "center-emotional";
  if (slideIndex === 5) return style.doodleDensity > 0.7 ? "doodle-heavy" : "cinematic-pause";
  if (slideIndex === 6) return "cinematic-pause";
  return "headline-top";
}

export function redesignLayout(input: {
  slideIndex: number;
  width?: number;
  height?: number;
  analysis: VisualAnalysis;
  emotional: EmotionalStyleProfile;
}): LayoutRedesign {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const variant = VARIANTS.includes(variantForSlide(input.slideIndex, input.emotional))
    ? variantForSlide(input.slideIndex, input.emotional)
    : "headline-top";

  const foodH = variant === "image-hero" ? h * 0.72 : h * 0.58;
  const foodY = variant === "center-emotional" ? h * 0.22 : h * 0.28;

  const foodSafe: LayoutZone = {
    x: w * 0.12,
    y: foodY,
    width: w * 0.76,
    height: foodH,
  };

  let captionZone: LayoutZone;
  switch (variant) {
    case "giant-type":
      captionZone = { x: 8, y: 10, width: w - 16, height: 130, rotation: -2 };
      break;
    case "minimal-poetic":
      captionZone = { x: 14, y: h - 100, width: w - 28, height: 72, rotation: 0 };
      break;
    case "center-emotional":
      captionZone = { x: 12, y: h * 0.08, width: w - 24, height: 110, rotation: -1 };
      break;
    case "cinematic-pause":
      captionZone = { x: 10, y: 14, width: w - 20, height: 90, rotation: 0 };
      break;
    case "doodle-heavy":
      captionZone = { x: 10, y: 12, width: w * 0.55, height: 100, rotation: -3 };
      break;
    case "image-hero":
      captionZone = { x: 10, y: 10, width: w - 20, height: 96, rotation: 0 };
      break;
    default:
      captionZone = { x: 10, y: 12, width: w - 22, height: 118, rotation: input.slideIndex % 2 === 0 ? -1 : 0 };
  }

  const doodleZones: LayoutZone[] = [
    { x: 0, y: 0, width: w * 0.45, height: h * 0.35 },
    { x: w * 0.55, y: h * 0.55, width: w * 0.45, height: h * 0.42 },
    { x: w * 0.05, y: h * 0.62, width: w * 0.4, height: h * 0.35 },
  ];

  const stickerZones: LayoutZone[] = [
    { x: w - 72, y: 18, width: 64, height: 48, rotation: 8 },
    { x: w - 58, y: h * 0.38, width: 52, height: 44, rotation: 6 },
  ];

  const negativeSpace =
    input.analysis.brightness > 0.55 && input.analysis.warmth > 0.5 ? 0.8 : 0.65;

  return {
    variant,
    foodSafe,
    captionZone,
    doodleZones,
    stickerZones,
    gradientZones: {
      top: `linear-gradient(180deg, rgba(12,8,6,${0.42 * input.emotional.gradientStrength}) 0%, transparent 38%)`,
      bottom: `linear-gradient(0deg, rgba(12,8,6,${0.55 * input.emotional.gradientStrength}) 0%, transparent 45%)`,
      vignette: 0.28 + input.emotional.overlayWarmth * 0.2,
    },
    negativeSpace,
    visualWeight: variant === "minimal-poetic" ? "bottom" : "top",
    lightingBias: input.analysis.warmth > 0.55 ? "warm" : "neutral",
  };
}
