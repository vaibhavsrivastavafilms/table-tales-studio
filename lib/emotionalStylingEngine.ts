import type { AiDesignModeId } from "@/lib/aiDesignModes";
import type { TemplateId } from "@/lib/templates";
import { isDoodleStoryTemplate, isRichRelationshipTemplate } from "@/lib/templates";
import type { VisualAnalysis } from "@/lib/visualAnalysis";

export type EmotionalStyleId =
  | "luxury"
  | "street-food"
  | "cozy-cafe"
  | "pinterest-relationship"
  | "cinematic-dark"
  | "editorial-doodle";

export type EmotionalStyleProfile = {
  id: EmotionalStyleId;
  label: string;
  spacing: "airy" | "balanced" | "tight";
  doodleDensity: number;
  typographyScale: number;
  overlayWarmth: number;
  gradientStrength: number;
  stickerEnergy: number;
  captionRhythm: "calm" | "punchy" | "crescendo";
  accentColor: string;
  highlightColor: string;
  photoContrast: number;
  photoSaturation: number;
  grain: number;
};

const PROFILES: Record<EmotionalStyleId, EmotionalStyleProfile> = {
  luxury: {
    id: "luxury",
    label: "Luxury editorial",
    spacing: "airy",
    doodleDensity: 0.35,
    typographyScale: 0.92,
    overlayWarmth: 0.45,
    gradientStrength: 0.55,
    stickerEnergy: 0.25,
    captionRhythm: "calm",
    accentColor: "#c9a962",
    highlightColor: "#e8d5a8",
    photoContrast: 1.04,
    photoSaturation: 0.95,
    grain: 0.04,
  },
  "street-food": {
    id: "street-food",
    label: "Street energy",
    spacing: "tight",
    doodleDensity: 0.85,
    typographyScale: 1.08,
    overlayWarmth: 0.35,
    gradientStrength: 0.72,
    stickerEnergy: 0.9,
    captionRhythm: "punchy",
    accentColor: "#f7c600",
    highlightColor: "#ffe566",
    photoContrast: 1.1,
    photoSaturation: 1.12,
    grain: 0.07,
  },
  "cozy-cafe": {
    id: "cozy-cafe",
    label: "Cozy café",
    spacing: "balanced",
    doodleDensity: 0.72,
    typographyScale: 0.98,
    overlayWarmth: 0.88,
    gradientStrength: 0.65,
    stickerEnergy: 0.55,
    captionRhythm: "calm",
    accentColor: "#f4c430",
    highlightColor: "#f4c430",
    photoContrast: 1.02,
    photoSaturation: 1.05,
    grain: 0.06,
  },
  "pinterest-relationship": {
    id: "pinterest-relationship",
    label: "Pinterest relationship",
    spacing: "balanced",
    doodleDensity: 0.78,
    typographyScale: 1,
    overlayWarmth: 0.75,
    gradientStrength: 0.6,
    stickerEnergy: 0.65,
    captionRhythm: "crescendo",
    accentColor: "#f4c430",
    highlightColor: "#f4c430",
    photoContrast: 1.03,
    photoSaturation: 1.08,
    grain: 0.05,
  },
  "cinematic-dark": {
    id: "cinematic-dark",
    label: "Cinematic dark",
    spacing: "airy",
    doodleDensity: 0.4,
    typographyScale: 1.05,
    overlayWarmth: 0.25,
    gradientStrength: 0.85,
    stickerEnergy: 0.35,
    captionRhythm: "calm",
    accentColor: "#a78bfa",
    highlightColor: "#c4b5fd",
    photoContrast: 1.08,
    photoSaturation: 0.9,
    grain: 0.1,
  },
  "editorial-doodle": {
    id: "editorial-doodle",
    label: "Doodle café editorial",
    spacing: "balanced",
    doodleDensity: 0.82,
    typographyScale: 0.94,
    overlayWarmth: 0.92,
    gradientStrength: 0.58,
    stickerEnergy: 0.7,
    captionRhythm: "crescendo",
    accentColor: "#f4c430",
    highlightColor: "#f4c430",
    photoContrast: 1.02,
    photoSaturation: 1.06,
    grain: 0.055,
  },
};

export function resolveEmotionalStyle(input: {
  templateId: TemplateId;
  analysis: VisualAnalysis;
  mode?: AiDesignModeId;
  mood?: string;
}): EmotionalStyleProfile {
  if (isDoodleStoryTemplate(input.templateId)) {
    return PROFILES["editorial-doodle"];
  }
  if (isRichRelationshipTemplate(input.templateId)) {
    return PROFILES["pinterest-relationship"];
  }
  if (input.templateId === "cozy-monsoon") return PROFILES["cozy-cafe"];
  if (input.templateId === "luxury-dining") return PROFILES.luxury;
  if (input.templateId === "street-food") return PROFILES["street-food"];
  if (input.templateId === "cinematic-dark") return PROFILES["cinematic-dark"];
  if (input.templateId === "founder-story") return PROFILES["cozy-cafe"];

  const m = (input.mood ?? input.analysis.mood ?? "").toLowerCase();
  if (m.includes("cozy") || m.includes("café") || m.includes("cafe")) {
    return PROFILES["cozy-cafe"];
  }
  if (input.analysis.luxuryScore > 0.6) return PROFILES.luxury;
  if (input.analysis.streetFoodScore > 0.55) return PROFILES["street-food"];

  return PROFILES["editorial-doodle"];
}
