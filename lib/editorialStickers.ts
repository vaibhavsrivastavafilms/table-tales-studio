import type { EditorialCompositionPlan } from "@/lib/editorialComposition";
import {
  pickStickerZones,
  splitEditorialCaption,
  defaultFocalPoint,
  type FocalPoint,
} from "@/lib/textComposition";

export type EditorialStickerLayout = {
  burst: {
    text: string;
    x: number;
    y: number;
    rotation: number;
    maxWidth: number;
  };
  ribbon: {
    primary: string;
    secondary: string;
    rotation: number;
  };
  accent?: {
    text: string;
    x: number;
    y: number;
    rotation: number;
  };
};

const BURST_BY_MOOD: Record<string, string[]> = {
  warm: ["WARM.", "COZY.", "COMFORT.", "HUG IN A BOWL."],
  cozy: ["SIMPLE.", "NOT FANCY.", "HOMESTYLE.", "REAL."],
  cinematic: ["SIMPLE.", "QUIET.", "SLOW.", "HONEST."],
  street: ["HOT.", "ADDICTIVE.", "DANGEROUS.", "LATE NIGHT."],
  luxury: ["NOT LUXURY.", "REFINED.", "SLOW.", "WORTH IT."],
  default: ["SIMPLE.", "TOO GOOD.", "YES.", "THIS."],
};

const ACCENT_POOL = [
  "COMFORT FOOD.",
  "LATE NIGHT.",
  "BUT ADDICTIVE.",
  "EMOTIONALLY EXPENSIVE.",
  "DANGEROUS COMBO.",
];

function moodKey(mood?: string): string {
  if (!mood) return "default";
  const m = mood.toLowerCase();
  if (m.includes("warm") || m.includes("cozy")) return "warm";
  if (m.includes("street") || m.includes("energy")) return "street";
  if (m.includes("luxury") || m.includes("refined")) return "luxury";
  if (m.includes("cinematic")) return "cinematic";
  return "cozy";
}

function pickBurst(mood: string | undefined, slideIndex: number): string {
  const pool = BURST_BY_MOOD[moodKey(mood)] ?? BURST_BY_MOOD.default;
  return pool[(slideIndex + (mood?.length ?? 0)) % pool.length];
}

function pickAccent(slideIndex: number, exclude: string): string | undefined {
  const candidate = ACCENT_POOL[slideIndex % ACCENT_POOL.length];
  if (candidate.toLowerCase() === exclude.toLowerCase()) return undefined;
  return candidate;
}

export function generateEditorialLayout(input: {
  caption: string;
  slideIndex: number;
  mood?: string;
  focal?: FocalPoint;
  composition?: EditorialCompositionPlan;
}): EditorialStickerLayout {
  const focal = input.composition?.focal ?? input.focal ?? defaultFocalPoint();
  const zones = input.composition
    ? {
        burst: input.composition.burstZone,
        ribbon: input.composition.ribbonZone,
        accent: input.composition.accentZone,
      }
    : pickStickerZones(focal, input.slideIndex);
  const split = splitEditorialCaption(input.caption);

  const burstText =
    split.headline.length <= 18 && split.headline.length > 0
      ? split.headline.toUpperCase().replace(/\.$/, "") + "."
      : pickBurst(input.mood, input.slideIndex);

  const secondary =
    split.subline ||
    (input.slideIndex === 1
      ? "But the kind you think about later."
      : "Just emotionally expensive.");

  const accentText = split.accent ?? pickAccent(input.slideIndex, burstText);

  const layout: EditorialStickerLayout = {
    burst: {
      text: burstText,
      x: zones.burst.x,
      y: zones.burst.y,
      rotation: zones.burst.rotation,
      maxWidth: zones.burst.maxWidth,
    },
    ribbon: {
      primary: secondary,
      secondary: "",
      rotation: zones.ribbon.rotation,
    },
  };

  if (zones.accent && accentText && input.slideIndex % 2 === 0) {
    layout.accent = {
      text: accentText,
      x: zones.accent.x,
      y: zones.accent.y,
      rotation: zones.accent.rotation,
    };
  }

  return layout;
}

export function isEditorialTemplate(templateId: string): boolean {
  return templateId === "rich-relationship";
}
