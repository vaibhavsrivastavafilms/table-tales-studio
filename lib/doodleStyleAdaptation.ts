import {
  DOODLE_CAFE_ACCENT,
  DOODLE_CAFE_BRIEF,
  isPinterestDoodleReference,
} from "@/lib/doodleCafeLock";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import type { DoodleDensity } from "@/lib/doodleSystem";

export type DoodleStyleAdaptation = {
  density: DoodleDensity;
  spacing: "tight" | "balanced" | "airy";
  handwrittenBalance: "minimal" | "mixed" | "script-heavy";
  emotionalTone: string;
  stickerStyle: string;
  accentColor?: string;
  composition: "floating-editorial" | "top-weighted" | "bottom-card";
  detectedStyleLabel: string;
  compositionLabel: string;
  narrativeLabel: string;
};

export function adaptDoodleFromReference(
  reference?: StyleReference | null,
  vision?: StyleVisionResult | null
): DoodleStyleAdaptation {
  const ref = reference ?? vision?.reference;
  if (!ref) {
    return defaultDoodleAdaptation();
  }

  const density = inferDoodleDensity(ref, vision);
  const spacing = inferSpacing(ref);
  const handwrittenBalance = inferHandwrittenBalance(ref);
  const composition = inferComposition(ref);
  const emotionalTone =
    ref.emotionalTone.includes("cozy") ||
    ref.aesthetic.includes("café") ||
    ref.aesthetic.includes("warm")
      ? "cozy-editorial"
      : ref.emotionalTone || "cozy-editorial";

  const stickerStyle = ref.stickerStyle.includes("doodle")
    ? ref.stickerStyle
    : ref.stickerStyle.includes("comic") || ref.stickerStyle.includes("burst")
      ? "doodle-comic"
      : "doodle-soft";

  const refYellow = ref.colorPalette.find((c) => {
    const h = c.toLowerCase();
    return h.includes("f4c") || h.includes("f7c") || h.includes("ffd");
  });
  const accentColor = refYellow ?? DOODLE_CAFE_ACCENT;

  return {
    density,
    spacing,
    handwrittenBalance,
    emotionalTone,
    stickerStyle,
    accentColor,
    composition,
    detectedStyleLabel: buildDetectedStyleLabel(ref, vision),
    compositionLabel: buildCompositionLabel(composition, spacing),
    narrativeLabel: buildNarrativeLabel(ref, emotionalTone),
  };
}

function defaultDoodleAdaptation(): DoodleStyleAdaptation {
  return {
    density: "balanced",
    spacing: "balanced",
    handwrittenBalance: "mixed",
    emotionalTone: "cozy-editorial",
    stickerStyle: "doodle",
    accentColor: DOODLE_CAFE_ACCENT,
    composition: "floating-editorial",
    detectedStyleLabel: DOODLE_CAFE_BRIEF.detectedStyle,
    compositionLabel: DOODLE_CAFE_BRIEF.composition,
    narrativeLabel: DOODLE_CAFE_BRIEF.narrative,
  };
}

function inferDoodleDensity(
  ref: StyleReference,
  vision?: StyleVisionResult | null
): DoodleDensity {
  if (ref.captionDensity === "minimal") return "airy";
  if (ref.captionDensity === "dense") return "rich";
  if (vision?.styleDna.density.includes("Dense")) return "rich";
  if (vision?.styleDna.density.includes("Airy")) return "airy";
  if (
    ref.stickerStyle.includes("burst") ||
    ref.stickerStyle.includes("comic") ||
    ref.compositionStyle.includes("asymmetric")
  ) {
    return "rich";
  }
  return "balanced";
}

function inferSpacing(ref: StyleReference): DoodleStyleAdaptation["spacing"] {
  if (
    ref.compositionStyle.includes("airy") ||
    ref.captionDensity === "minimal"
  ) {
    return "airy";
  }
  if (ref.captionDensity === "dense") return "tight";
  return "balanced";
}

function inferHandwrittenBalance(
  ref: StyleReference
): DoodleStyleAdaptation["handwrittenBalance"] {
  const t = ref.typographyStyle.toLowerCase();
  if (t.includes("script") || t.includes("hand") || t.includes("playful")) {
    return "script-heavy";
  }
  if (t.includes("bold") && t.includes("sans")) return "minimal";
  return "mixed";
}

function inferComposition(
  ref: StyleReference
): DoodleStyleAdaptation["composition"] {
  if (ref.textPlacement.floatingCards) return "floating-editorial";
  if (ref.textPlacement.top) return "top-weighted";
  return "bottom-card";
}

function buildDetectedStyleLabel(
  ref: StyleReference,
  vision?: StyleVisionResult | null
): string {
  if (vision?.inspiredBySummary) {
    const short = vision.inspiredBySummary.replace(/^Inspired by /i, "");
    if (short.length < 72) return `Warm editorial · ${short}`;
  }
  if (
    isPinterestDoodleReference(ref.aesthetic, ref.editorialFeel, ref.stickerStyle) ||
    vision?.styleDna.stickers.toLowerCase().includes("doodle")
  ) {
    return DOODLE_CAFE_BRIEF.detectedStyle;
  }
  return `Warm editorial · ${ref.aesthetic}`;
}

function buildCompositionLabel(
  composition: DoodleStyleAdaptation["composition"],
  spacing: DoodleStyleAdaptation["spacing"]
): string {
  const base =
    composition === "floating-editorial"
      ? "Floating handwritten Pinterest layout"
      : composition === "top-weighted"
        ? "Top-weighted editorial doodle bands"
        : "Bottom editorial card with side doodles";
  if (spacing === "airy") return `${base} · airy spacing`;
  if (spacing === "tight") return `${base} · tight rhythm`;
  return base;
}

function buildNarrativeLabel(ref: StyleReference, tone: string): string {
  if (tone.includes("cozy") || ref.emotionalTone.includes("warm")) {
    return "Cozy café relationship carousel";
  }
  if (ref.editorialFeel.includes("relationship")) {
    return "Illustrated relationship food storytelling";
  }
  return "Playful editorial food moments carousel";
}
