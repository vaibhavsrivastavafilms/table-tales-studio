import type { TemplateId } from "@/lib/templates";
import type { NichePreference } from "@/lib/creatorMemory";
import type { ViralHookMode } from "@/lib/viralHooks";

export type CreativeDirection = {
  shots: string[];
  camera: string[];
  mood: string[];
  pacing: string[];
  music: string[];
  lighting: string[];
};

const BASE: CreativeDirection = {
  shots: [],
  camera: [],
  mood: [],
  pacing: [],
  music: [],
  lighting: [],
};

const TEMPLATE_DIRECTION: Record<TemplateId, Partial<CreativeDirection>> = {
  "street-food": {
    shots: ["Wide establishing of stall", "Macro sizzle on the griddle", "Hands passing the plate"],
    camera: ["Handheld emotional realism", "Quick rack focus to steam"],
    mood: ["Raw, communal, late-night hunger"],
    pacing: ["Hook in 2s — cut on the first bite reaction"],
    music: ["Ambient street + distant kitchen clatter"],
    lighting: ["Warm practicals, neon spill, no flat overhead"],
  },
  "cinematic-dark": {
    shots: ["Silhouette plate reveal", "Slow push-in during hook", "Detail on sauce gloss"],
    camera: ["Slow push-in during hook", "Stabilized glide on hero dish"],
    mood: ["Noir appetite — restraint, tension, payoff"],
    pacing: ["Hold beats 0.5s longer than feels comfortable"],
    music: ["Low pulse drone, single piano note"],
    lighting: ["Warm tungsten shadows, rim light on steam"],
  },
  "founder-story": {
    shots: ["Empty kitchen before service", "Founder mid-plate", "First customer reaction"],
    camera: ["Documentary shoulder cam", "Interview frame on hook line"],
    mood: ["Honest, mission-led, build-in-public"],
    pacing: ["Voice-led hook → proof slides → invitation"],
    music: ["Soft acoustic or muted indie underscore"],
    lighting: ["Morning window light → warmer service rush"],
  },
  "luxury-dining": {
    shots: ["Fork lift hero bite", "Wine catch light", "Chef hands finishing plate"],
    camera: ["Locked-off elegance, minimal movement"],
    mood: ["Aspirational calm, craft over chaos"],
    pacing: ["One revelation per slide, never rush the CTA"],
    music: ["Strings pad or restrained jazz trio"],
    lighting: ["Low key, candle fill, controlled highlights"],
  },
  "rich-relationship": {
    shots: [
      "Warm overhead comfort plate",
      "Hands reaching for shared dish",
      "Steam in soft window light",
    ],
    camera: ["Static editorial frames", "Light rotation on sticker layers only"],
    mood: ["Emotionally simple, witty, relationship-coded comfort"],
    pacing: ["Top burst hook → bottom ribbon payoff per slide"],
    music: ["Soft vinyl crackle, minimal beat"],
    lighting: ["Golden hour warmth, cream highlights, gentle falloff"],
  },
};

const MODE_CAMERA: Partial<Record<ViralHookMode, string>> = {
  viral: "Snap zoom on hook line delivery",
  emotional: "Gentle handheld, stay close on faces",
  luxury: "Slider move 5% — almost still",
  founder: "Walk-and-talk through the pass",
  aesthetic: "Static frames, treat each slide as a still",
};

export function generateCreativeDirection(
  templateId: TemplateId,
  viralMode: ViralHookMode,
  niche: NichePreference = "general"
): CreativeDirection {
  const base = { ...BASE, ...TEMPLATE_DIRECTION[templateId] };
  const camera = [...(base.camera ?? [])];
  const extra = MODE_CAMERA[viralMode];
  if (extra) camera.unshift(extra);

  if (niche === "street-food") {
    base.mood = [...(base.mood ?? []), "Crowd energy, queue tension, first-bite payoff"];
  }
  if (niche === "fine-dining") {
    base.lighting = [...(base.lighting ?? []), "Specular control on plate edges"];
  }

  return {
    shots: base.shots ?? [],
    camera,
    mood: base.mood ?? [],
    pacing: base.pacing ?? [],
    music: base.music ?? [],
    lighting: base.lighting ?? [],
  };
}

export function formatCreativeDirection(dir: CreativeDirection): string[] {
  const lines: string[] = [];
  if (dir.shots.length) lines.push(`Shots: ${dir.shots.join(" · ")}`);
  if (dir.camera.length) lines.push(`Camera: ${dir.camera.join(" · ")}`);
  if (dir.mood.length) lines.push(`Mood: ${dir.mood.join(" · ")}`);
  if (dir.pacing.length) lines.push(`Pacing: ${dir.pacing.join(" · ")}`);
  if (dir.music.length) lines.push(`Sound: ${dir.music.join(" · ")}`);
  if (dir.lighting.length) lines.push(`Light: ${dir.lighting.join(" · ")}`);
  return lines;
}
