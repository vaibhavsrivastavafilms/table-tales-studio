import {
  DOODLE_CAFE_REFERENCE_COPY,
  referenceCopyForSlide,
} from "@/lib/doodleCafeLock";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type EditorialBeat =
  | "hook"
  | "sensory"
  | "moment"
  | "witty"
  | "share"
  | "cta";

const SENSORY = [
  "Steam curls up\nlike it's trying to hug you.",
  "Butter light\non real food.",
  "The cup is warm.\nSo is everything else.",
];

const MOMENT = [
  "This is the slide\nyou send your best friend.",
  "Quiet café.\nLoud craving.",
  "Sunday energy\non a weekday.",
];

const WITTY = [
  "I'd share this plate.\nBut I probably won't.",
  "Emotionally expensive\nfor something so simple.",
  "Dangerous combo:\ncozy and carbs.",
];

const SHARE = [
  "Save for your next date night.",
  "Tag someone\nwho needs this warmth.",
  "The last bite\nis always the drama.",
];

const CTAS = [
  "Follow for more cozy food stories.",
  "Save · share · come back hungry.",
];

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

const BEAT_SALT: Record<EditorialBeat, number> = {
  hook: 0,
  sensory: 1,
  moment: 2,
  witty: 3,
  share: 4,
  cta: 5,
};

function seedFromAnalysis(analysis: VisualAnalysis, beat: EditorialBeat): number {
  const base = Math.round(
    analysis.warmth * 10 +
      analysis.brightness * 6 +
      (analysis.cafeComfortScore ?? 0) * 8
  );
  return base + BEAT_SALT[beat];
}

function hookForAnalysis(analysis: VisualAnalysis): string {
  const d = `${analysis.dishType ?? ""} ${analysis.cuisine ?? ""}`.toLowerCase();
  if (/noodle|maggi|ramen|pasta/.test(d)) {
    return "DOODLE THE\nNOODLES";
  }
  if (/coffee|latte|espresso|café|cafe/.test(d)) {
    return "COFFEE.\nCONVERSATIONS.\nCOMFORT.";
  }
  if (/drink|cocktail|mojito/.test(d)) {
    return "SIP.\nCHILL.\nREPEAT.";
  }
  return pick(DOODLE_CAFE_REFERENCE_COPY, seedFromAnalysis(analysis, "hook"));
}

export function generateEditorialLine(
  beat: EditorialBeat,
  analysis: VisualAnalysis
): string {
  const pools: Record<EditorialBeat, readonly string[]> = {
    hook: DOODLE_CAFE_REFERENCE_COPY,
    sensory: SENSORY,
    moment: MOMENT,
    witty: WITTY,
    share: SHARE,
    cta: CTAS,
  };
  if (beat === "hook") return hookForAnalysis(analysis);
  return pick(pools[beat], seedFromAnalysis(analysis, beat));
}

export function generateEditorialCarouselCopy(input: {
  analysis: VisualAnalysis;
  brandCta?: string;
}): {
  hook: string;
  slides: string[];
  cta: string;
} {
  const { analysis, brandCta } = input;
  const useReference =
    (analysis.cafeComfortScore ?? 0) > 0.5 || analysis.warmth > 0.5;

  if (useReference) {
    return {
      hook: hookForAnalysis(analysis),
      slides: [
        referenceCopyForSlide(2),
        referenceCopyForSlide(3),
        referenceCopyForSlide(4),
        referenceCopyForSlide(5),
        "",
      ],
      cta: brandCta?.trim() || referenceCopyForSlide(6),
    };
  }

  return {
    hook: generateEditorialLine("hook", analysis),
    slides: [
      generateEditorialLine("sensory", analysis),
      generateEditorialLine("moment", analysis),
      generateEditorialLine("witty", analysis),
      generateEditorialLine("share", analysis),
      "",
    ],
    cta: brandCta?.trim() || generateEditorialLine("cta", analysis),
  };
}

export function formatEditorialCaption(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }
  const words = trimmed.split(/\s+/);
  if (words.length <= 3) return [trimmed.toUpperCase()];
  const third = Math.ceil(words.length / 3);
  return [
    words.slice(0, third).join(" ").toUpperCase(),
    words.slice(third, third * 2).join(" ").toUpperCase(),
    words.slice(third * 2).join(" ").toUpperCase(),
  ].filter(Boolean);
}

export function editorialHighlightWords(): string[] {
  return [];
}
