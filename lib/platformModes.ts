import type { CaptionTone } from "@/lib/creatorMemory";
import type { ViralHookMode } from "@/lib/viralHooks";

export type PlatformModeId =
  | "instagram-carousel"
  | "reels-voiceover"
  | "shorts-script"
  | "tiktok-story"
  | "founder-documentary"
  | "food-reel"
  | "luxury-campaign";

export type PlatformMode = {
  id: PlatformModeId;
  label: string;
  hookBehavior: string;
  pacing: string;
  ctaStyle: string;
  density: "sparse" | "balanced" | "dense";
  suggestedViralMode: ViralHookMode;
  suggestedTone: CaptionTone;
};

export const PLATFORM_MODES: PlatformMode[] = [
  {
    id: "instagram-carousel",
    label: "Instagram Carousel",
    hookBehavior: "Pattern interrupt in slide 1; curiosity gap before slide 2.",
    pacing: "One beat per slide; micro-cliffhangers between slides.",
    ctaStyle: "Save, share, tag — low friction community CTA.",
    density: "balanced",
    suggestedViralMode: "viral",
    suggestedTone: "cinematic",
  },
  {
    id: "reels-voiceover",
    label: "Reels Voiceover",
    hookBehavior: "Spoken-hook energy; first line sounds like voiceover cold open.",
    pacing: "Breathable sentences; rhythm for 15–30s read-aloud.",
    ctaStyle: "Comment trigger or follow for part 2.",
    density: "sparse",
    suggestedViralMode: "emotional",
    suggestedTone: "cinematic",
  },
  {
    id: "shorts-script",
    label: "Shorts Script",
    hookBehavior: "Zero-setup punch; first 3 seconds = scroll stop.",
    pacing: "Rapid cuts implied; each line = new beat.",
    ctaStyle: "Subscribe / watch next — urgency without hype.",
    density: "dense",
    suggestedViralMode: "viral",
    suggestedTone: "playful",
  },
  {
    id: "tiktok-story",
    label: "TikTok Storytelling",
    hookBehavior: "Confessional or hot-take opener; relatability first.",
    pacing: "Chaotic authenticity; plot twist mid-carousel.",
    ctaStyle: "Stitch this / tag your food twin.",
    density: "dense",
    suggestedViralMode: "funny",
    suggestedTone: "raw",
  },
  {
    id: "founder-documentary",
    label: "Founder Documentary",
    hookBehavior: "Origin tension — why this food exists.",
    pacing: "Problem → insight → product truth → mission.",
    ctaStyle: "Join the movement; build in public invitation.",
    density: "balanced",
    suggestedViralMode: "founder",
    suggestedTone: "founder",
  },
  {
    id: "food-reel",
    label: "Food Reel",
    hookBehavior: "Sensory ASMR-adjacent hook; texture and sound implied.",
    pacing: "Visual-first captions; minimal words, max mood.",
    ctaStyle: "Craving CTA — visit, order, save recipe.",
    density: "sparse",
    suggestedViralMode: "aesthetic",
    suggestedTone: "cinematic",
  },
  {
    id: "luxury-campaign",
    label: "Luxury Campaign",
    hookBehavior: "Exclusivity + craft; aspirational restraint.",
    pacing: "Elegant reveals; fewer words, more weight.",
    ctaStyle: "Private tasting, reservation, white-glove follow.",
    density: "sparse",
    suggestedViralMode: "luxury",
    suggestedTone: "luxury",
  },
];

const byId = new Map(PLATFORM_MODES.map((m) => [m.id, m]));

export function parsePlatformMode(value: unknown): PlatformModeId {
  if (typeof value === "string" && byId.has(value as PlatformModeId)) {
    return value as PlatformModeId;
  }
  return "instagram-carousel";
}

export function getPlatformMode(id: PlatformModeId): PlatformMode {
  return byId.get(id) ?? PLATFORM_MODES[0];
}

export function getPlatformModeGuide(id: PlatformModeId): string {
  const m = getPlatformMode(id);
  return `
Platform mode: ${m.label}
Hook behavior: ${m.hookBehavior}
Caption pacing: ${m.pacing}
CTA style: ${m.ctaStyle}
Story density: ${m.density}
`.trim();
}
