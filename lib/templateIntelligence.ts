import {
  isPinterestDoodleReference,
  prefersDoodleCafeTemplate,
  scoreCafeComfort,
} from "@/lib/doodleCafeLock";
import type { StyleReference } from "@/lib/styleReference";
import type { VisualAnalysis } from "@/lib/visualAnalysis";
import type { TemplateId } from "@/lib/templates";
import { getTemplateConfig } from "@/lib/templates";

export type TemplateSuggestion = {
  template: TemplateId;
  confidence: number;
  reason: string;
  displayName: string;
};

const RULES: {
  template: TemplateId;
  displayName: string;
  score: (v: VisualAnalysis) => number;
  reason: (v: VisualAnalysis) => string;
}[] = [
  {
    template: "luxury-dining",
    displayName: "Luxury Dining",
    score: (v) => v.luxuryScore * 0.9 + (v.platingStyle === "fine dining" ? 0.15 : 0),
    reason: (v) =>
      v.luxuryScore > 0.65
        ? "Elegant plating and refined evening ambience"
        : "Warm low-key lighting suits slow luxury pacing",
  },
  {
    template: "street-food",
    displayName: "Street Food",
    score: (v) => v.streetFoodScore * 0.92 + (v.energy === "high" ? 0.1 : 0),
    reason: (v) =>
      v.streetFoodScore > 0.55
        ? "High energy and documentary contrast read street-ready"
        : "Bright frames with punchy food energy",
  },
  {
    template: "cinematic-dark",
    displayName: "Cinematic Dark",
    score: (v) =>
      (v.brightness < 0.42 ? 0.55 : 0.2) +
      (v.warmth > 0.55 && v.brightness < 0.5 ? 0.35 : 0),
    reason: (v) =>
      v.warmth > 0.6 && v.brightness < 0.45
        ? "Warm shadows and monsoon café intimacy"
        : "Moody contrast for poetic food storytelling",
  },
  {
    template: "founder-story",
    displayName: "Founder Story",
    score: (v) =>
      0.25 +
      (v.energy === "slow" ? 0.25 : 0) +
      (v.luxuryScore < 0.5 && v.streetFoodScore < 0.5 ? 0.2 : 0),
    reason: () => "Personal origin arcs pair well with authentic brand voice",
  },
  {
    template: "rich-relationship",
    displayName: "Rich Relationship",
    score: (v) =>
      v.warmth * 0.55 +
      (v.brightness > 0.45 && v.brightness < 0.72 ? 0.25 : 0.1) +
      (v.luxuryScore < 0.55 ? 0.15 : 0),
    reason: (v) =>
      v.warmth > 0.55
        ? "Warm photography suits emotional editorial sticker storytelling"
        : "Playful comfort-food mood fits relationship-style captions",
  },
  {
    template: "doodle-story",
    displayName: "Doodle Café Stories",
    score: (v) => {
      const cafe = v.cafeComfortScore ?? scoreCafeComfort(v);
      return (
        cafe * 0.72 +
        v.warmth * 0.22 +
        (v.brightness > 0.4 && v.brightness < 0.76 ? 0.12 : 0.04)
      );
    },
    reason: (v) => {
      const cafe = v.cafeComfortScore ?? scoreCafeComfort(v);
      if (prefersDoodleCafeTemplate(v) || cafe > 0.62) {
        return "Warm café comfort — locked Pinterest doodle editorial carousel";
      }
      return "Cozy cinematic frames suit hand-drawn café storytelling overlays";
    },
  },
];

export function suggestTemplate(analysis: VisualAnalysis): TemplateSuggestion {
  const ranked = RULES.map((r) => ({
    template: r.template,
    displayName: r.displayName,
    confidence: Math.min(0.98, Math.max(0.55, r.score(analysis))),
    reason: r.reason(analysis),
  })).sort((a, b) => b.confidence - a.confidence);

  return ranked[0] ?? {
    template: "street-food",
    confidence: 0.72,
    reason: "Versatile cinematic street-food energy",
    displayName: "Street Food",
  };
}

export function getTemplateConfidence(
  analysis: VisualAnalysis,
  templateId: TemplateId
): number {
  const rule = RULES.find((r) => r.template === templateId);
  return rule ? Math.min(0.98, Math.max(0.5, rule.score(analysis))) : 0.6;
}

export function explainTemplateChoice(
  analysis: VisualAnalysis,
  templateId: TemplateId
): string {
  const rule = RULES.find((r) => r.template === templateId);
  if (rule) return rule.reason(analysis);
  return `${getTemplateConfig(templateId).name} fits your visual mood.`;
}

function styleTemplateBoost(
  style: StyleReference,
  template: TemplateId
): number {
  const tone = style.emotionalTone.toLowerCase();
  const aesthetic = style.aesthetic.toLowerCase();
  if (template === "luxury-dining" && (tone.includes("refined") || aesthetic.includes("luxury"))) {
    return 0.12;
  }
  if (template === "street-food" && (tone.includes("viral") || aesthetic.includes("street"))) {
    return 0.14;
  }
  if (template === "cinematic-dark" && (tone.includes("cinematic") || aesthetic.includes("dark"))) {
    return 0.1;
  }
  if (
    template === "rich-relationship" &&
    (style.textPlacement.floatingCards || style.stickerStyle.includes("comic"))
  ) {
    return 0.16;
  }
  if (
    template === "doodle-story" &&
    isPinterestDoodleReference(
      style.aesthetic,
      style.editorialFeel,
      style.stickerStyle
    )
  ) {
    return 0.22;
  }
  if (
    template === "doodle-story" &&
    (style.aesthetic.includes("editorial") || style.aesthetic.includes("café"))
  ) {
    return 0.16;
  }
  if (template === "founder-story" && style.captionDensity === "balanced") {
    return 0.06;
  }
  return 0;
}

/** Blend food-photo analysis with optional reference-carousel language. */
export function suggestTemplateWithStyle(
  analysis: VisualAnalysis,
  styleReference?: StyleReference | null,
  lockedTemplateId?: TemplateId
): TemplateSuggestion {
  if (lockedTemplateId) {
    const config = getTemplateConfig(lockedTemplateId);
    const confidence = getTemplateConfidence(analysis, lockedTemplateId);
    const styleNote = styleReference
      ? ` Blended with reference: ${styleReference.aesthetic}.`
      : "";
    return {
      template: lockedTemplateId,
      confidence,
      reason: explainTemplateChoice(analysis, lockedTemplateId) + styleNote,
      displayName: config.name,
    };
  }

  if (!styleReference) return suggestTemplate(analysis);

  const ranked = RULES.map((r) => {
    const base = Math.min(0.98, Math.max(0.55, r.score(analysis)));
    const boosted = Math.min(0.98, base + styleTemplateBoost(styleReference, r.template));
    return {
      template: r.template,
      displayName: r.displayName,
      confidence: boosted,
      reason: `${r.reason(analysis)} Reference style adds ${styleReference.compositionStyle}.`,
    };
  }).sort((a, b) => b.confidence - a.confidence);

  return ranked[0] ?? suggestTemplate(analysis);
}
