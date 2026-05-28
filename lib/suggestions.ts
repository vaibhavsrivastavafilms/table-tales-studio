import type { Captions } from "@/lib/slides";
import type { ViralHookMode } from "@/lib/viralHooks";
import { getTrendingItems } from "@/lib/trends";

export type SuggestionKind =
  | "hook"
  | "cta"
  | "shorter"
  | "trending"
  | "punch-up";

export type CaptionSuggestion = {
  id: string;
  field: keyof Captions;
  kind: SuggestionKind;
  label: string;
  text: string;
};

const FOOD_PHRASES = [
  "still crackling",
  "first bite silence",
  "steam rising slow",
  "char at the edges",
  "sauce that clings",
];

function shortenCaption(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + "…";
}

function punchUp(text: string): string {
  const t = text.trim();
  if (!t) return t;
  if (t.endsWith(".") || t.endsWith("!")) return t;
  return `${t}.`;
}

function strongerCta(cta: string, mode: ViralHookMode): string {
  const base = cta.trim();
  if (!base) {
    const defaults: Record<ViralHookMode, string> = {
      viral: "Save this — you'll crave it tonight.",
      emotional: "Tell us where food first felt like home.",
      luxury: "Reserve your seat before the menu turns.",
      founder: "Follow the build — we're just getting started.",
      funny: "Tag who owes you this order.",
      aesthetic: "Save for your next mood board dinner.",
    };
    return defaults[mode];
  }
  if (base.length < 40) return `${base} — tap follow for the next drop.`;
  return base;
}

function strongerHook(hook: string, mode: ViralHookMode): string {
  const trend = getTrendingItems("hook")[0];
  if (!hook.trim()) return trend?.promptHint.split(".")[0] ?? "This bite changes the block.";
  const openers: Partial<Record<ViralHookMode, string>> = {
    viral: "Nobody talks about this part — ",
    emotional: "The meal I'll never forget started here: ",
    luxury: "They don't rush plates like this anymore. ",
  };
  const prefix = openers[mode];
  if (prefix && !hook.startsWith(prefix.trim())) {
    return `${prefix}${hook.charAt(0).toLowerCase()}${hook.slice(1)}`;
  }
  return hook;
}

export function generateCaptionSuggestions(
  captions: Captions,
  viralMode: ViralHookMode
): CaptionSuggestion[] {
  const out: CaptionSuggestion[] = [];
  const seed =
    captions.hook.length +
    captions.slide1.length +
    captions.slide2.length;
  const phrase = FOOD_PHRASES[seed % FOOD_PHRASES.length];

  if (captions.hook.trim()) {
    out.push({
      id: "hook-stronger",
      field: "hook",
      kind: "hook",
      label: "Stronger hook",
      text: strongerHook(captions.hook, viralMode),
    });
  }

  if (captions.cta.trim()) {
    out.push({
      id: "cta-optimize",
      field: "cta",
      kind: "cta",
      label: "Optimize CTA",
      text: strongerCta(captions.cta, viralMode),
    });
  }

  for (const key of ["slide1", "slide2", "slide3", "slide4"] as const) {
    const val = captions[key];
    if (val.trim().split(/\s+/).length > 14) {
      out.push({
        id: `short-${key}`,
        field: key,
        kind: "shorter",
        label: "Shorter",
        text: shortenCaption(val, 12),
      });
    }
  }

  const busyKey = (["slide2", "slide3"] as const).find(
    (k) => captions[k].trim().length > 0
  );
  if (busyKey) {
    out.push({
      id: "trend-phrase",
      field: busyKey,
      kind: "trending",
      label: "Trending phrasing",
      text: `${captions[busyKey].replace(/\.$/, "")} — ${phrase}.`,
    });
  }

  if (captions.hook.trim()) {
    out.push({
      id: "punch-hook",
      field: "hook",
      kind: "punch-up",
      label: "Punch up",
      text: punchUp(captions.hook),
    });
  }

  return out.slice(0, 6);
}
