import type { StyleReference } from "@/lib/styleReference";
import { defaultFocalPoint, type FocalPoint, type TextZone } from "@/lib/textComposition";

export type EditorialCompositionPlan = {
  focal: FocalPoint;
  captionZone: TextZone;
  burstZone: TextZone;
  ribbonZone: TextZone;
  accentZone?: TextZone;
  whitespaceRatio: number;
  cardRotation: number;
  layerDepth: "flat" | "layered" | "stacked";
  spacingScale: number;
};

const SLIDE_W = 320;
const SLIDE_H = 400;

function spacingForDensity(density: StyleReference["captionDensity"]): number {
  if (density === "minimal") return 1.15;
  if (density === "dense") return 0.88;
  return 1;
}

function rotationSeed(slideIndex: number, style: StyleReference): number {
  const base =
    style.compositionStyle.includes("asymmetric") ? 5 : 2;
  return ((slideIndex * 11 + style.borderRadius) % 7) - 3 + base * 0.3;
}

export function generateEditorialComposition(
  style: StyleReference,
  slideIndex: number,
  focal: FocalPoint = defaultFocalPoint()
): EditorialCompositionPlan {
  const spacing = spacingForDensity(style.captionDensity);
  const rot = rotationSeed(slideIndex, style);
  const floating = !!style.textPlacement.floatingCards;
  const topHeavy = !!style.textPlacement.top && !style.textPlacement.bottom;

  const captionZone: TextZone = topHeavy
    ? {
        id: "top-left",
        x: 16,
        y: 20,
        maxWidth: SLIDE_W - 32,
        rotation: -2 + rot * 0.4,
        safe: true,
      }
    : {
        id: "bottom-curve",
        x: 14,
        y: SLIDE_H - (style.captionDensity === "minimal" ? 96 : 112),
        maxWidth: SLIDE_W - 28,
        rotation: rot * 0.25,
        safe: true,
      };

  const burstZone: TextZone = floating
    ? {
        id: "top-right",
        x: SLIDE_W - 108,
        y: 18 + (slideIndex % 2) * 8,
        maxWidth: 92,
        rotation: 6 - rot * 0.5,
        safe: true,
      }
    : {
        id: "top-left",
        x: 14,
        y: 16,
        maxWidth: 120,
        rotation: -4 + rot * 0.35,
        safe: true,
      };

  const ribbonZone: TextZone = {
    id: "side-right",
    x: SLIDE_W - (style.captionDensity === "dense" ? 88 : 76),
    y: SLIDE_H * (floating ? 0.42 : 0.36),
    maxWidth: style.captionDensity === "dense" ? 72 : 64,
    rotation: 5 + rot * 0.3,
    safe: true,
  };

  const accentZone: TextZone | undefined = floating
    ? {
        id: "top-right",
        x: 20,
        y: SLIDE_H * 0.52,
        maxWidth: 100,
        rotation: -6 + rot * 0.2,
        safe: true,
      }
    : undefined;

  const whitespaceRatio =
    style.captionDensity === "minimal"
      ? 0.38
      : style.captionDensity === "dense"
        ? 0.18
        : 0.28;

  return {
    focal,
    captionZone,
    burstZone,
    ribbonZone,
    accentZone,
    whitespaceRatio,
    cardRotation: rot,
    layerDepth: floating ? "stacked" : style.shadowStyle.includes("deep") ? "layered" : "flat",
    spacingScale: spacing,
  };
}
