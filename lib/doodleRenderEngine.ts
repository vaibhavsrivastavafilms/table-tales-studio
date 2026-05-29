import { buildDoodlePromptBrief } from "@/lib/aiDoodleGenerator";
import { planEditorialLayout } from "@/lib/aiEditorialLayout";
import type { AiDesignModeId } from "@/lib/aiDesignModes";
import {
  buildDoodleComposition,
  type DoodleComposition,
} from "@/lib/doodleComposition";
import type { DoodleElement } from "@/lib/doodleSystem";
import type { LayoutRedesign, LayoutZone } from "@/lib/layoutRedesignEngine";
import type { EmotionalStyleProfile } from "@/lib/emotionalStylingEngine";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type DoodleRenderPlan = {
  procedural: DoodleComposition;
  overlayPrompt: string;
  density: number;
  useAiOverlay: boolean;
  zones: LayoutRedesign["doodleZones"];
};

const SLIDE_DOODLE_BUDGET = [0.22, 0.1, 0.36, 0.08, 0.44, 0.3];
const MAX_DOODLES_BY_SLIDE = [4, 2, 5, 2, 6, 4];

function distanceToRectEdge(
  el: DoodleElement,
  rect: LayoutZone
): number {
  const half = 14 * (el.scale ?? 1);
  const cx = el.x + half;
  const cy = el.y + half;
  const inside =
    cx >= rect.x &&
    cx <= rect.x + rect.width &&
    cy >= rect.y &&
    cy <= rect.y + rect.height;
  if (inside) return 0;
  const dx = Math.max(rect.x - cx, 0, cx - (rect.x + rect.width));
  const dy = Math.max(rect.y - cy, 0, cy - (rect.y + rect.height));
  return Math.hypot(dx, dy);
}

/** Keep doodles that frame the hero — not on the plate, not random scatter. */
function curateDoodleElements(
  elements: DoodleElement[],
  foodSafe: LayoutZone,
  maxCount: number
): DoodleElement[] {
  if (elements.length <= maxCount) return elements;

  const scored = elements
    .map((el) => ({
      el,
      score:
        distanceToRectEdge(el, foodSafe) > 8
          ? 2 + Math.min(12, distanceToRectEdge(el, foodSafe) / 18)
          : -5,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, maxCount).map((s) => s.el);
  return picked.length > 0 ? picked : elements.slice(0, maxCount);
}

export function planDoodleRender(input: {
  caption: string;
  slideIndex: number;
  width?: number;
  height?: number;
  analysis: VisualAnalysis;
  emotional: EmotionalStyleProfile;
  layout: LayoutRedesign;
  mode: AiDesignModeId;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  mood?: string;
  doodleBudget?: number;
}): DoodleRenderPlan {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const slideIdx = Math.min(6, Math.max(1, input.slideIndex)) - 1;

  const proceduralBase = buildDoodleComposition({
    caption: input.caption,
    slideIndex: input.slideIndex,
    width: w,
    height: h,
    analysis: input.analysis,
    styleReference: input.styleReference,
    styleVision: input.styleVision,
    mood: input.mood,
  });

  const maxEl = MAX_DOODLES_BY_SLIDE[slideIdx] ?? 3;
  const food = input.layout.foodSafe;
  const elements = curateDoodleElements(
    proceduralBase.elements,
    food,
    maxEl
  );

  const procedural: DoodleComposition = {
    ...proceduralBase,
    elements,
    density: Math.min(1, proceduralBase.density * 0.9),
  };

  const slideBudget = input.doodleBudget ?? SLIDE_DOODLE_BUDGET[slideIdx] ?? 0.25;
  const luxury = input.analysis.luxuryScore > 0.62;
  let density =
    input.emotional.doodleDensity *
    slideBudget *
    (input.layout.variant === "doodle-heavy" ? 1.1 : input.layout.variant === "minimal-poetic" ? 0.5 : 0.85);

  if (luxury) density *= 0.5;
  if (input.slideIndex === 2 || input.slideIndex === 4) density *= 0.65;
  density = Math.min(0.52, Math.max(0.06, density));

  const aiLayout = planEditorialLayout({
    slideIndex: input.slideIndex,
    width: w,
    height: h,
    analysis: input.analysis,
    mode: input.mode,
    styleReference: input.styleReference,
    styleVision: input.styleVision,
  });

  const brief = buildDoodlePromptBrief({
    slideIndex: input.slideIndex,
    caption: input.caption,
    mode: input.mode,
    analysis: input.analysis,
    layout: { ...aiLayout, density, rhythm: aiLayout.rhythm },
    styleReference: input.styleReference,
    styleVision: input.styleVision,
  });

  return {
    procedural,
    overlayPrompt: brief.overlayPrompt,
    density,
    useAiOverlay: density > 0.32 && input.slideIndex !== 2 && input.slideIndex !== 4,
    zones: input.layout.doodleZones,
  };
}
