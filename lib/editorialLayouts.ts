import {
  DOODLE_STORY_ARC,
  isEditorialDoodleStoryLocked,
  tuneFromReference,
} from "@/lib/editorialDoodleStoryMode";
import type { EmotionalStyleProfile } from "@/lib/emotionalStylingEngine";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { TemplateId } from "@/lib/templates";
import { isDoodleStoryTemplate } from "@/lib/templates";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type EditorialCompositionKind =
  | "hero"
  | "collage"
  | "magazine"
  | "minimal-editorial"
  | "doodle-story"
  | "product-stack"
  | "floating-ui";

export type BackgroundTreatment =
  | "paper"
  | "cream-card"
  | "dark-cinematic"
  | "noise-gradient"
  | "torn-paper"
  | "phone-frame";

export type DoodleFlowStyle = "organic" | "punk" | "minimal" | "playful" | "luxury";

export type EditorialTypographyStyle =
  | "editorial-bold"
  | "handwritten-scribble"
  | "micro-label"
  | "vertical-stack"
  | "curved-emphasis"
  | "hero-giant";

export type EditorialTypeMode = "hero-only" | "hero-micro" | "minimal";

/** Fixed 6-slide story arc — pacing, density, and energy must vary. */
const CAROUSEL_ARC: Array<{
  composition: EditorialCompositionKind;
  typeMode: EditorialTypeMode;
  typographyStyle: EditorialTypographyStyle;
  maxStackLayers: number;
  cutoutScale: number;
  rotation: number;
  negativeSpace: number;
  doodleBudget: number;
  backgroundTreatment: BackgroundTreatment;
}> = [
  {
    composition: "hero",
    typeMode: "hero-micro",
    typographyStyle: "hero-giant",
    maxStackLayers: 0,
    cutoutScale: 1.44,
    rotation: -3,
    negativeSpace: 0.38,
    doodleBudget: 0.22,
    backgroundTreatment: "noise-gradient",
  },
  {
    composition: "minimal-editorial",
    typeMode: "minimal",
    typographyStyle: "editorial-bold",
    maxStackLayers: 0,
    cutoutScale: 1.02,
    rotation: 0,
    negativeSpace: 0.72,
    doodleBudget: 0.1,
    backgroundTreatment: "dark-cinematic",
  },
  {
    composition: "collage",
    typeMode: "hero-micro",
    typographyStyle: "editorial-bold",
    maxStackLayers: 1,
    cutoutScale: 1.2,
    rotation: -5,
    negativeSpace: 0.48,
    doodleBudget: 0.38,
    backgroundTreatment: "paper",
  },
  {
    composition: "minimal-editorial",
    typeMode: "minimal",
    typographyStyle: "micro-label",
    maxStackLayers: 0,
    cutoutScale: 1.06,
    rotation: 2,
    negativeSpace: 0.78,
    doodleBudget: 0.08,
    backgroundTreatment: "cream-card",
  },
  {
    composition: "magazine",
    typeMode: "hero-micro",
    typographyStyle: "handwritten-scribble",
    maxStackLayers: 0,
    cutoutScale: 1.14,
    rotation: 4,
    negativeSpace: 0.52,
    doodleBudget: 0.42,
    backgroundTreatment: "paper",
  },
  {
    composition: "hero",
    typeMode: "hero-only",
    typographyStyle: "hero-giant",
    maxStackLayers: 0,
    cutoutScale: 1.4,
    rotation: -2,
    negativeSpace: 0.42,
    doodleBudget: 0.28,
    backgroundTreatment: "noise-gradient",
  },
];

export type EditorialLayoutPlan = {
  composition: EditorialCompositionKind;
  cutoutScale: number;
  rotation: number;
  overlapDepth: number;
  backgroundTreatment: BackgroundTreatment;
  doodleFlow: DoodleFlowStyle;
  typographyStyle: EditorialTypographyStyle;
  typeMode: EditorialTypeMode;
  negativeSpace: number;
  maxStackLayers: number;
  doodleBudget: number;
  parallaxOffset: { x: number; y: number };
  asymmetryBias: number;
  collageDensity: number;
  usePhoneFrame: boolean;
  useTornMask: boolean;
  stickerEnergy: number;
  allowScriptAccent: boolean;
};

function referenceRhythm(
  ref: StyleReference | null | undefined,
  vision: StyleVisionResult | null | undefined,
  slideIndex: number
): {
  collageDensity: number;
  doodleFlow: DoodleFlowStyle;
  asymmetry: number;
} {
  const baseDensity =
    ref?.captionDensity === "dense"
      ? 0.55
      : ref?.captionDensity === "minimal"
        ? 0.28
        : 0.4;
  const visionDensity =
    vision?.styleDna.density === "packed"
      ? 0.5
      : vision?.styleDna.density === "airy"
        ? 0.25
        : baseDensity;

  const collageDensity = slideIndex === 3 ? visionDensity : Math.min(0.35, visionDensity);

  let doodleFlow: DoodleFlowStyle = "organic";
  if (ref?.editorialFeel?.includes("luxury") || vision?.styleDna.stickers === "refined") {
    doodleFlow = "luxury";
  } else if (ref?.stickerStyle?.includes("minimal")) {
    doodleFlow = "minimal";
  } else if (ref?.stickerStyle?.includes("punk") || ref?.stickerStyle?.includes("bold")) {
    doodleFlow = slideIndex === 5 ? "punk" : "organic";
  } else if (ref?.stickerStyle?.includes("play")) {
    doodleFlow = slideIndex === 5 ? "playful" : "organic";
  }

  const asymmetry =
    ref?.compositionStyle?.includes("asymmetric") ||
    ref?.textPlacement?.floatingCards
      ? 0.62
      : 0.48;

  return { collageDensity, doodleFlow, asymmetry };
}

function kindForSlide(
  slideIndex: number,
  emotional: EmotionalStyleProfile,
  arc: (typeof CAROUSEL_ARC)[0]
): EditorialCompositionKind {
  if (slideIndex === 5 && emotional.doodleDensity > 0.72 && emotional.stickerEnergy > 0.65) {
    return "doodle-story";
  }
  return arc.composition;
}

export function pickEditorialLayout(input: {
  slideIndex: number;
  width?: number;
  height?: number;
  analysis: VisualAnalysis;
  emotional: EmotionalStyleProfile;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  templateId?: TemplateId;
}): EditorialLayoutPlan {
  const idx = Math.min(6, Math.max(1, input.slideIndex)) - 1;
  const storyLock =
    isEditorialDoodleStoryLocked(
      input.templateId ?? "",
      input.emotional.id
    ) || isDoodleStoryTemplate(input.templateId ?? "street-food");
  const arc = storyLock ? DOODLE_STORY_ARC[idx] : CAROUSEL_ARC[idx];
  const refTune = storyLock
    ? tuneFromReference(input.styleReference, input.styleVision)
    : null;
  const rhythm = referenceRhythm(
    input.styleReference,
    input.styleVision,
    input.slideIndex
  );
  if (refTune) {
    rhythm.collageDensity = Math.min(
      refTune.collageDensityCap,
      rhythm.collageDensity
    );
  }
  const composition = storyLock
    ? arc.composition
    : kindForSlide(input.slideIndex, input.emotional, arc);

  const luxury = input.analysis.luxuryScore > 0.62;
  let doodleBudget =
    arc.doodleBudget * (refTune?.doodleDensityMul ?? 1) * (luxury ? 0.55 : 1);
  if (rhythm.doodleFlow === "luxury" || rhythm.doodleFlow === "minimal") {
    doodleBudget *= 0.65;
  } else if (rhythm.doodleFlow === "playful" && input.slideIndex === 5) {
    doodleBudget = Math.min(0.55, doodleBudget * 1.15);
  }

  let backgroundTreatment = arc.backgroundTreatment;
  if (composition === "minimal-editorial" && !storyLock) {
    backgroundTreatment = luxury ? "cream-card" : "dark-cinematic";
  }
  if (storyLock) {
    backgroundTreatment = "dark-cinematic";
  }

  const asymmetryBias = rhythm.asymmetry;
  const rot = arc.rotation + (asymmetryBias - 0.5) * 4;

  let typographyStyle = arc.typographyStyle;
  if (luxury && input.slideIndex !== 1 && input.slideIndex !== 6) {
    typographyStyle =
      typographyStyle === "handwritten-scribble" ? "editorial-bold" : typographyStyle;
  }

  return {
    composition,
    cutoutScale: arc.cutoutScale,
    rotation: rot,
    overlapDepth: arc.maxStackLayers,
    backgroundTreatment,
    doodleFlow: rhythm.doodleFlow,
    typographyStyle,
    typeMode: arc.typeMode,
    negativeSpace: arc.negativeSpace,
    maxStackLayers: arc.maxStackLayers,
    doodleBudget,
    parallaxOffset: {
      x: (input.slideIndex % 2 === 0 ? 8 : -10) * asymmetryBias,
      y: (input.slideIndex - 3.5) * 4,
    },
    asymmetryBias,
    collageDensity: rhythm.collageDensity,
    usePhoneFrame: false,
    useTornMask: composition === "collage" && rhythm.collageDensity > 0.45,
    stickerEnergy: Math.min(0.55, input.emotional.stickerEnergy * (luxury ? 0.5 : 0.85)),
    allowScriptAccent:
      storyLock && input.slideIndex === 5
        ? doodleBudget > 0.28
        : input.slideIndex === 5 && doodleBudget > 0.3,
  };
}
