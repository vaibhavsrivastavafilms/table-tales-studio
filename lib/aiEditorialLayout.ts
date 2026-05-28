import type { AiDesignModeId } from "@/lib/aiDesignModes";
import { getLockedPlacement } from "@/lib/doodleCafeLock";
import { analyzeDoodleTextPlacement } from "@/lib/textPlacement";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type AiLayoutPlan = {
  captionPlacement: "top-left" | "bottom-card" | "floating";
  doodleZones: { x: number; y: number; w: number; h: number }[];
  foodSafe: { x: number; y: number; w: number; h: number };
  negativeSpace: number;
  overlayFit: { x: number; y: number; w: number; h: number };
  density: number;
  rhythm: "calm" | "punchy" | "crescendo";
};

export function planEditorialLayout(input: {
  slideIndex: number;
  width?: number;
  height?: number;
  analysis: VisualAnalysis;
  mode: AiDesignModeId;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
}): AiLayoutPlan {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const placement = analyzeDoodleTextPlacement({
    slideIndex: input.slideIndex,
    styleReference: input.styleReference,
    analysis: input.analysis,
    width: w,
    height: h,
  });
  const locked = getLockedPlacement(input.slideIndex, w, h);

  let captionPlacement: AiLayoutPlan["captionPlacement"] = "top-left";
  if (input.mode === "emotional-food-journal" && input.slideIndex % 2 === 0) {
    captionPlacement = "floating";
  }
  if (placement.layoutMode === "bottom-card") {
    captionPlacement = "bottom-card";
  }

  const density =
    input.styleVision?.styleDna.density.includes("Dense")
      ? 0.9
      : input.styleReference?.captionDensity === "dense"
        ? 0.85
        : input.styleReference?.captionDensity === "minimal"
          ? 0.55
          : 0.72;

  const rhythm: AiLayoutPlan["rhythm"] =
    input.slideIndex <= 2 ? "calm" : input.slideIndex === 5 ? "crescendo" : "punchy";

  return {
    captionPlacement,
    doodleZones: locked.doodleSafeRects.map((r) => ({
      x: r.x,
      y: r.y,
      w: r.width,
      h: r.height,
    })),
    foodSafe: {
      x: placement.foodSafeRect.x,
      y: placement.foodSafeRect.y,
      w: placement.foodSafeRect.width,
      h: placement.foodSafeRect.height,
    },
    negativeSpace: placement.negativeSpaceScore,
    overlayFit: { x: 0, y: 0, w, h },
    density,
    rhythm,
  };
}
