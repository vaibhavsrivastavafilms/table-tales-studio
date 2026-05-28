export type TemplateId =
  | "street-food"
  | "cinematic-dark"
  | "founder-story"
  | "luxury-dining"
  | "rich-relationship";

export type CaptionAlignment = "left" | "center" | "right";
export type CaptionDensity = "sparse" | "balanced" | "dense";
export type BadgeStyle = "bold" | "elegant" | "documentary" | "comic-sticker";
export type MotionFeel = "punchy" | "slow" | "warm" | "editorial";
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
};

export type TemplateConfig = {
  id: TemplateId;
  name: string;
  category?: TemplateCategory;
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
];

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
  return templateId === "rich-relationship";
}
