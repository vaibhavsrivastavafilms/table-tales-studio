import type { CaptionTone } from "@/lib/creatorMemory";
import type { DirectorProfile, StorytellingTone } from "@/lib/directorProfile";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type FoodLanguageTone =
  | CaptionTone
  | "gen-z"
  | "poetic-hindi"
  | "documentary";

const SENSORY_VERBS = [
  "lingers",
  "unfolds",
  "glows",
  "crackles",
  "melts",
  "whispers",
  "bursts",
];

const TONE_LINES: Record<StorytellingTone, (dish: string) => string> = {
  cinematic: (dish) =>
    `Steam drifted through the silence like memory around ${dish}.`,
  luxury: (dish) =>
    `Velvet parmesan folds into slow gold light — ${dish} as ritual.`,
  street: (dish) =>
    `Heat, smoke, and honest hunger — ${dish} hits the pavement running.`,
  emotional: (dish) =>
    `Some flavors feel like coming home. ${dish} is one of them.`,
};

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function resolveTone(
  tone: FoodLanguageTone,
  storytelling?: StorytellingTone
): FoodLanguageTone {
  if (storytelling === "luxury") return "luxury";
  if (storytelling === "street") return "raw";
  if (storytelling === "emotional") return "cinematic";
  return tone;
}

export function getSensoryLanguage(
  dish: string,
  tone: FoodLanguageTone = "cinematic",
  profile?: Pick<DirectorProfile, "storytellingTone" | "captionDensity">
): string {
  const base = dish.trim() || "the plate";
  const seed = base.length + tone.length;
  const resolved = resolveTone(tone, profile?.storytellingTone);

  if (profile?.storytellingTone && profile.captionDensity !== "dense") {
    const line = TONE_LINES[profile.storytellingTone](base);
    if (profile.captionDensity === "minimal") {
      return line.split("—")[0]?.trim() ?? line.slice(0, 64);
    }
    return line;
  }

  switch (resolved) {
    case "luxury":
      return `Velvet textures and slow gold light embrace ${base}.`;
    case "playful":
      return `${base} hits different — one bite, full chaos.`;
    case "raw":
      return `No filter: ${base}, honest heat, real smoke.`;
    case "founder":
      return `We built this around ${base} — every detail on purpose.`;
    case "gen-z":
      return `POV: ${base} just ended your diet era.`;
    case "poetic-hindi":
      return `Baarish ki khushboo aur ${base} — yaadein wapas laati hain.`;
    case "documentary":
      return `Frame by frame, ${base} tells where this kitchen began.`;
    default:
      return `${pick(SENSORY_VERBS, seed)} beneath cinematic light around ${base}.`;
  }
}

export function describeDish(
  analysis: VisualAnalysis,
  tone: FoodLanguageTone = "cinematic",
  profile?: Pick<DirectorProfile, "storytellingTone" | "captionDensity">
): string {
  const dish = analysis.dishType ?? "the signature plate";
  return getSensoryLanguage(dish, tone, profile);
}

const RELATIONSHIP_HOOKS = [
  "Simple.\nBut the kind of simple you think about later.",
  "Not luxury.\nJust emotionally expensive.",
  "Warm food.\nCold weather.\nDangerous combination.",
  "Not fancy.\nJust impossible to forget.",
];

export function getRelationshipHook(analysis: VisualAnalysis): string {
  const idx =
    Math.round(analysis.warmth * 10 + analysis.brightness * 5) %
    RELATIONSHIP_HOOKS.length;
  return RELATIONSHIP_HOOKS[idx];
}

export function getRelationshipCaption(
  analysis: VisualAnalysis,
  beat: "warm" | "contrast" | "witty" | "memory" = "warm"
): string {
  const pool: Record<typeof beat, string[]> = {
    warm: [
      `Warm ${analysis.dishType ?? "food"}.\nHonest craving.`,
      `Golden light on something humble.`,
    ],
    contrast: [
      "Not luxury.\nJust emotionally expensive.",
      "Simple plate.\nComplicated feelings.",
    ],
    witty: [
      "Dangerous combination:\ncomfort and carbs.",
      "I'd apologize for how much I ate.\nI'm not sorry.",
    ],
    memory: [
      "You'll think about this\nlonger than you expect.",
      "Tastes like Sunday\nif Sunday stayed.",
    ],
  };
  const lines = pool[beat];
  const idx = Math.round(analysis.warmth * 7 + analysis.streetFoodScore * 3) % lines.length;
  return lines[idx];
}

export function getRelationshipCta(analysis: VisualAnalysis): string {
  if (analysis.streetFoodScore > 0.55) {
    return "Save this.\nSend it to someone you eat with.";
  }
  return "Follow for the next warm chapter.";
}

export function enhanceFoodCaption(
  caption: string,
  analysis: VisualAnalysis,
  tone: FoodLanguageTone = "cinematic",
  profile?: Pick<DirectorProfile, "storytellingTone" | "captionDensity">
): string {
  const trimmed = caption.trim();
  if (trimmed.length > 80 && profile?.captionDensity !== "dense") return trimmed;
  if (!trimmed) return describeDish(analysis, tone, profile);
  const sensory = getSensoryLanguage(trimmed, tone, profile);
  if (profile?.captionDensity === "minimal") {
    return trimmed.length < 36 ? trimmed : trimmed.slice(0, 72).trim();
  }
  return trimmed.length < 24
    ? sensory
    : `${trimmed} — ${sensory.split("—")[0]?.trim() ?? sensory}`;
}
