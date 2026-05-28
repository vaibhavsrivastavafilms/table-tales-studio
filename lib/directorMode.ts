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
  "cozy-monsoon": {
    shots: [
      "Rain-streaked window with steam rising from chai",
      "Comfort bowl in cool blue-gold monsoon light",
      "Shared umbrella café moment",
    ],
    camera: ["Soft handheld, stay on steam and hands"],
    mood: ["Monsoon nostalgia — warm inside, rain outside"],
    pacing: ["Slow emotional beats, handwritten microcopy"],
    music: ["Rain on glass, distant thunder pad"],
    lighting: ["Cool ambient fill, warm practical on food"],
  },
  "relationship-story": {
    shots: [
      "Two hands sharing one plate",
      "Candid laugh across the table",
      "Save-this memory close-up",
    ],
    camera: ["Static editorial frames", "Sticker rhythm only"],
    mood: ["Relationship-coded comfort, witty tenderness"],
    pacing: ["Burst hook → emotional ribbon → save CTA"],
    music: ["Soft vinyl, minimal beat"],
    lighting: ["Golden hour warmth, cream highlights"],
  },
  "doodle-story": {
    shots: [
      "Overhead latte art or pastry hero",
      "Hands wrapping mug — candid café",
      "Window-side plate with soft bokeh",
      "Maggi / noodles comfort bowl — tungsten glow",
    ],
    camera: [
      "Static Pinterest frames — locked floating editorial",
      "Hand-drawn white doodle layers only",
    ],
    mood: [
      "Doodle Café — cozy cinematic",
      "Pinterest emotional warmth",
      "Premium playful editorial",
    ],
    pacing: [
      "Top-left hook → sensory beats → yellow-highlight payoff → save CTA",
    ],
    music: ["Acoustic café hum, light brush percussion"],
    lighting: [
      "Locked warm tungsten · espresso vignette · photorealistic food",
    ],
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
