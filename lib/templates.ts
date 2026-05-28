export type TemplateId =
  | "street-food"
  | "cinematic-dark"
  | "founder-story"
  | "luxury-dining"
  | "rich-relationship"
  | "doodle-story"
  | "cozy-monsoon"
  | "relationship-story";

export type CaptionAlignment = "left" | "center" | "right";
export type CaptionDensity = "sparse" | "balanced" | "dense";
export type BadgeStyle = "bold" | "elegant" | "documentary" | "comic-sticker";
export type MotionFeel = "punchy" | "slow" | "warm" | "editorial";
export type TypographyStyleId =
  | "bold-sans"
  | "editorial-handwritten"
  | "elegant-serif"
  | "documentary";
export type StickerStyleId = "minimal" | "comic" | "doodle" | "burst";
export type CompositionStyleId =
  | "center-band"
  | "floating-editorial"
  | "asymmetric";

/** Optional doodle / editorial visual metadata (doodle-story). */
export type DoodleVisualExtras = {
  saturationBoost?: number;
  contrastBoost?: number;
  typographyStyle?: TypographyStyleId;
  stickerStyle?: StickerStyleId;
  borderRadius?: number;
  emotionalTone?: string;
  composition?: CompositionStyleId;
};
export type TemplateCategory =
  | "Street"
  | "Cinematic"
  | "Founder"
  | "Luxury"
  | "Emotional Editorial";

export type TemplateVisualTreatment = {
  overlayIntensity: number;
  captionDensity: CaptionDensity;
  imageContrast: number;
  imageSaturation: number;
  grainOpacity: number;
  glowStrength: number;
  badgeStyle: BadgeStyle;
  motionFeel: MotionFeel;
} & DoodleVisualExtras;

export type TemplateConfig = {
  id: TemplateId;
  name: string;
  category?: TemplateCategory;
  /** Short marketplace / director description */
  description?: string;
  badgeText: string;
  accentColor: string;
  overlayGradient: string;
  vignetteIntensity: number;
  fontScale: number;
  captionAlignment: CaptionAlignment;
  bottomFadeOpacity: number;
  accentLineWidth: number;
  visual: TemplateVisualTreatment;
};

export const TEMPLATE_LIST: TemplateConfig[] = [
  {
    id: "street-food",
    name: "Street Food",
    badgeText: "Street Food",
    accentColor: "#f7c600",
    overlayGradient:
      "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 38%, rgba(0,0,0,0.5) 72%, rgba(0,0,0,0.9) 100%)",
    vignetteIntensity: 0.5,
    fontScale: 1,
    captionAlignment: "center",
    bottomFadeOpacity: 0.88,
    accentLineWidth: 48,
    visual: {
      overlayIntensity: 0.72,
      captionDensity: "balanced",
      imageContrast: 1.08,
      imageSaturation: 1.12,
      grainOpacity: 0.06,
      glowStrength: 0.35,
      badgeStyle: "documentary",
      motionFeel: "punchy",
    },
  },
  {
    id: "cinematic-dark",
    name: "Cinematic Dark",
    badgeText: "Cinematic",
    accentColor: "#a78bfa",
    overlayGradient:
      "linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(20,10,40,0.25) 40%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.95) 100%)",
    vignetteIntensity: 0.65,
    fontScale: 1.05,
    captionAlignment: "center",
    bottomFadeOpacity: 0.92,
    accentLineWidth: 56,
    visual: {
      overlayIntensity: 0.88,
      captionDensity: "sparse",
      imageContrast: 1.05,
      imageSaturation: 0.92,
      grainOpacity: 0.1,
      glowStrength: 0.5,
      badgeStyle: "elegant",
      motionFeel: "warm",
    },
  },
  {
    id: "founder-story",
    name: "Founder Story",
    badgeText: "Founder",
    accentColor: "#38bdf8",
    overlayGradient:
      "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.4) 68%, rgba(0,0,0,0.85) 100%)",
    vignetteIntensity: 0.45,
    fontScale: 1.08,
    captionAlignment: "left",
    bottomFadeOpacity: 0.82,
    accentLineWidth: 40,
    visual: {
      overlayIntensity: 0.65,
      captionDensity: "balanced",
      imageContrast: 1.02,
      imageSaturation: 1,
      grainOpacity: 0.04,
      glowStrength: 0.28,
      badgeStyle: "bold",
      motionFeel: "slow",
    },
  },
  {
    id: "luxury-dining",
    name: "Luxury Dining",
    badgeText: "Luxury",
    accentColor: "#d4af37",
    overlayGradient:
      "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(30,20,0,0.15) 38%, rgba(0,0,0,0.48) 72%, rgba(0,0,0,0.92) 100%)",
    vignetteIntensity: 0.55,
    fontScale: 1.02,
    captionAlignment: "center",
    bottomFadeOpacity: 0.9,
    accentLineWidth: 52,
    visual: {
      overlayIntensity: 0.82,
      captionDensity: "sparse",
      imageContrast: 1.04,
      imageSaturation: 0.95,
      grainOpacity: 0.05,
      glowStrength: 0.42,
      badgeStyle: "elegant",
      motionFeel: "slow",
    },
  },
  {
    id: "rich-relationship",
    name: "Rich Relationship",
    category: "Emotional Editorial",
    badgeText: "Editorial",
    accentColor: "#e8c4a0",
    overlayGradient:
      "linear-gradient(180deg, rgba(255,248,240,0.12) 0%, transparent 28%, transparent 62%, rgba(20,12,8,0.35) 100%)",
    vignetteIntensity: 0.22,
    fontScale: 0.95,
    captionAlignment: "center",
    bottomFadeOpacity: 0.35,
    accentLineWidth: 0,
    visual: {
      overlayIntensity: 0.18,
      captionDensity: "sparse",
      imageContrast: 1.08,
      imageSaturation: 1.04,
      grainOpacity: 0.02,
      glowStrength: 0.12,
      badgeStyle: "comic-sticker",
      motionFeel: "editorial",
    },
  },
  {
    id: "cozy-monsoon",
    name: "Cozy Monsoon",
    badgeText: "Monsoon",
    accentColor: "#7eb8c9",
    overlayGradient:
      "linear-gradient(180deg, rgba(12,28,36,0.55) 0%, rgba(80,120,140,0.12) 38%, rgba(8,20,28,0.45) 72%, rgba(4,12,18,0.88) 100%)",
    vignetteIntensity: 0.48,
    fontScale: 1.02,
    captionAlignment: "left",
    bottomFadeOpacity: 0.84,
    accentLineWidth: 36,
    visual: {
      overlayIntensity: 0.7,
      captionDensity: "balanced",
      imageContrast: 1.03,
      imageSaturation: 0.98,
      grainOpacity: 0.05,
      glowStrength: 0.22,
      badgeStyle: "elegant",
      motionFeel: "slow",
    },
  },
  {
    id: "relationship-story",
    name: "Relationship Story",
    category: "Emotional Editorial",
    badgeText: "Story",
    accentColor: "#e8b4a0",
    overlayGradient:
      "linear-gradient(180deg, rgba(255,248,240,0.14) 0%, transparent 30%, transparent 60%, rgba(24,14,10,0.38) 100%)",
    vignetteIntensity: 0.24,
    fontScale: 0.96,
    captionAlignment: "center",
    bottomFadeOpacity: 0.38,
    accentLineWidth: 0,
    visual: {
      overlayIntensity: 0.2,
      captionDensity: "sparse",
      imageContrast: 1.07,
      imageSaturation: 1.05,
      grainOpacity: 0.02,
      glowStrength: 0.14,
      badgeStyle: "comic-sticker",
      motionFeel: "editorial",
    },
  },
  {
    id: "doodle-story",
    name: "Doodle Café",
    category: "Emotional Editorial",
    description:
      "AI art-directed café storytelling — real food photos with generated hand-drawn overlay layers",
    badgeText: "Café",
    accentColor: "#f4c430",
    overlayGradient:
      "linear-gradient(180deg, rgba(26,18,12,0.42) 0%, transparent 32%, transparent 55%, rgba(26,18,12,0.5) 100%)",
    vignetteIntensity: 0.28,
    fontScale: 0.92,
    captionAlignment: "left",
    bottomFadeOpacity: 0.48,
    accentLineWidth: 0,
    visual: {
      overlayIntensity: 0.18,
      captionDensity: "balanced",
      imageContrast: 1.07,
      imageSaturation: 1.09,
      saturationBoost: 0.08,
      contrastBoost: 0.06,
      grainOpacity: 0.02,
      glowStrength: 0.04,
      badgeStyle: "comic-sticker",
      motionFeel: "editorial",
      typographyStyle: "editorial-handwritten",
      stickerStyle: "doodle",
      borderRadius: 28,
      emotionalTone: "cozy-editorial",
      composition: "floating-editorial",
    },
  },
];

/** Locked Doodle Café Stories photo + overlay tokens */
export { getLockedPhotoTreatment as getDoodleStoryVisualTreatment } from "@/lib/doodleCafeLock";

const byId = new Map(TEMPLATE_LIST.map((t) => [t.id, t]));
const byName = new Map(TEMPLATE_LIST.map((t) => [t.name, t]));

export const DEFAULT_TEMPLATE_ID: TemplateId = "street-food";

export function getTemplateConfig(
  templateIdOrName: string
): TemplateConfig {
  return (
    byId.get(templateIdOrName as TemplateId) ??
    byName.get(templateIdOrName) ??
    TEMPLATE_LIST[0]
  );
}

export function getTemplateId(templateIdOrName: string): TemplateId {
  const config = getTemplateConfig(templateIdOrName);
  return config.id;
}

export function isRichRelationshipTemplate(
  templateId: string | undefined
): boolean {
  return templateId === "rich-relationship" || templateId === "relationship-story";
}

export function isDoodleStoryTemplate(
  templateId: string | undefined
): boolean {
  return templateId === "doodle-story";
}

/** Editorial carousel layouts with sticker/doodle overlays on photography. */
export function isEditorialCarouselTemplate(
  templateId: string | undefined
): boolean {
  return (
    templateId === "rich-relationship" ||
    templateId === "relationship-story" ||
    templateId === "doodle-story"
  );
}
