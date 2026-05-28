export type TemplateId =
  | "street-food"
  | "cinematic-dark"
  | "founder-story"
  | "luxury-dining";

export type CaptionAlignment = "left" | "center" | "right";

export type TemplateConfig = {
  id: TemplateId;
  name: string;
  badgeText: string;
  accentColor: string;
  overlayGradient: string;
  vignetteIntensity: number;
  fontScale: number;
  captionAlignment: CaptionAlignment;
  bottomFadeOpacity: number;
  accentLineWidth: number;
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
