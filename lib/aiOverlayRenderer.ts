import type { CSSProperties } from "react";
import type { AiLayoutPlan } from "@/lib/aiEditorialLayout";
import type { TypographyLayer } from "@/lib/aiTypographyComposer";

export type AiSlideDesign = {
  slideIndex: number;
  overlayUrl: string | null;
  layout: AiLayoutPlan;
  typography: TypographyLayer;
  source: "ai" | "procedural";
  loading?: boolean;
  error?: string;
};

export function overlayImageStyle(
  design: AiSlideDesign | null | undefined
): CSSProperties {
  if (!design?.overlayUrl) return { display: "none" };
  return {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    pointerEvents: "none",
    zIndex: 16,
    opacity: design.source === "ai" ? 0.94 : 0,
    mixBlendMode: "normal",
    filter: "contrast(1.02) saturate(0.98)",
  };
}

export function proceduralDoodleOpacity(
  design: AiSlideDesign | null | undefined
): number {
  if (design?.overlayUrl && design.source === "ai") return 0.28;
  return 1;
}

export function captionZoneFromDesign(
  design: AiSlideDesign | null | undefined,
  fallback: { x: number; y: number; width: number; height: number; rotation: number }
): typeof fallback {
  if (!design) return fallback;
  const zone = design.layout.captionPlacement;
  if (zone === "bottom-card") {
    return {
      x: 10,
      y: fallback.y + fallback.height * 0.55,
      width: fallback.width,
      height: fallback.height,
      rotation: fallback.rotation,
    };
  }
  return fallback;
}

export function emptySlideDesign(slideIndex: number, layout: AiLayoutPlan, typography: TypographyLayer): AiSlideDesign {
  return {
    slideIndex,
    overlayUrl: null,
    layout,
    typography,
    source: "procedural",
  };
}
