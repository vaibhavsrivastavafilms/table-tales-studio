import {
  type Captions,
  SLIDE_KEYS,
} from "@/lib/slides";

import type { DirectorProfile, HookIntensity } from "@/lib/directorProfile";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
const HISTORY_KEY = "tts:generation:history";
const MAX_HISTORY = 8;

type GenerationHistory = {
  hooks: string[];
  phrases: string[];
  variationIndex: number;
};

let cachedHistory: GenerationHistory = {
  hooks: [],
  phrases: [],
  variationIndex: 0,
};

function readHistory(): GenerationHistory {
  if (typeof window === "undefined") return cachedHistory;
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return cachedHistory;
    const parsed = JSON.parse(raw) as Partial<GenerationHistory>;
    cachedHistory = {
      hooks: Array.isArray(parsed.hooks) ? parsed.hooks.slice(-MAX_HISTORY) : [],
      phrases: Array.isArray(parsed.phrases)
        ? parsed.phrases.slice(-MAX_HISTORY * 3)
        : [],
      variationIndex:
        typeof parsed.variationIndex === "number" ? parsed.variationIndex : 0,
    };
  } catch {
    cachedHistory = { hooks: [], phrases: [], variationIndex: 0 };
  }
  return cachedHistory;
}

function writeHistory(history: GenerationHistory): void {
  cachedHistory = history;
  if (typeof window === "undefined") return;
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getVariationIndex(): number {
  const h = readHistory();
  return h.variationIndex;
}

export function nextVariationIndex(): number {
  const h = readHistory();
  const next = { ...h, variationIndex: h.variationIndex + 1 };
  writeHistory(next);
  return next.variationIndex;
}

const HOOK_VARIANTS: Record<HookIntensity, string[]> = {
  soft: [
    "Something quiet happens here —",
    "You might walk past this place —",
    "Not loud. Just unforgettable —",
  ],
  balanced: [
    "Nobody talks about this — until now.",
    "This corner changed how I eat.",
    "One visit. One obsession.",
  ],
  viral: [
    "People are driving 40 minutes for THIS dish.",
    "Stop scrolling — this stall is illegal good.",
    "I wasn't ready for this bite.",
  ],
};

export function pickVariedHook(
  baseHook: string,
  profile: DirectorProfile,
  analysis: VisualAnalysis
): string {
  const variants = HOOK_VARIANTS[profile.hookIntensity];
  const h = readHistory();
  const idx =
    (profile.sessionCount + h.variationIndex + Math.round(analysis.warmth * 10)) %
    variants.length;
  let candidate = variants[idx];

  if (h.hooks.includes(candidate)) {
    candidate = variants[(idx + 1) % variants.length];
  }

  if (baseHook.length > 12 && profile.hookIntensity === "soft") {
    return `${candidate} ${baseHook}`.trim();
  }
  if (profile.hookIntensity === "viral") {
    return candidate;
  }
  return `${candidate} ${baseHook.split(" ").slice(-6).join(" ")}`.trim();
}

function trimForDensity(text: string, density: DirectorProfile["captionDensity"]): string {
  if (density !== "minimal" || text.length <= 72) return text;
  const cut = text.lastIndexOf(" ", 68);
  return `${text.slice(0, cut > 20 ? cut : 68).trim()}…`;
}

function collectPhrases(captions: Captions): string[] {
  return SLIDE_KEYS.map((k) => captions[k]).filter(Boolean);
}

export function applyGenerationVariation(
  captions: Captions,
  input: {
    profile: DirectorProfile;
    analysis: VisualAnalysis;
    previousCaptions?: Captions;
    isRegenerate?: boolean;
  }
): Captions {
  const h = readHistory();
  const variationIdx = input.isRegenerate ? nextVariationIndex() : h.variationIndex;
  void variationIdx;

  const next = { ...captions };

  if (input.isRegenerate) {
    next.hook = pickVariedHook(next.hook, input.profile, input.analysis);
  }

  for (const key of SLIDE_KEYS) {
    if (key === "cta") continue;
    let line = next[key];
    for (const recent of h.phrases) {
      if (recent.length > 12 && line.includes(recent.slice(0, 24))) {
        line = line.replace(recent, "").replace(/\s+/g, " ").trim();
      }
    }
    next[key] = trimForDensity(line, input.profile.captionDensity);
  }

  if (input.previousCaptions && input.isRegenerate) {
    if (next.slide2 === input.previousCaptions.slide2) {
      next.slide2 = `${next.slide2} A different frame, same feeling.`.trim();
    }
  }

  return next;
}

export function recordGenerationHistory(captions: Captions): void {
  const h = readHistory();
  const phrases = collectPhrases(captions);
  const next: GenerationHistory = {
    hooks: [...h.hooks, captions.hook].slice(-MAX_HISTORY),
    phrases: [...h.phrases, ...phrases].slice(-MAX_HISTORY * 3),
    variationIndex: h.variationIndex,
  };
  writeHistory(next);
}

export function getRecentGenerationPhrases(): string[] {
  return readHistory().phrases;
}
