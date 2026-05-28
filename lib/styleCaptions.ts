import type { Captions } from "@/lib/slides";
import type { StyleReference } from "@/lib/styleReference";

const HOOK_VOICES: Record<string, (hook: string) => string> = {
  "cozy emotional": (h) =>
    h.length > 60 ? h : `Simple. But emotionally expensive. ${polishShort(h)}`,
  "loud viral energy": (h) =>
    h.includes("gatekeep")
      ? h
      : `People are literally gatekeeping this spot. ${polishShort(h)}`,
  "refined evening": (h) =>
    h.length < 40 ? `Silence. Butter. Fire. ${polishShort(h)}` : polishLuxury(h),
  "poetic cinematic": (h) => polishCinematic(h),
  "warm cinematic": (h) => h,
};

function polishShort(s: string): string {
  const t = s.trim();
  if (!t || t.length < 12) return "";
  if (t.length > 48) return t.slice(0, 44).trim() + "…";
  return t;
}

function polishLuxury(s: string): string {
  return s
    .replace(/\b(!+)\b/g, "")
    .replace(/\bvery\b/gi, "")
    .trim();
}

function polishCinematic(s: string): string {
  if (s.length > 72) return s.slice(0, 68).trim() + "…";
  return s.replace(/—/g, " · ");
}

function adaptLine(line: string, tone: string, maxLen: number): string {
  if (!line.trim()) return line;
  let out = line.trim();
  if (tone.includes("viral") && out.length < maxLen - 20) {
    out = out.endsWith(".") ? out : `${out}.`;
  }
  if (tone.includes("minimal") || tone.includes("refined")) {
    out = out.split(". ").slice(0, 2).join(". ");
  }
  if (tone.includes("cozy") && out.split(" ").length > 14) {
    const words = out.split(/\s+/).slice(0, 12);
    out = words.join(" ") + (words.length >= 12 ? "…" : "");
  }
  return out.length > maxLen ? `${out.slice(0, maxLen - 1).trim()}…` : out;
}

/**
 * Adapts caption voice to reference aesthetic — inspired by, not copied.
 */
export function adaptCaptionsToStyle(
  captions: Captions,
  style: StyleReference | null | undefined
): Captions {
  if (!style) return captions;

  const tone = style.emotionalTone.toLowerCase();
  const voice =
    HOOK_VOICES[style.emotionalTone] ??
    HOOK_VOICES[tone.includes("viral") ? "loud viral energy" : "warm cinematic"];

  const maxHook = style.captionDensity === "minimal" ? 56 : style.captionDensity === "dense" ? 90 : 72;
  const maxSlide = style.captionDensity === "minimal" ? 64 : style.captionDensity === "dense" ? 100 : 80;

  let hook = captions.hook.trim() ? voice(captions.hook) : captions.hook;
  hook = adaptLine(hook, tone, maxHook);

  return {
    hook,
    slide1: adaptLine(captions.slide1, tone, maxSlide),
    slide2: adaptLine(captions.slide2, tone, maxSlide),
    slide3: adaptLine(captions.slide3, tone, maxSlide),
    slide4: adaptLine(captions.slide4, tone, maxSlide),
    cta: adaptLine(captions.cta, tone, maxSlide),
  };
}
