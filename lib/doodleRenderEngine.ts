import { buildDoodlePromptBrief } from "@/lib/aiDoodleGenerator";
import { planEditorialLayout } from "@/lib/aiEditorialLayout";
import type { AiDesignModeId } from "@/lib/aiDesignModes";
import { buildDoodleComposition, type DoodleComposition } from "@/lib/doodleComposition";
import type { LayoutRedesign } from "@/lib/layoutRedesignEngine";
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
}): DoodleRenderPlan {
  const w = input.width ?? 320;
  const h = input.height ?? 400;

  const procedural = buildDoodleComposition({
    caption: input.caption,
    slideIndex: input.slideIndex,
    width: w,
    height: h,
    analysis: input.analysis,
    styleReference: input.styleReference,
    styleVision: input.styleVision,
    mood: input.mood,
  });

  const density =
    input.emotional.doodleDensity *
    (input.layout.variant === "doodle-heavy" ? 1.15 : input.layout.variant === "minimal-poetic" ? 0.55 : 1);

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
    useAiOverlay: density > 0.4,
    zones: input.layout.doodleZones,
  };
}
