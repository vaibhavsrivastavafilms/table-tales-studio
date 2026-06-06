import type { LayoutZone } from "@/lib/layoutRedesignEngine";
import type { PhotoComposition } from "@/lib/renderers/types";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

function seed(slideIndex: number, salt: number): number {
  const x = Math.sin(slideIndex * 17.3 + salt * 9.1) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Photo analysis → hero subject + negative space for typography/doodles.
 * Uses visual analysis heuristics until vision API segmentation is wired.
 */
export function analyzePhotoComposition(input: {
  width: number;
  height: number;
  slideIndex: number;
  analysis: VisualAnalysis;
}): PhotoComposition {
  const { width: w, height: h, slideIndex, analysis } = input;
  const s = seed(slideIndex, 1);

  const centerY =
    analysis.luxuryScore > 0.6
      ? h * (0.36 + s * 0.06)
      : analysis.streetFoodScore > 0.55
        ? h * (0.42 + s * 0.05)
        : h * (0.38 + s * 0.08);

  const heroW = w * (0.62 + analysis.streetFoodScore * 0.08);
  const heroH = h * (0.48 + analysis.warmth * 0.06);
  const heroX = (w - heroW) / 2;
  const heroY = centerY - heroH * 0.35;

  const heroBounds: LayoutZone = {
    x: Math.round(heroX),
    y: Math.round(Math.max(h * 0.12, heroY)),
    width: Math.round(heroW),
    height: Math.round(Math.min(h * 0.72, heroH)),
  };

  const heroCenterX = heroBounds.x + heroBounds.width / 2;
  const heroCenterY = heroBounds.y + heroBounds.height / 2;

  const negativeSpaceTop: LayoutZone = {
    x: 0,
    y: 0,
    width: w,
    height: Math.max(48, heroBounds.y - 8),
  };

  const negativeSpaceBottom: LayoutZone = {
    x: 0,
    y: heroBounds.y + heroBounds.height + 8,
    width: w,
    height: Math.max(72, h - (heroBounds.y + heroBounds.height) - 8),
  };

  const backgroundBlurPx =
    analysis.luxuryScore > 0.55 ? 2.5 : analysis.brightness > 0.6 ? 1.5 : 2;

  return {
    heroBounds,
    heroCenterX,
    heroCenterY,
    negativeSpaceTop,
    negativeSpaceBottom,
    backgroundBlurPx,
    foodSharpness: 1.08,
    reasoning: `Hero focal at ${(heroCenterX / w * 100).toFixed(0)}%×${(heroCenterY / h * 100).toFixed(0)}% — food stays sharp, periphery softens ${backgroundBlurPx}px.`,
  };
}

export function pointInZone(
  x: number,
  y: number,
  zone: LayoutZone,
  padding = 12
): boolean {
  return (
    x >= zone.x - padding &&
    x <= zone.x + zone.width + padding &&
    y >= zone.y - padding &&
    y <= zone.y + zone.height + padding
  );
}

export function distanceToZoneEdge(x: number, y: number, zone: LayoutZone): number {
  const cx = Math.max(zone.x, Math.min(x, zone.x + zone.width));
  const cy = Math.max(zone.y, Math.min(y, zone.y + zone.height));
  return Math.hypot(x - cx, y - cy);
}
