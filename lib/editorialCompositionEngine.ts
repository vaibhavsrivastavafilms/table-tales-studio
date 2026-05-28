import type { LayoutRedesign } from "@/lib/layoutRedesignEngine";
import type { EmotionalStyleProfile } from "@/lib/emotionalStylingEngine";
import { generateEditorialComposition } from "@/lib/editorialComposition";
import type { StyleReference } from "@/lib/styleReference";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type EditorialSlideComposition = {
  layoutMode: "floating-editorial" | "asymmetric-stack" | "broken-grid";
  captionCard: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
  burstZone?: { x: number; y: number; width: number; height: number };
  cardStyle: "glass" | "floating" | "minimal";
  layerDepth: "flat" | "layered" | "stacked";
  whitespaceRatio: number;
  motionClass: string;
};

export function composeEditorialSlide(input: {
  slideIndex: number;
  layout: LayoutRedesign;
  emotional: EmotionalStyleProfile;
  analysis: VisualAnalysis;
  styleReference?: StyleReference | null;
  width?: number;
  height?: number;
}): EditorialSlideComposition {
  const w = input.width ?? 320;
  const ref = input.styleReference;
  const legacy = ref
    ? generateEditorialComposition(ref, input.slideIndex)
    : null;

  const card = input.layout.captionZone;
  let layoutMode: EditorialSlideComposition["layoutMode"] = "floating-editorial";
  if (input.layout.variant === "giant-type") {
    layoutMode = "broken-grid";
  } else if (input.layout.variant === "minimal-poetic") {
    layoutMode = "asymmetric-stack";
  }

  const cardStyle: EditorialSlideComposition["cardStyle"] =
    input.emotional.spacing === "airy"
      ? "minimal"
      : input.emotional.stickerEnergy > 0.7
        ? "floating"
        : "glass";

  return {
    layoutMode,
    captionCard: {
      x: card.x,
      y: card.y,
      width: card.width,
      height: card.height ?? 100,
      rotation: card.rotation ?? legacy?.cardRotation ?? 0,
    },
    burstZone: legacy?.burstZone
      ? {
          x: legacy.burstZone.x,
          y: legacy.burstZone.y,
          width: legacy.burstZone.maxWidth,
          height: 48,
        }
      : input.layout.variant === "giant-type"
        ? { x: w - 90, y: card.y + 40, width: 76, height: 40 }
        : undefined,
    cardStyle,
    layerDepth: legacy?.layerDepth ?? "layered",
    whitespaceRatio: input.layout.negativeSpace,
    motionClass:
      input.layout.variant === "cinematic-pause"
        ? "art-motion-slow"
        : input.emotional.captionRhythm === "punchy"
          ? "art-motion-punch"
          : "art-motion-float",
  };
}
