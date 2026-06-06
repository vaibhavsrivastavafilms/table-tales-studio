/**
 * Locked visual + narrative system for Editorial Doodle Story carousels.
 * Warm cinematic café · white sketch doodles · gold typography · 6-slide arc.
 */
import {
  DOODLE_CAFE_ACCENT,
  DOODLE_CAFE_CREAM,
  DOODLE_CAFE_ESPRESSO,
} from "@/lib/doodleCafeLock";
import {
  type Captions,
  SLIDE_KEYS,
} from "@/lib/slides";

import { createEmptyCaptions } from "@/lib/draftStorage";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { DoodleElement } from "@/lib/doodleSystem";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import type {
  BackgroundTreatment,
  EditorialCompositionKind,
  EditorialTypeMode,
  EditorialTypographyStyle,
} from "@/lib/editorialLayouts";
import { guardCaptions } from "@/lib/creativeGuardrails";

export const EDITORIAL_DOODLE_DISPLAY = "Editorial Doodle Story";

export type DoodleStorySlideRole =
  | "hero-hook"
  | "mood-atmosphere"
  | "food-steam"
  | "drink-pause"
  | "human-connection"
  | "cinematic-cta";

export const DOODLE_STORY_SLIDE_ROLES: DoodleStorySlideRole[] = [
  "hero-hook",
  "mood-atmosphere",
  "food-steam",
  "drink-pause",
  "human-connection",
  "cinematic-cta",
];

export type DoodleStoryArcFrame = {
  role: DoodleStorySlideRole;
  composition: EditorialCompositionKind;
  typeMode: EditorialTypeMode;
  typographyStyle: EditorialTypographyStyle;
  maxStackLayers: number;
  cutoutScale: number;
  rotation: number;
  negativeSpace: number;
  doodleBudget: number;
  backgroundTreatment: BackgroundTreatment;
};

/** Fixed 6-slide campaign rhythm — one cohesive editorial doodle story. */
export const DOODLE_STORY_ARC: readonly DoodleStoryArcFrame[] = [
  {
    role: "hero-hook",
    composition: "hero",
    typeMode: "hero-micro",
    typographyStyle: "hero-giant",
    maxStackLayers: 0,
    cutoutScale: 1.46,
    rotation: -3,
    negativeSpace: 0.42,
    doodleBudget: 0.26,
    backgroundTreatment: "dark-cinematic",
  },
  {
    role: "mood-atmosphere",
    composition: "minimal-editorial",
    typeMode: "minimal",
    typographyStyle: "editorial-bold",
    maxStackLayers: 0,
    cutoutScale: 1.04,
    rotation: 0,
    negativeSpace: 0.7,
    doodleBudget: 0.2,
    backgroundTreatment: "dark-cinematic",
  },
  {
    role: "food-steam",
    composition: "doodle-story",
    typeMode: "hero-micro",
    typographyStyle: "editorial-bold",
    maxStackLayers: 0,
    cutoutScale: 1.24,
    rotation: -4,
    negativeSpace: 0.52,
    doodleBudget: 0.44,
    backgroundTreatment: "dark-cinematic",
  },
  {
    role: "drink-pause",
    composition: "minimal-editorial",
    typeMode: "minimal",
    typographyStyle: "editorial-bold",
    maxStackLayers: 0,
    cutoutScale: 1.08,
    rotation: 1,
    negativeSpace: 0.76,
    doodleBudget: 0.12,
    backgroundTreatment: "dark-cinematic",
  },
  {
    role: "human-connection",
    composition: "magazine",
    typeMode: "hero-micro",
    typographyStyle: "handwritten-scribble",
    maxStackLayers: 0,
    cutoutScale: 1.14,
    rotation: 3,
    negativeSpace: 0.56,
    doodleBudget: 0.38,
    backgroundTreatment: "dark-cinematic",
  },
  {
    role: "cinematic-cta",
    composition: "hero",
    typeMode: "hero-only",
    typographyStyle: "hero-giant",
    maxStackLayers: 0,
    cutoutScale: 1.4,
    rotation: -2,
    negativeSpace: 0.44,
    doodleBudget: 0.22,
    backgroundTreatment: "dark-cinematic",
  },
] as const;

const APPROVED_LINES: Record<DoodleStorySlideRole, readonly string[]> = {
  "hero-hook": [
    "NOT JUST FOOD.\nIT'S A WHOLE FEELING.",
    "THIS TABLE.\nTHIS MOOD.\nTHIS MOMENT.",
    "WARM LIGHT.\nREAL CRAVINGS.",
  ],
  "mood-atmosphere": [
    "COFFEE.\nCONVERSATIONS.\nCOMFORT.",
    "LOW LIGHT.\nLOUD HEARTS.",
    "THE ROOM\nFEELS LIKE HOME.",
  ],
  "food-steam": [
    "STEAM RISES.\nCRAVINGS FOLLOW.",
    "HOT BOWLS.\nHAPPY MOOD.",
    "ONE BITE.\nEVERYTHING SLOWS.",
  ],
  "drink-pause": [
    "SIP.\nCHILL.\nREPEAT.",
    "PAUSE.\nSIP.\nBREATHE.",
    "SLOW MORNINGS.\nWARM CUPS.",
  ],
  "human-connection": [
    "THE BEST KINDS OF\nTALKS HAPPEN HERE.",
    "LAUGHTER.\nCLINKING CUPS.\nSTAYING LATE.",
    "TWO SEATS.\nONE STORY.",
  ],
  "cinematic-cta": [
    "GOOD FOOD.\nGOOD MOOD.\nSEE YOU SOON.",
    "COME BACK\nFOR THE FEELING.",
    "SAVE THIS SPOT.\nCOME HUNGRY.",
  ],
};

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function seed(analysis: VisualAnalysis, slideIndex: number): number {
  return (
    Math.round(analysis.warmth * 20 + (analysis.cafeComfortScore ?? 0) * 14) +
    slideIndex * 7
  );
}

function dishKind(analysis: VisualAnalysis): string {
  return `${analysis.dishType ?? ""} ${analysis.cuisine ?? ""} ${analysis.ambience ?? ""}`.toLowerCase();
}

export function lineForSlideRole(
  role: DoodleStorySlideRole,
  analysis: VisualAnalysis,
  slideIndex: number
): string {
  const d = dishKind(analysis);
  const s = seed(analysis, slideIndex);

  if (role === "hero-hook") {
    if (/noodle|maggi|ramen|pasta|bowl/.test(d)) return "DOODLE THE\nNOODLES";
    if (/coffee|latte|espresso|café|cafe/.test(d)) return "COFFEE.\nCONVERSATIONS.\nCOMFORT.";
    return pick(APPROVED_LINES["hero-hook"], s);
  }
  if (role === "food-steam") {
    if (/noodle|maggi|ramen/.test(d)) return "HOT MAGGI.\nHAPPY MOOD.";
    if (/burger|pizza|plate/.test(d)) return "STEAM RISES.\nCRAVINGS FOLLOW.";
    return pick(APPROVED_LINES["food-steam"], s);
  }
  if (role === "drink-pause") {
    if (/cocktail|mojito|drink|beverage/.test(d)) return "SIP.\nCHILL.\nREPEAT.";
    return pick(APPROVED_LINES["drink-pause"], s);
  }

  return pick(APPROVED_LINES[role], s);
}

export function generateDoodleStoryCaptions(input: {
  analysis: VisualAnalysis;
  brandCta?: string;
}): Captions {
  const captions: Captions = { ...createEmptyCaptions() };
  DOODLE_STORY_SLIDE_ROLES.forEach((role, i) => {
    const slideIndex = i + 1;
    const line = lineForSlideRole(role, input.analysis, slideIndex);
    const key = SLIDE_KEYS[i];
    if (key) captions[key] = line;
  });
  if (input.brandCta?.trim()) {
    captions.cta = input.brandCta.trim().slice(0, 120);
  }
  return guardCaptions(captions);
}

export function doodleStoryArcFrame(slideIndex: number): DoodleStoryArcFrame {
  const idx = Math.min(6, Math.max(1, slideIndex)) - 1;
  return DOODLE_STORY_ARC[idx];
}

export function buildStoryDoodles(input: {
  slideIndex: number;
  width?: number;
  height?: number;
  analysis?: VisualAnalysis;
}): DoodleElement[] {
  const w = input.width ?? 320;
  const h = input.height ?? 400;
  const role = doodleStoryArcFrame(input.slideIndex).role;
  const d = dishKind(input.analysis ?? ({} as VisualAnalysis));

  const edgeSteam = (x: number, y: number, scale: number, rot: number): DoodleElement => ({
    type: "steam",
    x,
    y,
    scale,
    rotation: rot,
  });

  switch (role) {
    case "hero-hook":
      return [
        { type: "human", variant: "duo-sitting", x: 22, y: h - 120, scale: 2.2, rotation: 0 },
        { type: "underline", x: 14, y: 96, scale: 1.05, rotation: -2 },
        { type: "sparkle", x: w - 48, y: 58, scale: 0.7, rotation: 8 },
      ];
    case "mood-atmosphere":
      return [
        { type: "human", variant: "table-duo", x: w - 112, y: h - 158, scale: 2.05, rotation: 4 },
        { type: "steam", x: 16, y: h - 210, scale: 0.95, rotation: -6 },
        { type: "circle", x: w - 36, y: 28, scale: 0.65, rotation: 0 },
      ];
    case "food-steam":
      return [
        edgeSteam(w - 78, 82, 1.2, 5),
        edgeSteam(22, 78, 1.05, -8),
        { type: "sparkle", x: 30, y: 68, scale: 0.85, rotation: 0 },
        ...( /coffee|drink/.test(d)
          ? [{ type: "steam" as const, x: w * 0.5 - 20, y: h * 0.35, scale: 0.9, rotation: 0 }]
          : []),
      ];
    case "drink-pause":
      return [
        { type: "human", variant: "on-rim", x: w - 120, y: h - 172, scale: 2.15, rotation: -5 },
        { type: "underline", x: w - 90, y: h - 228, scale: 0.9, rotation: 6 },
      ];
    case "human-connection":
      return [
        { type: "human", variant: "table-duo", x: 18, y: h - 148, scale: 1.9, rotation: -3 },
        { type: "heart", x: w - 54, y: 62, scale: 0.72, rotation: 10 },
        { type: "arrow", x: w - 112, y: h - 112, scale: 1.1, rotation: -24 },
      ];
    case "cinematic-cta":
    default:
      return [
        { type: "heart", x: w - 58, y: 60, scale: 0.7, rotation: 8 },
        { type: "pin", x: w * 0.5 - 18, y: h - 72, scale: 0.85, rotation: 0 },
        { type: "sparkle", x: 24, y: h - 92, scale: 0.8, rotation: 0 },
      ];
  }
}

export type DoodleStoryReferenceTuning = {
  doodleDensityMul: number;
  typographyScaleMul: number;
  warmthMul: number;
  collageDensityCap: number;
};

export function tuneFromReference(
  ref?: StyleReference | null,
  vision?: StyleVisionResult | null
): DoodleStoryReferenceTuning {
  const tuning: DoodleStoryReferenceTuning = {
    doodleDensityMul: 1,
    typographyScaleMul: 1,
    warmthMul: 1,
    collageDensityCap: 0.32,
  };
  const r = ref ?? vision?.reference;
  if (!r) return tuning;

  if (r.captionDensity === "minimal") {
    tuning.doodleDensityMul = 0.72;
    tuning.typographyScaleMul = 0.94;
    tuning.collageDensityCap = 0.2;
  } else if (r.captionDensity === "dense") {
    tuning.doodleDensityMul = 1.08;
    tuning.typographyScaleMul = 1.04;
  }

  if (r.stickerStyle?.includes("minimal")) tuning.doodleDensityMul *= 0.8;
  if (r.stickerStyle?.includes("doodle") || r.stickerStyle?.includes("hand")) {
    tuning.doodleDensityMul *= 1.05;
  }
  if (r.emotionalTone?.includes("warm") || r.aesthetic?.includes("café")) {
    tuning.warmthMul = 1.08;
  }

  const dna = vision?.styleDna;
  if (dna?.density === "airy") tuning.doodleDensityMul *= 0.85;
  if (dna?.density === "packed") tuning.doodleDensityMul *= 1.1;
  if (dna?.hierarchy === "type-first") tuning.typographyScaleMul *= 1.06;

  return tuning;
}

export const DOODLE_STORY_STYLE = {
  accent: DOODLE_CAFE_ACCENT,
  cream: DOODLE_CAFE_CREAM,
  espresso: DOODLE_CAFE_ESPRESSO,
  photoFilter:
    "contrast(1.04) saturate(1.08) brightness(0.96) sepia(0.18) hue-rotate(-10deg)",
  maxTypographyGroups: 3,
} as const;

export function isEditorialDoodleStoryLocked(
  templateId: string,
  emotionalId?: string
): boolean {
  return (
    templateId === "doodle-story" ||
    emotionalId === "editorial-doodle" ||
    emotionalId === "cozy-cafe" ||
    emotionalId === "pinterest-relationship"
  );
}
