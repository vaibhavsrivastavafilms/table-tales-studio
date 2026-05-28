import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type AiDesignModeId =
  | "doodle-cafe-story"
  | "emotional-food-journal"
  | "pinterest-relationship"
  | "cozy-monsoon-cafe"
  | "sketchbook-dining"
  | "handwritten-memory-reel";

export type AiDesignMode = {
  id: AiDesignModeId;
  label: string;
  description: string;
  promptTone: string;
};

export const AI_DESIGN_MODES: AiDesignMode[] = [
  {
    id: "doodle-cafe-story",
    label: "Doodle Café Story",
    description: "Pinterest café doodles on warm food photography",
    promptTone:
      "warm cinematic café editorial, white hand-drawn sketch doodles, yellow comic accents",
  },
  {
    id: "emotional-food-journal",
    label: "Emotional Food Journal",
    description: "Memory-like handwritten food storytelling",
    promptTone:
      "emotional food journal, delicate white line art, nostalgic handwritten frames",
  },
  {
    id: "pinterest-relationship",
    label: "Pinterest Relationship Story",
    description: "Couple café energy, playful editorial stickers",
    promptTone:
      "Pinterest relationship food story, sketch people, hearts, conversation bubbles",
  },
  {
    id: "cozy-monsoon-cafe",
    label: "Cozy Monsoon Café",
    description: "Rainy window warmth, steam, intimate café mood",
    promptTone:
      "cozy monsoon café mood, steam swirls, warm tungsten, intimate hand-drawn overlays",
  },
  {
    id: "sketchbook-dining",
    label: "Sketchbook Dining",
    description: "Premium sketchbook dining illustrations",
    promptTone:
      "sketchbook fine dining, elegant white ink lines, restrained editorial luxury",
  },
  {
    id: "handwritten-memory-reel",
    label: "Handwritten Memory Reel",
    description: "Flowing memory reel with arrows and frames",
    promptTone:
      "handwritten memory reel, mood arrows, polaroid frames, white doodle storytelling flow",
  },
];

export const DEFAULT_AI_DESIGN_MODE: AiDesignModeId = "doodle-cafe-story";

export function getAiDesignMode(id: AiDesignModeId): AiDesignMode {
  return AI_DESIGN_MODES.find((m) => m.id === id) ?? AI_DESIGN_MODES[0];
}

export function suggestAiDesignMode(analysis: VisualAnalysis): AiDesignModeId {
  const c = (analysis.cuisine ?? "").toLowerCase();
  const m = (analysis.mood ?? "").toLowerCase();
  if (m.includes("cozy") || m.includes("monsoon") || analysis.lighting?.includes("tungsten")) {
    return "cozy-monsoon-cafe";
  }
  if (analysis.luxuryScore > 0.65) return "sketchbook-dining";
  if (/café|cafe|coffee/.test(c)) return "doodle-cafe-story";
  if (analysis.warmth > 0.62) return "pinterest-relationship";
  if ((analysis.cafeComfortScore ?? 0) > 0.55) return "emotional-food-journal";
  return "doodle-cafe-story";
}
