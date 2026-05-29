import type { Captions } from "@/lib/slides";
import { SLIDE_KEYS } from "@/lib/slides";

const FORBIDDEN_PHRASES = [
  "must try",
  "must-try",
  "foodie heaven",
  "foodieheaven",
  "food porn",
  "yummy in my tummy",
  "drool-worthy",
  "to die for",
  "game changer",
  "game-changer",
  "literally obsessed",
  "hidden gem alert",
  "you won't believe",
  "omg this",
  "best ever",
  "life changing",
  "life-changing",
  "instagrammable",
  "tag your foodie",
  "foodie crew",
  "mouth watering",
  "mouth-watering",
];

const GENERIC_HOOKS = [
  "your story starts here",
  "every bite tells a story",
  "food that speaks",
  "flavors that bring people together",
];

const EMOJI_RUN = /(\p{Extended_Pictographic}[\uFE0F\u200D]?){4,}/gu;

const LUXURY_REPLACEMENTS: [RegExp, string][] = [
  [/\b(amazing|awesome|incredible)\b/gi, "remarkable"],
  [/\b(delicious|tasty|yummy)\b/gi, "memorable"],
  [/\b(foodie)\b/gi, "guest"],
  [/\b(omg|wow)\b/gi, ""],
  [/\s{2,}/g, " "],
];

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripForbidden(text: string): string {
  let out = text;
  for (const phrase of FORBIDDEN_PHRASES) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, "");
  }
  return normalize(out);
}

function capEmojis(text: string): string {
  const matches = text.match(/\p{Extended_Pictographic}/gu) ?? [];
  if (matches.length <= 2) return text;
  let count = 0;
  return text.replace(/\p{Extended_Pictographic}/gu, (m) => {
    count += 1;
    return count <= 2 ? m : "";
  });
}

export function refineLuxuryTone(text: string): string {
  let out = stripForbidden(text);
  out = out.replace(EMOJI_RUN, "");
  out = capEmojis(out);
  for (const [re, rep] of LUXURY_REPLACEMENTS) {
    out = out.replace(re, rep);
  }
  return normalize(out);
}

export function guardCaptionField(text: string, slideKey?: string): string {
  if (!text.trim()) return "";
  let out = refineLuxuryTone(text);
  if (slideKey === "cta") {
    out = out.replace(/!{2,}/g, "!");
    if (out.length > 72) {
      const words = out.split(/\s+/);
      out = words.slice(0, 12).join(" ");
    }
  }
  if (out.length > 220) {
    out = `${out.split(/\s+/).slice(0, 28).join(" ")}…`;
  }
  return out;
}

export function hookUniquenessScore(captions: Captions): number {
  const lines = SLIDE_KEYS.map((k) => captions[k]?.toLowerCase().trim()).filter(Boolean);
  if (lines.length < 2) return 1;
  let dupes = 0;
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[i] === lines[j]) dupes += 1;
      else if (
        lines[i].length > 12 &&
        lines[j].includes(lines[i].slice(0, Math.min(24, lines[i].length)))
      ) {
        dupes += 0.5;
      }
    }
  }
  return Math.max(0, 1 - dupes / 4);
}

function isGenericHook(hook: string): boolean {
  const lower = hook.toLowerCase();
  return GENERIC_HOOKS.some((g) => lower.includes(g));
}

function diversifyHook(hook: string, index: number): string {
  if (!isGenericHook(hook)) return hook;
  const alts = [
    "A quiet table. A louder first bite.",
    "Where the room slows down for one dish.",
    "This is the frame before the story spreads.",
  ];
  return alts[index % alts.length];
}

export function guardCaptions(input: Captions): Captions {
  const out = { ...input };
  let hookIdx = 0;

  for (const key of SLIDE_KEYS) {
    const raw = out[key];
    if (!raw?.trim()) continue;
    let cleaned = guardCaptionField(raw, key);
    if (key === "hook") {
      cleaned = diversifyHook(cleaned, hookIdx++);
    }
    out[key] = cleaned || raw.slice(0, 120);
  }

  const uniqueness = hookUniquenessScore(out);
  if (uniqueness < 0.55 && out.slide2 && out.slide3) {
    if (out.slide2.toLowerCase() === out.slide3.toLowerCase()) {
      out.slide3 = guardCaptionField(
        `${out.slide3.split(".")[0] ?? out.slide3} — the pause before the payoff.`
      );
    }
  }

  return out;
}

export function guardCaptionText(text: string): string {
  return guardCaptionField(text);
}
