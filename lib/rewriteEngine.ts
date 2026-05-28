import type { Captions } from "@/lib/slides";
import { SLIDE_KEYS } from "@/lib/slides";
import { sanitizeCaptions } from "@/lib/validation";

export type RewriteMode =
  | "cinematic"
  | "emotional"
  | "viral"
  | "luxury"
  | "genz"
  | "hindi-poetic"
  | "minimal-premium"
  | "documentary";

export const REWRITE_MODES: { id: RewriteMode; label: string }[] = [
  { id: "cinematic", label: "More cinematic" },
  { id: "emotional", label: "More emotional" },
  { id: "viral", label: "More viral" },
  { id: "luxury", label: "Luxury tone" },
  { id: "genz", label: "Gen-Z tone" },
  { id: "hindi-poetic", label: "Poetic Hindi" },
  { id: "minimal-premium", label: "Minimal premium" },
  { id: "documentary", label: "Documentary" },
];

type TransformFn = (text: string) => string;

const TRANSFORMS: Record<RewriteMode, TransformFn> = {
  cinematic: (t) => {
    const s = t.trim();
    if (!s) return s;
    return s.replace(/\.$/, "") + " — light cuts slow, story stays.";
  },
  emotional: (t) => {
    const s = t.trim();
    if (!s) return "Some meals become the place you miss.";
    if (s.toLowerCase().startsWith("i ")) return s;
    return `I still carry this: ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
  },
  viral: (t) => {
    const s = t.trim();
    if (!s) return "Nobody noticed this spot… until tonight.";
    if (s.length < 60) return `Wait — ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
    return s;
  },
  luxury: (t) => {
    const s = t.trim();
    if (!s) return "An evening reserved for those who notice craft.";
    return s.replace(/\b(good|nice|great)\b/gi, "exceptional");
  },
  genz: (t) => {
    const s = t.trim();
    if (!s) return "This spot is actually insane.";
    return s.replace(/\.$/, "") + " — no cap.";
  },
  "hindi-poetic": (t) => {
    const s = t.trim();
    if (!s) return "यह स्वाद शहर की यादों में बसता है।";
    return `${s} — जैसे पुरानी गली की खुशबू।`;
  },
  "minimal-premium": (t) => {
    const words = t.trim().split(/\s+/);
    if (words.length <= 6) return t.trim();
    return words.slice(0, 6).join(" ") + ".";
  },
  documentary: (t) => {
    const s = t.trim();
    if (!s) return "Here, the kitchen tells the truth before anyone orders.";
    return `On this block: ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
  },
};

function transformField(text: string, mode: RewriteMode): string {
  const fn = TRANSFORMS[mode];
  return fn(text).trim();
}

export function rewriteCaptions(
  captions: Captions,
  mode: RewriteMode
): Captions {
  const next = { ...captions };
  for (const key of SLIDE_KEYS) {
    if (next[key].trim()) {
      next[key] = transformField(next[key], mode);
    }
  }
  return sanitizeCaptions(next);
}

export function remixStory(captions: Captions, mode: RewriteMode): Captions {
  const remixed = rewriteCaptions(captions, mode);
  if (remixed.hook.trim() && remixed.slide1.trim()) {
    const temp = remixed.hook;
    remixed.hook = remixed.slide1;
    remixed.slide1 = temp;
  }
  return sanitizeCaptions(remixed);
}

export function enhanceCTA(cta: string, mode: RewriteMode): string {
  const base = transformField(cta || "Follow for the next chapter.", mode);
  const suffixes: Partial<Record<RewriteMode, string>> = {
    viral: " Save before it blows up.",
    luxury: " Reserve when ready.",
    documentary: " Build with us.",
    genz: " Send to your food person.",
  };
  const extra = suffixes[mode];
  if (extra && !base.includes(extra.trim())) return `${base}${extra}`;
  return base;
}
