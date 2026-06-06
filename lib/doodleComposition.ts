import {
  getReferenceSlideBlueprint,
  type ReferenceSlideBlueprint,
} from "@/lib/doodleCafeLock";
import { buildStoryDoodles } from "@/lib/editorialDoodleStoryMode";
import { generateAmbientDoodles, type DoodleElement } from "@/lib/doodleSystem";
import { adaptDoodleFromReference, type DoodleStyleAdaptation } from "@/lib/doodleStyleAdaptation";
import {
  analyzeDoodleTextPlacement,
  type DoodleTextPlacementPlan,
} from "@/lib/textPlacement";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type DoodleComposition = {
  elements: DoodleElement[];
  placement: DoodleTextPlacementPlan;
  adaptation: DoodleStyleAdaptation;
  blueprint: ReferenceSlideBlueprint;
  captionCard: {
    x: number;
    y: number;
    width: number;
    rotation: number;
    layoutMode: DoodleTextPlacementPlan["layoutMode"];
  };
  scriptLine?: string;
  showQr?: boolean;
  showPin?: boolean;
  showSaveArrow?: boolean;
  density: number;
  rhythm: "organic" | "punchy";
};

export function buildDoodleComposition(input: {
  caption: string;
  slideIndex: number;
  width?: number;
  height?: number;
  analysis?: VisualAnalysis;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  mood?: string;
}): DoodleComposition {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const adaptation = adaptDoodleFromReference(
    input.styleReference,
    input.styleVision
  );

  const blueprint = getReferenceSlideBlueprint(input.slideIndex, w, h);
  const storyDoodles = buildStoryDoodles({
    slideIndex: input.slideIndex,
    width: w,
    height: h,
    analysis: input.analysis,
  });
  const placement = analyzeDoodleTextPlacement({
    slideIndex: input.slideIndex,
    styleReference: input.styleReference,
    analysis: input.analysis,
    width: w,
    height: h,
  });

  const ambient =
    adaptation.density === "airy"
      ? []
      : generateAmbientDoodles({
          slideIndex: input.slideIndex,
          width: w,
          height: h,
          density: adaptation.density === "rich" ? "balanced" : "airy",
        });

  const food = placement.foodSafeRect;
  const filterHero = (el: DoodleElement) => {
    const inFood =
      el.x > food.x &&
      el.x < food.x + food.width &&
      el.y > food.y &&
      el.y < food.y + food.height;
    return !inFood;
  };

  const elements = [...storyDoodles, ...ambient]
    .filter(filterHero)
    .slice(0, 6);

  const captionZone = blueprint.captionZone;

  return {
    elements,
    placement,
    adaptation,
    blueprint,
    captionCard: {
      x: captionZone.x,
      y: captionZone.y,
      width: captionZone.width,
      rotation: captionZone.rotation ?? 0,
      layoutMode: blueprint.layoutMode,
    },
    scriptLine: blueprint.scriptLine,
    showQr: blueprint.showQr,
    showPin: blueprint.showPin,
    showSaveArrow: blueprint.showSaveArrow,
    density:
      adaptation.density === "rich" ? 1 : adaptation.density === "airy" ? 0.55 : 0.78,
    rhythm: "organic",
  };
}
