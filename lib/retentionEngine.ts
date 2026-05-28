import type { Captions, SlideKey } from "@/lib/slides";
import { SLIDE_KEYS } from "@/lib/slides";
import type { DirectorProfile, PacingStyle } from "@/lib/directorProfile";

export type RetentionPatternId =
  | "curiosity-escalation"
  | "delayed-payoff"
  | "emotional-build"
  | "authority-proof"
  | "sensory-intrigue"
  | "pattern-interrupt";

export type RetentionPattern = {
  id: RetentionPatternId;
  label: string;
  hookPrefix: string;
  slideModifiers: Partial<Record<SlideKey, string>>;
};

const PATTERNS: RetentionPattern[] = [
  {
    id: "curiosity-escalation",
    label: "Curiosity escalation",
    hookPrefix: "Wait till slide 4 —",
    slideModifiers: {
      slide2: "But here's what nobody films…",
      slide4: "This is the moment everything clicks.",
    },
  },
  {
    id: "delayed-payoff",
    label: "Delayed payoff",
    hookPrefix: "Don't scroll yet —",
    slideModifiers: {
      slide3: "The payoff is closer than you think.",
      cta: "Save this before the secret spreads.",
    },
  },
  {
    id: "emotional-build",
    label: "Emotional build",
    hookPrefix: "",
    slideModifiers: {
      slide1: "Feel the room before the first bite.",
      slide3: "Your chest tightens — in the best way.",
    },
  },
  {
    id: "authority-proof",
    label: "Authority proof",
    hookPrefix: "Chefs don't post this —",
    slideModifiers: {
      slide2: "Technique you can taste in one frame.",
      slide4: "Proof in every garnish.",
    },
  },
  {
    id: "sensory-intrigue",
    label: "Sensory intrigue",
    hookPrefix: "Can you hear the sizzle?",
    slideModifiers: {
      slide1: "Steam, crackle, warmth — all in one swipe.",
      slide2: "Close your eyes for a second.",
    },
  },
  {
    id: "pattern-interrupt",
    label: "Pattern interrupt",
    hookPrefix: "Stop. Wrong scroll.",
    slideModifiers: {
      slide2: "Plot twist: it's even better in person.",
    },
  },
];

const PACING_MAP: Record<PacingStyle, RetentionPatternId> = {
  "slow-burn": "emotional-build",
  dynamic: "curiosity-escalation",
  "high-retention": "delayed-payoff",
};

export function getRetentionPattern(
  energy: string = "balanced",
  pacingStyle?: PacingStyle
): RetentionPattern {
  if (pacingStyle) {
    const id = PACING_MAP[pacingStyle];
    const match = PATTERNS.find((p) => p.id === id);
    if (match) return match;
  }
  if (energy === "high") {
    return PATTERNS.find((p) => p.id === "pattern-interrupt") ?? PATTERNS[0];
  }
  if (energy === "slow") {
    return PATTERNS.find((p) => p.id === "emotional-build") ?? PATTERNS[0];
  }
  return PATTERNS.find((p) => p.id === "curiosity-escalation") ?? PATTERNS[0];
}

export function injectRetentionHooks(
  captions: Captions,
  pattern: RetentionPattern,
  captionDensity: DirectorProfile["captionDensity"] = "balanced"
): Captions {
  const next = { ...captions };
  if (pattern.hookPrefix && !next.hook.startsWith(pattern.hookPrefix)) {
    next.hook = `${pattern.hookPrefix} ${next.hook}`.trim();
  }
  for (const key of SLIDE_KEYS) {
    const mod = pattern.slideModifiers[key];
    if (!mod) continue;
    if (captionDensity === "minimal" && mod.length > 28) continue;
    if (next[key].length < (captionDensity === "dense" ? 90 : 60)) {
      next[key] = `${mod} ${next[key]}`.trim();
    }
  }
  return next;
}

export function optimizeCarouselFlow(
  captions: Captions,
  captionDensity: DirectorProfile["captionDensity"] = "balanced"
): Captions {
  const next = { ...captions };
  if (captionDensity === "minimal") return next;
  if (next.slide4.length < 20 && next.slide3.length > 40) {
    const snippet =
      captionDensity === "dense"
        ? next.slide3.slice(0, 72)
        : next.slide3.slice(0, 48);
    next.slide4 = `The detail everyone misses: ${snippet}…`;
  }
  return next;
}
