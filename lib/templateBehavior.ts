import type { TemplateId, TemplateVisualTreatment } from "@/lib/templates";
import type { CreatorDirection } from "@/lib/creatorDirection";
import type { StoryArcId } from "@/lib/storyArc";

export type TemplateBehaviorOverrides = {
  visual: Partial<TemplateVisualTreatment>;
  fontScaleMultiplier: number;
  vignetteBoost: number;
  pacingNote: string;
};

const BEHAVIOR: Record<TemplateId, TemplateBehaviorOverrides> = {
  "luxury-dining": {
    visual: {
      captionDensity: "sparse",
      overlayIntensity: 0.85,
      grainOpacity: 0.04,
      motionFeel: "slow",
      badgeStyle: "elegant",
    },
    fontScaleMultiplier: 0.96,
    vignetteBoost: 0.08,
    pacingNote: "Restrained typography, cinematic spacing, minimal density.",
  },
  "street-food": {
    visual: {
      captionDensity: "dense",
      imageSaturation: 1.14,
      imageContrast: 1.1,
      motionFeel: "punchy",
      badgeStyle: "documentary",
    },
    fontScaleMultiplier: 1.04,
    vignetteBoost: 0,
    pacingNote: "Energetic stickers, asymmetric rhythm, retention-forward hooks.",
  },
  "cinematic-dark": {
    visual: {
      captionDensity: "sparse",
      overlayIntensity: 0.9,
      imageSaturation: 0.9,
      motionFeel: "warm",
    },
    fontScaleMultiplier: 1.06,
    vignetteBoost: 0.12,
    pacingNote: "Poetic line breaks, low density, slow emotional transitions.",
  },
  "founder-story": {
    visual: {
      captionDensity: "balanced",
      grainOpacity: 0.05,
      motionFeel: "slow",
      badgeStyle: "bold",
    },
    fontScaleMultiplier: 1.05,
    vignetteBoost: 0.04,
    pacingNote: "Documentary feel, timeline rhythm, memory-led voice.",
  },
  "rich-relationship": {
    visual: {
      captionDensity: "sparse",
      motionFeel: "editorial",
      badgeStyle: "comic-sticker",
    },
    fontScaleMultiplier: 0.94,
    vignetteBoost: 0,
    pacingNote: "Editorial stickers, floating cards, relationship-coded beats.",
  },
  "doodle-story": {
    visual: {
      captionDensity: "balanced",
      imageSaturation: 1.1,
      motionFeel: "editorial",
      badgeStyle: "comic-sticker",
    },
    fontScaleMultiplier: 0.92,
    vignetteBoost: 0,
    pacingNote:
      "LOCKED Doodle Café Stories — Pinterest doodles, #f4c430 highlights, floating editorial.",
  },
};

export function getTemplateBehavior(
  templateId: TemplateId,
  direction?: Pick<CreatorDirection, "energy" | "captionDensity" | "viralityBalance">
): TemplateBehaviorOverrides {
  const base = { ...BEHAVIOR[templateId] };
  if (!direction) return base;

  if (direction.captionDensity === "minimal") {
    base.visual = { ...base.visual, captionDensity: "sparse" };
  } else if (direction.captionDensity === "dense") {
    base.visual = { ...base.visual, captionDensity: "dense" };
  }

  if (direction.viralityBalance >= 75) {
    base.visual = {
      ...base.visual,
      imageContrast: (base.visual.imageContrast ?? 1) + 0.04,
      motionFeel: "punchy",
    };
  } else if (direction.viralityBalance <= 25) {
    base.visual = {
      ...base.visual,
      grainOpacity: Math.max(0, (base.visual.grainOpacity ?? 0.05) - 0.02),
      motionFeel: "slow",
    };
  }

  return base;
}

export function arcPacingHint(arcId: StoryArcId): string {
  switch (arcId) {
    case "luxury-escalation":
    case "emotional-reveal":
      return "Hold beats longer than comfortable.";
    case "curiosity-payoff":
    case "hidden-gem":
      return "Micro-cliffhanger every swipe.";
    default:
      return "One emotional beat per slide.";
  }
}
