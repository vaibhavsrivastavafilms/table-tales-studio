import { buildCampaignOverlayPrompt } from "@/lib/carousel-renderer/campaign-engine";
import { FRESH_FEELGOOD_CONSISTENCY_BLOCK } from "@/lib/carousel-renderer/campaigns/fresh-feelgood-food";
import {
  type AiDesignMode,
  type AiDesignModeId,
  getAiDesignMode,
} from "@/lib/aiDesignModes";

import type { AiLayoutPlan } from "@/lib/aiEditorialLayout";
import { adaptDoodleFromReference } from "@/lib/doodleStyleAdaptation";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type DoodlePromptBrief = {
  overlayPrompt: string;
  stickerPrompt: string;
  focus: string;
  negativePrompt: string;
};

const STYLE_LOCK =
  "hand-drawn white line art only, warm cinematic café editorial, imperfect human sketch quality, transparent background PNG, no text, no watermark, no photo background, no glossy 3D, no emojis, no childish cartoon, premium Pinterest storytelling";

const NEGATIVE =
  "text, letters, watermark, logo, photo, realistic faces, glossy render, vector flat icons, emoji, cluttered background, black rectangle";

function sceneContext(analysis: VisualAnalysis, caption: string): string {
  const parts = [
    analysis.cuisine,
    analysis.dishType,
    analysis.mood,
    analysis.ambience,
    caption.slice(0, 120),
  ].filter(Boolean);
  return parts.join(" · ");
}

function slideDoodleFocus(slideIndex: number, mode: AiDesignModeId): string {
  if (mode === "cozy-monsoon-cafe" && slideIndex === 3) {
    return "rain-on-window sketch lines, steam from cup, cozy tungsten warmth accents";
  }
  if (mode === "sketchbook-dining") {
    return "refined fine-dining ink lines, minimal plate garnish sketches, elegant negative space";
  }
  if (mode === "handwritten-memory-reel" && slideIndex >= 4) {
    return "memory flow arrows, polaroid frame doodles, nostalgic hand-drawn path";
  }
  switch (slideIndex) {
    case 1:
      return "hero food doodles: steam swirls, sparkle lines, sketch people sitting near table edge, flavor accents";
    case 2:
      return "café duo sketches, conversation energy, cups and chairs line art, ingredient outlines";
    case 3:
      return "emotional accents: hearts, mood arrows, steam, floating editorial stickers";
    case 4:
      return "comic burst accents, on-rim character sketch, playful Psh energy, yellow highlight shapes (no text)";
    case 5:
      return "save-spot storytelling: arrows, table duo, QR-adjacent frame doodles, map pin hints";
    case 6:
    default:
      return "memory reel closure: pin doodle, hearts, polaroid frame lines, gentle sparkle";
  }
}

function modeFlavor(mode: AiDesignMode): string {
  return mode.promptTone;
}

export function buildDoodlePromptBrief(input: {
  slideIndex: number;
  caption: string;
  mode: AiDesignModeId;
  analysis: VisualAnalysis;
  layout: AiLayoutPlan;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
}): DoodlePromptBrief {
  const campaignPrompt = buildCampaignOverlayPrompt(input.slideIndex);
  if (campaignPrompt) {
    return {
      overlayPrompt: campaignPrompt,
      stickerPrompt: [
        STYLE_LOCK,
        "floating yellow accent stars and marks only",
        FRESH_FEELGOOD_CONSISTENCY_BLOCK,
      ].join(". "),
      focus: `Campaign slide ${input.slideIndex} — unique doodle narrative`,
      negativePrompt: NEGATIVE,
    };
  }

  const mode = getAiDesignMode(input.mode);
  const adaptation = adaptDoodleFromReference(
    input.styleReference,
    input.styleVision
  );
  const density =
    adaptation.density === "airy"
      ? "sparse negative space"
      : adaptation.density === "rich"
        ? "rich doodle density"
        : "balanced editorial density";
  const scene = sceneContext(input.analysis, input.caption);
  const focus = slideDoodleFocus(input.slideIndex, input.mode);
  const rhythm =
    input.layout.rhythm === "crescendo"
      ? "cinematic crescendo pacing"
      : input.layout.rhythm === "punchy"
        ? "punchy asymmetrical rhythm"
        : "calm opening rhythm";

  const overlayPrompt = [
    STYLE_LOCK,
    modeFlavor(mode),
    `Scene: ${scene}`,
    focus,
    density,
    rhythm,
    "composition for 4:5 vertical food carousel overlay",
    "leave center-bottom food focal area relatively clear",
    adaptation.compositionLabel ?? "Pinterest café hand-drawn overlay hierarchy",
  ].join(". ");

  const stickerPrompt = [
    STYLE_LOCK,
    "floating editorial sticker cluster",
    modeFlavor(mode),
    `accent color hint ${adaptation.accentColor ?? "#f4c430"} as subtle yellow comic shapes only`,
    "small isolated sticker sheet, transparent PNG",
  ].join(". ");

  return {
    overlayPrompt,
    stickerPrompt,
    focus,
    negativePrompt: NEGATIVE,
  };
}
